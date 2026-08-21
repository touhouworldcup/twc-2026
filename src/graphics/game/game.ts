/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { Timer } from 'nodecg-speedcontrol/src/types'
import { querySelector, params, setText, onLoad, nodecg } from '../../shared/common'
import { TextControl } from '../../types/schemas/text-control'
import { ActiveAudio } from '../../types/schemas/active-audio'
import { TextFitOption } from 'textfit'
import { getGameDataByRun } from '../../shared/games'
import { msToString, setStretchText, match, setupStyles } from '../../graphics/graphic'
import { parseResults } from '../results/parseResults'
import { i18n } from '../i18n'
import { StreamDelay } from 'src/types/schemas/stream-delay'

const timerReplicant = nodecg.Replicant<Timer>('timer')
const textControlReplicant = nodecg.Replicant<TextControl>('text-control')
const activeAudio = nodecg.Replicant<ActiveAudio>('active-audio')
const streamDelay = nodecg.Replicant<StreamDelay>('stream-delay')
const selectedPlayers = (params.get('selectedPlayers') ?? '').split('').map(character => {
  return parseInt(character, 10)
})
const isFocusLayout = params.has('focus')

onLoad(timerReplicant, match, textControlReplicant, activeAudio, async () => {
  setupStyles(`#P${selectedPlayers.length}${isFocusLayout ? '_focus' : ''}`)
}, async () => {
  for (let i = 0; i < selectedPlayers.length; i++) {
    document.body.appendChild(querySelector<HTMLTemplateElement>('#plate').content.cloneNode(true))
  }
  document.querySelectorAll('.plate').forEach((p, i) => {
    p.id = `plate${i}`
  })
  const { game, category } = getGameDataByRun(match.value)
  setStretchText('#game', i18n.gameName(game))
  setStretchText('#category', i18n.categoryName(category))
  querySelector('#resetTimeText').innerHTML = i18n.resetTime.join('<br>')

  activeAudio.on('change', onActiveAudioChange)
  match.on('change', updatePlayerNames)
  textControlReplicant.on('change', (newValue, oldValue) => {
    void onTextControlChange(newValue, oldValue)
  })
  timerReplicant.on('change', onTimerChange)
  updateTimer()
})

const textFitOptions: TextFitOption = {
  alignVert: true,
  maxFontSize: 500
}

async function delay (): Promise<void> {
  const wait = (streamDelay.value ?? 2) * 1000
  await new Promise((resolve) => setTimeout(resolve, wait))
}

function onActiveAudioChange (streamNumber: number | undefined): void {
  if (streamNumber === undefined) return
  const index = selectedPlayers.indexOf(streamNumber)
  const element = querySelector('#audio')

  void delay().then(() => {
    element.classList.add('fadeOut')
    setTimeout(() => {
      element.classList = `fadeIn audio-${index}`
    }, 500)
  })
}

function updatePlayerNames (): void {
  const run = match.value
  const tc = textControlReplicant.value
  if (run === undefined || tc === undefined) return

  let i = 0
  for (const index of selectedPlayers) {
    const player = run.teams[index]?.players[tc.selectedPlayer - 1]
    if (player === undefined) continue
    const name = i18n.playerName(player)
    setText(`#plate${i} > .plateMiddle`, name, textFitOptions)
    i++
  }
}

async function onTextControlChange (value: TextControl | undefined, oldValue: TextControl | undefined): Promise<void> {
  if (value === undefined) return
  const tc: TextControl = JSON.parse(JSON.stringify(value))
  if (tc.selectedPlayer !== oldValue?.selectedPlayer) {
    updatePlayerNames()
  }

  await delay()
  let i = -1
  for (const index of selectedPlayers) {
    i++
    setText(`#plate${i} > .plateTop`, parseCurrentText(tc.top[index] ?? ''), textFitOptions)
    setText(`#plate${i} > .plateBottom`, parseTargetText(tc.bottom[index] ?? ''), textFitOptions)
  }

  let mode: 'game' | 'game-single-line' = 'game'
  if (selectedPlayers.length === 2 && !isFocusLayout) {
    mode = 'game-single-line'
  }
  const resultsText = parseResults({
    results: tc.results,
    run: match.value,
    mode
  })
  setText('#resultsInner', resultsText, {
    alignHoriz: true,
    alignVert: true,
    multiLine: true,
    maxFontSize: 200
  })
}

function parseCurrentText (text: string): string {
  const result = /CURRENT: ([^\s]+)(?: (.*))?/g.exec(text)
  if (result === null) return text
  return i18n.playerCurrentText({ shottype: result[1], missOrScore: result[2] })
}

function parseTargetText (text: string): string {
  const result = /TARGET(?: \(#(\d)( [Tt][Ii][Ee])?\))?: ([^\s]+)(?: (.*))?/g.exec(text)
  if (result === null) return text
  if (result[1] === undefined) return i18n.playerTargetText() // no target place
  const targetPlace = parseInt(result[1])
  const tie = result[2] === ' TIE' // trailing space important
  const target = { shottype: result[3], missOrScore: result[4] }
  return i18n.playerTargetText({ targetPlace, tie, target })
}

let lastTimer: Timer | undefined
let lastTimerUpdateTime = Date.now()

function updateTimer (): void {
  window.requestAnimationFrame(updateTimer)
  const run = match.value
  if (lastTimer === undefined || run === undefined) return

  const compensation = lastTimer.state === 'running' ? Date.now() - lastTimerUpdateTime : 0
  const ms = lastTimer.milliseconds + compensation
  const totalMs = (run.estimateS ?? 0) * 1000
  const remainingMs = Math.min(totalMs, totalMs - ms + (streamDelay.value ?? 2) * 1000)

  const remainingTime = querySelector('#remainingTime')
  const resetTimeText = querySelector('#resetTimeText')
  const finalRun = querySelector('#finalRun')
  if (remainingMs < 0) {
    resetTimeText.innerText = ''
    remainingTime.style.display = 'none'
    finalRun.innerText = getGameDataByRun(run).game.finalRunText
    finalRun.style.display = 'block'
    return
  }

  const timerText = msToString(remainingMs)
  for (let i = 0; i < 6; i++) {
    const elem = querySelector(`#remainingTimeDigit${i}`)
    const character = timerText[i]
    if (character === undefined) {
      elem.style.display = 'none'
      continue
    }
    elem.style.removeProperty('display')
    elem.style.width = character === ':' ? '20px' : '40px'
    elem.innerText = character
  }
}

function onTimerChange (timer: Timer | undefined): void {
  lastTimer = timer
  lastTimerUpdateTime = Date.now()
}
