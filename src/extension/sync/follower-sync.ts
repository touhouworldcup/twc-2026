/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { applyPatch } from 'fast-json-patch'
import { bundleConfig, nodecg } from '../util/nodecg'
import { SerializedReplicant, UpdateOperation } from './instance-sync'
import { randomUUID } from 'crypto'
import { WorldDataTargetServer } from '../../types/schemas/world-data-target-server'
import { WorldDataConnected } from '../../types/schemas/world-data-connected'
import { EventSource } from 'eventsource'
import { setupFollowerSpeedcontrol } from './follower-speedcontrol'
import { clone } from './sse-util'

let state: SerializedReplicant[] = []

const repl = nodecg.Replicant<WorldDataTargetServer>('world-data-target-server')
export function setupFollower (): void {
  repl.on('change', (newValue, oldValue) => {
    if (newValue === undefined || newValue === oldValue) return
    createEventSource()
  })
  setInterval(checkTimedOut, 500)
  setupFollowerSpeedcontrol()
}

let eventSource: EventSource | undefined
function createEventSource (): void {
  if (eventSource !== undefined) {
    eventSource.close()
  }

  lastTimeReceived = undefined
  lastReconnectTime = Date.now()
  let server = repl.value
  const config = bundleConfig.regions
  if (server === undefined || !config.allowedServers.some(s => s === server)) {
    const fallback = config.allowedServers[0]
    nodecg.log.error(`Invalid world feed server ${String(server)} falling back to ${fallback}`)
    server = fallback
  }

  const syncKey = config.regionSyncKey
  const regionUrl = config.worldServerUrl.replaceAll('{{server}}', server)
  const url = new URL(`${regionUrl}/twc-2026/sync`)
  const clientId = `${config.currentRegion}/${randomUUID()}`
  url.search = new URLSearchParams({ clientId, syncKey }).toString()
  eventSource = new EventSource(url.toString())
  eventSource.onopen = () => nodecg.log.info('Connected to world feed NodeCG')
  eventSource.onerror = () => {
    nodecg.log.info('Connection to world feed NodeCG lost')
  }
  eventSource.addEventListener('update', handleUpdate)
  eventSource.addEventListener('ping', handlePing)
  eventSource.addEventListener('admin-action', (event) => {
    const action = JSON.parse(event.data)
    nodecg.log.info('Received remote admin action', action)
    nodecg.sendMessage(action)
  })
}

function handleUpdate (event: MessageEvent): void {
  const update = JSON.parse(event.data) as UpdateOperation
  const checks = new Set<number>()
  if (update.op === 'full') {
    state = update.state
  }
  if (update.op === 'patch') {
    applyPatch(state, update.patches)
    for (const operation of update.patches) {
      const index = parseInt(operation.path.substring(1, 2))
      if (isNaN(index)) {
        checks.clear()
        break
      }
      checks.add(index)
    }
  }
  state.forEach((s, i) => {
    if (checks.size === 0 || checks.has(i)) {
      updateReplicantIfNeeded(s)
    }
  })
}

let lastTimeReceived: number | undefined
function handlePing (): void {
  lastTimeReceived = Date.now()
}

function updateReplicantIfNeeded (serialized: SerializedReplicant): void {
  const replicant = nodecg.Replicant(serialized.replicantName, serialized.bundleName, { persistent: false })
  if (JSON.stringify(replicant.value) === JSON.stringify(serialized.data)) return
  replicant.value = clone(serialized.data)
}

const connected = nodecg.Replicant<WorldDataConnected>('world-data-connected')
let lastReconnectTime: number | undefined
function checkTimedOut (): void {
  const now = Date.now()
  const isConnected = lastTimeReceived !== undefined && now - lastTimeReceived < 5000
  if (connected.value !== isConnected) {
    connected.value = isConnected
  }

  if (isConnected) return
  if (lastReconnectTime === undefined || now - lastReconnectTime > 5000) {
    nodecg.log.warn('SSE connection dead/timeout, forcing reconnect...')
    createEventSource()
  }
}
