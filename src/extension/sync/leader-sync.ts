/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { bundleConfig, nodecg } from '../util/nodecg'
import { compare, Operation } from 'fast-json-patch'
import { UpdateOperation, SerializedReplicant, Replicant } from './instance-sync'
import { Request, Response } from 'express'
import debounce from 'debounce'
import { randomUUID } from 'crypto'
import { clone, recordSSEStats, setupSSEStats } from './sse-util'

const toCheck: Array<Replicant & { source: Replicant }> = [
  createCheck('currentMatch', undefined, { replicantName: 'runDataActiveRun', bundleName: 'nodecg-speedcontrol' }),
  createCheck('allMatches', undefined, { replicantName: 'runDataArray', bundleName: 'nodecg-speedcontrol' }),
  createCheck('timer', undefined, { replicantName: 'timer', bundleName: 'nodecg-speedcontrol' }),
  createCheck('text-control'),
  createCheck('active-audio'),
  createCheck('world-data-target-server'),
  createCheck('world-feed-layout-url')
]

function createCheck (replicantName: string, bundleName?: string, src?: Replicant): Replicant & { source: Replicant } {
  const base = { replicantName, bundleName }
  return { ...base, source: src ?? base }
}

const activeSSEs = new Map<string, Response>()
let lastState: SerializedReplicant[] = []
const state: SerializedReplicant[] = []
interface History { issuedAt: number, patches: Operation[] }
let lastHistoryId = randomUUID()
const history = new Map<string, History>([
  [lastHistoryId, {
    issuedAt: Date.now(), patches: compare([], state)
  }]
])

export function setupLeader (): void {
  setupSSEStats()
  toCheck.forEach(check => {
    nodecg.Replicant(check.source.replicantName, check.source.bundleName).on('change', (value) => {
      onUpdate(check, check.source, value)
    })
    onUpdate(check, check.source, nodecg.readReplicant(check.source.replicantName, check.source.bundleName))
  })
  const app = nodecg.Router()
  app.get('/twc-2026/sync', serveSSE)
  nodecg.mount('/', app)
}

export function sendRemoteAdminAction (adminAction: string): void {
  for (const sse of activeSSEs.values()) {
    writeSSE({
      sse,
      event: 'admin-action',
      data: adminAction
    })
    nodecg.log.info('Sent remote admin action', adminAction)
  }
}

function onUpdate (target: Replicant, source: Replicant, data: unknown): void {
  const sameName = target.replicantName === source.replicantName
  const sameBundle = target.bundleName === source.bundleName
  if (!sameName || !sameBundle) {
    // also update ourselves
    nodecg.Replicant(target.replicantName, target.bundleName).value = clone(data)
  }

  const index = state.findIndex(repl => {
    return repl.replicantName === target.replicantName && repl.bundleName === target.bundleName
  })
  const obj = { ...target, data }
  if (index === -1) {
    nodecg.log.info('Added', source.replicantName, 'to state tracker')
    state.push(obj)
  } else {
    state[index] = obj
  }
  sendUpdates()
}

const sendUpdates = debounce(() => {
  const patches = compare(lastState, state)
  if (patches.length === 0) return
  lastState = clone(state)

  const id = randomUUID()
  lastHistoryId = id
  history.set(id, { patches, issuedAt: Date.now() })
  if (history.size > 10000) {
    nodecg.log.info('Cleaning up SSE history')
    Array.from(history).toSorted((a, b) => {
      return a[1].issuedAt - b[1].issuedAt
    }).slice(0, 5000).forEach(entry => history.delete(entry[0]))
  }
  for (const sse of [...activeSSEs.values()]) {
    writeOperation(sse, id, { op: 'patch', patches })
  }
}, 25)

function serveSSE (req: Request, sse: Response): void {
  const { clientId, syncKey } = req.query as Record<string, string>
  if (syncKey !== bundleConfig.regions.regionSyncKey) {
    nodecg.log.warn('Unauthenticated SSE request', req.ip)
    sse.sendStatus(401)
    return
  }

  nodecg.log.info('SSE initialized for', clientId)
  sse.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no' // NGINX optimization
  })
  sse.flushHeaders()
  sse.write('retry: 2000\n\n')

  activeSSEs.set(clientId, sse)
  const lastEventId = req.headers['last-event-id'] as string | undefined

  const operation = getUpdateOperation(lastEventId)
  if (operation !== undefined) {
    writeOperation(sse, operation.id, operation)
  }

  const ping = setInterval(() => {
    writeSSE({
      sse,
      event: 'ping'
    })
  }, 1000)
  req.on('close', () => {
    clearInterval(ping)
    if (activeSSEs.get(clientId) === sse) {
      activeSSEs.delete(clientId)
    }
  })
}

function writeSSE (o: {
  sse: Response
  id?: string
  event?: string
  data?: unknown
}): void {
  const data: string[] = []
  if (o.id !== undefined) data.push(`id: ${o.id}`)
  if (o.event !== undefined) data.push(`event: ${o.event}`)
  data.push(`data: ${JSON.stringify(o.data)}\n\n`)
  const message = data.join('\n')
  try {
    o.sse.write(message)
    const flushable = (o.sse as unknown as { flush?: () => void })
    flushable.flush?.()
    recordSSEStats(message.length)
  } catch (error) {
    nodecg.log.warn('Error writing SSE', error)
  }
}

function writeOperation (sse: Response, operationId: string, operation: UpdateOperation): void {
  writeSSE({
    sse,
    id: operationId,
    event: 'update',
    data: operation
  })
}

function getUpdateOperation (lastEventId: string | undefined): UpdateOperation & { id: string } | undefined {
  const id = lastHistoryId
  if (lastEventId === id) return undefined

  const clientPatch = history.get(lastEventId ?? '')
  if (clientPatch === undefined) return { op: 'full', id, state }

  const patches = history.values()
    .filter(h => h.issuedAt > clientPatch.issuedAt)
    .flatMap(h => h.patches)
    .toArray()
  return { op: 'patch', id, patches }
}
