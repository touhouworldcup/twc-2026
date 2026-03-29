/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { RunData } from 'nodecg-speedcontrol/src/types'
import { i18n } from '../i18n'

export function parseResults (options: {
  results: string | undefined
  run: RunData | undefined
  mode: 'game' | 'game-single-line' | 'final-results'
}): string {
  const { results, run, mode } = options
  if (results === undefined) return ''
  if (run === undefined) return results

  const rawLines = results.split(/\r?\n/)
  const parsed = rawLines.flatMap((line) => {
    const match = /([^(:]+)(?: \(([^)]+)\))?: (-|\d+\.?\d*)(?: [Pp][Tt][Ss], ([^\s]+) (.*))?/g.exec(line)
    if (match === null) return []

    const [, playerName, , ptsString, shottype, missOrScore] = match
    const team = run?.teams.find(t => t.players[0]?.name === playerName)
    if (team === undefined) return []

    let pts: number
    if (ptsString === '-') {
      pts = -1
    } else {
      pts = parseFloat(ptsString)
    }

    if (isNaN(pts)) return []
    return [{ team, pts, shottype, missOrScore }]
  }).toSorted((a, b) => mode === 'final-results' ? b.pts - a.pts : 0)

  if (parsed.length !== rawLines.length) return results
  const samePlace = parsed.every(p => p.pts === parsed[0].pts)
  let place = 0

  const translated = parsed.map((data, index, datas) => {
    const { team, pts, shottype, missOrScore } = data
    if (datas[index - 1]?.pts !== pts && !samePlace) place++
    const placeString = mode === 'final-results' ? `#${place} ` : ''
    const player = team.players[0]
    const teamName = team.name ?? ''
    const nameAndTeam = `${i18n.playerName(player)}${teamName !== '' ? ` (${i18n.teamName(teamName)})` : ''}`
    if (pts === -1 && mode === 'final-results') return i18n.results({ nameAndTeam, result: { pts: 'DNF', shottype: '' } })

    const result = pts === -1 ? undefined : { pts: `${pts}`, shottype, missOrScore }
    const regionalText = i18n.results({ nameAndTeam, result })
    return `${placeString}${regionalText}`
  })

  const singleLine = mode === 'game-single-line'
  const lines = translated.map(line => singleLine ? line.replaceAll('\n', ', ') : line).join(singleLine ? '\n' : '\n\n')
  return mode === 'final-results' ? `${i18n.finalResults}\n\n${lines}` : lines
}
