/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { RunDataActiveRun, RunDataArray } from 'nodecg-speedcontrol/src/types'
import { nodecg } from '../util/nodecg'

const runDataActiveRun = nodecg.Replicant<RunDataActiveRun>('runDataActiveRun', 'nodecg-speedcontrol')
const runDataArray = nodecg.Replicant<RunDataArray>('runDataArray', 'nodecg-speedcontrol')
const currentMatch = nodecg.Replicant<RunDataActiveRun>('currentMatch')
export function setupFollowerSpeedcontrol (): void {
  currentMatch.on('change', update)
}

function update (match: RunDataActiveRun): void {
  if (match === undefined) return
  if (JSON.stringify(runDataActiveRun.value) === JSON.stringify(match)) return
  const speedcontrol = (c: string, d?: unknown): void => nodecg.sendMessageToBundle(c, 'nodecg-speedcontrol', d)

  for (const run of runDataArray.value ?? []) {
    if (run.id === match.id) continue
    speedcontrol('removeRun', run.id)
  }
  speedcontrol('modifyRun', { runData: match, updateTwitch: false })
  if (runDataActiveRun.value?.id !== match.id) speedcontrol('changeActiveRun', match.id)
  nodecg.log.info('Updated speedcontrol active run')
}
