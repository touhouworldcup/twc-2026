/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { bundleConfig, nodecg } from './util/nodecg'
import { updateRunsFromDatabase } from './db/db'
import { sendRemoteAdminAction } from './sync/leader-sync'
import { RunData } from 'nodecg-speedcontrol/src/types'
import { TextControl } from 'src/types/schemas/text-control'

export function setupAdminActions (): void {
  handle('update-runs', updateRunsFromDatabase)
  handle('reset-text-info', resetTextInfo)
  handle('reload-pages') // handled by browser pages
  handle('reboot-nodecg', async () => {
    setTimeout(() => {
      process.kill(process.pid, 'SIGINT')
    }, bundleConfig.regions.currentRegion === 'world' ? 1000 : 0)
  })
}

function handle (
  actionName: string,
  handler?: () => void | Promise<void>
): void {
  nodecg.listenFor(actionName, 'twc-2026', (subs, ack) => {
    nodecg.log.info('Executing admin action:', actionName, 'handled:', ack?.handled)
    if (ack?.handled === true) return
    if (subs === true) {
      sendRemoteAdminAction(actionName)
    }
    (async () => { await handler?.() })()
      .then(() => ack?.(undefined, true))
      .catch((error) => {
        ack?.(error, false)
        nodecg.log.error('Admin action error', error)
      })
  })
}

function resetTextInfo (): void {
  const match = nodecg.readReplicant<RunData>('currentMatch')
  const tc = nodecg.Replicant<TextControl>('text-control')
  const teams = match?.teams ?? []
  const length = teams.length
  tc.value = {
    top: Array.from({ length }, () => 'CURRENT: -'),
    bottom: Array.from({ length }, () => 'TARGET: -'),
    results: teams.map(t => {
      const tn = t.name === undefined ? '' : ` (${t.name})`
      return `${t.players[0].name}${tn}: -`
    }).join('\n'),
    selectedPlayer: 1
  }
}
