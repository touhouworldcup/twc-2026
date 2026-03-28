import { RunDataPlayer } from 'nodecg-speedcontrol/src/types'
import { Game } from 'src/shared/games'

export interface CreditScore {
  shottype: string
  missOrScore?: string
}

export interface CreditResult extends CreditScore {
  pts: string
}

export interface Song { title: string, artist: string, albumArtist: string }
export interface LocalDateTimeDisplay { time: string, day: string, timezone: string }
export interface I18N {
  nowPlaying: (s: Song) => string
  playerCurrentText: (s: CreditScore) => string
  playerTargetText: (p?: { targetPlace: number, tie: boolean, target: CreditScore }) => string
  results: (p: { nameAndTeam: string, result?: CreditResult }) => string
  artwork: (a: string) => string
  teamName: (t: string) => string
  playerName: (p: RunDataPlayer) => string
  gameName: (g: Game) => string
  categoryName: (c: string) => string
  localTime: (date: Date) => LocalDateTimeDisplay
  resetTime: string[]
  finalResults: string
}

export function categoryNames (lnb: string, ls: string, es: string, qualifier: string): (c: string) => string {
  return (c) => {
    c = c.replaceAll('Lunatic No Bomb', lnb)
    c = c.replaceAll('Lunatic Survival', lnb)
    c = c.replaceAll('Lunatic Scoring', ls)
    c = c.replaceAll('Extra Scoring', es)
    c = c.replaceAll('Qualifier', qualifier)
    return c
  }
}

export function results (noScore: string, decimals: string): (p: { nameAndTeam: string, result?: CreditResult }) => string {
  return (p) => {
    if (p.result?.pts === 'DNF') return `${p.nameAndTeam}: DNF`
    const scoreDisplay = p.result === undefined ? noScore : `${formatScore(p.result, decimals)}`
    const pts = p.result === undefined ? '-' : p.result.pts
    return `${p.nameAndTeam}: ${pts} PTS\n${scoreDisplay}`
  }
}

export function getPlayerName (player: RunDataPlayer, ...order: Array<'en' | 'jp' | 'cn'>): string {
  const names = {
    en: player.name,
    jp: player.customData.nameJP ?? '',
    cn: player.customData.nameCN ?? ''
  }
  for (const lang of order) {
    const name = names[lang]
    if (name !== '') return name
  }
  return names.en
}

export function formatScore (credit: CreditScore, decimals: string): string {
  return `${credit.shottype}${credit.missOrScore === undefined ? '' : ` ${credit.missOrScore.replaceAll(/[,.]/g, decimals)}`}`
}

export function albumArtist (song: Song, format: string): string {
  return song.albumArtist === song.artist ? '' : format
}

export function westernDateTimeDisplay (timeZone: string, date: Date): LocalDateTimeDisplay {
  const day = date.toLocaleString('en-us', { timeZone, month: 'short', day: '2-digit' })
  const time = date.toLocaleString('en-gb', { timeZone, hour: '2-digit', minute: '2-digit' })
  const timezone = getTimeZoneDisplay(timeZone, date)
  return { day, time, timezone }
}

export function easternDateTimeDisplay (timeZone: string, date: Date): LocalDateTimeDisplay {
  const [m, d] = date.toLocaleString('zh-CN', { timeZone, month: 'numeric', day: 'numeric' }).split('/')
  const day = `${m}月${d}日`
  const { time, timezone } = westernDateTimeDisplay(timeZone, date)
  return { day, time, timezone }
}

// based on https://stackoverflow.com/a/64262840
function getTimeZoneDisplay (timeZone: string, date: Date): string {
  const timeZoneName = Intl.DateTimeFormat('en-us', { timeZoneName: 'shortOffset', timeZone })
    .formatToParts(date).find((i) => i.type === 'timeZoneName')?.value
  if (timeZoneName === undefined) return ''
  if (timeZoneName === 'GMT') return 'GMT+0'
  return timeZoneName
}
