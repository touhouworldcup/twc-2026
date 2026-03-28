/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { RunData } from 'nodecg-speedcontrol/src/types'
import { querySelector, setText, onLoad, nodecg, params } from '../../shared/common'
import { getGameDataByRun } from '../../shared/games'
import { match as matchReplicant, msToString, setGameColor } from '../graphic'
import { i18n } from '../i18n'

const allMatches = nodecg.Replicant<RunData[]>('allMatches')
onLoad(matchReplicant, allMatches, async () => {
  const match = getMatch()
  if (match === undefined) return
  setGameColor(match)
  const { game, category } = getGameDataByRun(match)
  setText('#game', `${game.japaneseName} ~ ${game.englishName}`)
  setText('#category', i18n.categoryName(category))

  for (let i = 0; i < 5; i++) {
    setPlayer(match, i)
  }

  let prev: HTMLElement | undefined
  for (const plate of document.querySelectorAll<HTMLElement>('.player')) {
    if (prev === undefined) {
      prev = plate
      continue
    }

    const vs = document.createElement('span')
    vs.classList = 'vs'
    vs.innerText = 'vs'
    const container = plate.parentElement as HTMLElement
    container.insertBefore(vs, plate)

    const nameWidth = querySelector('.name', prev).offsetWidth
    const teamWidth = querySelector('.team', prev).offsetWidth
    let marginLeft = 20 + nameWidth - teamWidth
    if (marginLeft > 20) marginLeft = 20
    if (marginLeft < 0) marginLeft = 0
    vs.style.marginLeft = `${marginLeft}px`
  }

  await new Promise(resolve => setTimeout(resolve, 100))
  scalePlayerContainer()
  setMatchTime(match)
})

function getMatch (): RunData | undefined {
  const match = matchReplicant.value
  if (match === undefined) return
  const matches = allMatches.value
  if (matches === undefined) return match
  const index = matches.findIndex(m => m.id === match.id)
  if (index === undefined) return match
  const upcomingIndex = index + parseInt(params.get('next') ?? '0')
  const upcomingMatch = matches[upcomingIndex]
  if (upcomingMatch === undefined) throw new Error(`no match with index ${upcomingIndex}`)
  return upcomingMatch
}

function setPlayer (run: RunData, i: number): void {
  const team = run.teams[i]
  if (team === undefined) return
  const players = team.players
  if (players.length === 0) return

  const plate = document.createElement('div')
  plate.className = 'player'
  plate.appendChild(querySelector<HTMLTemplateElement>('#player').content.cloneNode(true))
  querySelector('#playersContainer').appendChild(plate)
  const teamElem = querySelector('.team', plate)
  const teamName = team.name ?? ''
  teamElem.setAttribute('team', teamName)
  setText(teamElem, i18n.teamName(teamName))

  const nameElem = querySelector('.name', plate)
  setText(nameElem, players.length === 1
    ? i18n.playerName(players[0])
    : players.map(player => i18n.playerName(player)).join(', ')
  )
}

function scalePlayerContainer (): void {
  const elem = querySelector('#playersContainer')
  const { width } = elem.getBoundingClientRect()
  const scale = Math.min(1, 1580 / width)
  elem.style.transform = `scale(${scale})`
}

function setMatchTime (match: RunData): void {
  const dateString = match.customData.startTime
  if (dateString === undefined) return
  const matchTime = Date.parse(dateString)
  let remaining = (matchTime - Date.now())
  if (remaining < 0) {
    remaining = 0
  }

  if (remaining > 6000000) {
    const { day, time, timezone } = i18n.localTime(new Date(matchTime))
    querySelector('#time-nextmatch').style.display = ''
    setText('#day', day)
    setTimer(time)
    setText('#timezone', timezone)
  } else {
    querySelector('#time-nextmatch').style.display = 'none'
    setTimer(msToString(remaining))
    const delay = remaining + 50 - Math.floor(remaining / 1000) * 1000
    setTimeout(() => setMatchTime(match), delay)
  }
}

function setTimer (text: string): void {
  text.split('').forEach((digit, index) => {
    setText(`#timer${index}`, digit)
  })
}
