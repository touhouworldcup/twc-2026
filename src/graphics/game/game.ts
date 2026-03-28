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

const timerReplicant = nodecg.Replicant<Timer>('timer')
const textControlReplicant = nodecg.Replicant<TextControl>('text-control')
const activeAudio = nodecg.Replicant<ActiveAudio>('active-audio')
const selectedPlayers = (params.get('selectedPlayers') ?? '').split('').map(character => {
  return parseInt(character, 10)
})

onLoad(timerReplicant, match, textControlReplicant, activeAudio, async () => {
  setupStyles(`#P${selectedPlayers.length}`)
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
  textControlReplicant.on('change', onTextControlChange)
  timerReplicant.on('change', onTimerChange)
  updateTimer()
})

const textFitOptions: TextFitOption = {
  alignVert: true,
  maxFontSize: 500
}

function onActiveAudioChange (streamNumber: number | undefined): void {
  if (streamNumber === undefined) return
  const index = selectedPlayers.indexOf(streamNumber)
  const element = querySelector('#audio')
  element.classList.add('fadeOut')
  setTimeout(() => {
    element.classList = `fadeIn audio-${index}`
  }, 500)
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

function onTextControlChange (tc: TextControl | undefined, oldTc: TextControl | undefined): void {
  if (tc === undefined) return
  let i = -1
  for (const index of selectedPlayers) {
    i++
    setText(`#plate${i} > .plateTop`, parseCurrentText(tc.top[index] ?? ''), textFitOptions)
    setText(`#plate${i} > .plateBottom`, parseTargetText(tc.bottom[index] ?? ''), textFitOptions)
  }

  const resultsText = parseResults({
    results: tc.results,
    run: match.value,
    mode: selectedPlayers.length !== 2 ? 'game' : 'game-single-line'
  })
  setText('#resultsInner', resultsText, {
    alignHoriz: true,
    alignVert: true,
    multiLine: true,
    maxFontSize: 200
  })

  if (tc.selectedPlayer !== oldTc?.selectedPlayer) {
    updatePlayerNames()
  }
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

  let ms = lastTimer.milliseconds
  if (lastTimer.state === 'running') {
    ms += Date.now() - lastTimerUpdateTime
  }

  const totalMs = (run.estimateS ?? 0) * 1000
  const remainingMs = totalMs - ms

  const remainingTime = querySelector('#remainingTime')
  const resetTimeText = querySelector('#resetTimeText')
  const finalRun = querySelector('#finalRun')
  if (remainingMs < 0) {
    resetTimeText.innerText = ''
    remainingTime.style.display = 'none'
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
