/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg, querySelector } from '../../shared/common'
import { RunData } from 'nodecg-speedcontrol/src/types'
import { TextControl } from '../../types/schemas/text-control'
import { loadWorldFeedDashboard } from '../dashboard'

const MAX_PLAYERS = 3
const runReplicant = nodecg.Replicant<RunData>('currentMatch')
const textControlReplicant = nodecg.Replicant<TextControl>('text-control')
loadWorldFeedDashboard(runReplicant, textControlReplicant, () => {
  for (const elem of document.getElementsByClassName('update')) {
    (elem as HTMLButtonElement).onclick = update
  }
  runReplicant.on('change', (run) => {
    for (let i = 0; i < MAX_PLAYERS; i++) {
      querySelector(`#p${i}_middle`).innerText = run?.teams[i]?.players?.[0].name ?? ''
    }
  })
  textControlReplicant.on('change', (tc) => {
    if (tc === undefined) return

    for (let i = 0; i < MAX_PLAYERS; i++) {
      querySelector<HTMLInputElement>(`#p${i}_top`).value = tc.top[i] ?? ''
      querySelector<HTMLInputElement>(`#p${i}_bottom`).value = tc.bottom[i] ?? ''
    }

    querySelector<HTMLTextAreaElement>('#results').value = tc.results ?? ''
    querySelector<HTMLTextAreaElement>('#player-N').value = `${tc.selectedPlayer}`
  })
})

function update (): void {
  let selectedPlayer = parseInt(querySelector<HTMLTextAreaElement>('#player-N').value, 10)
  if (isNaN(selectedPlayer)) selectedPlayer = 1
  textControlReplicant.value = {
    top: [0, 1, 2].map(num => querySelector<HTMLInputElement>(`#p${num}_top`).value),
    bottom: [0, 1, 2].map(num => querySelector<HTMLInputElement>(`#p${num}_bottom`).value),
    results: querySelector<HTMLInputElement>('#results').value,
    selectedPlayer
  }
}
