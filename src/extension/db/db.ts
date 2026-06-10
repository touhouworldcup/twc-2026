/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { Api } from 'nocodb-sdk'
import { bundleConfig, nodecg } from '../util/nodecg'
import { RunData, RunDataPlayer, RunDataTeam } from 'speedcontrol-util/types/speedcontrol'
import { games } from '../../shared/games'
import { Player, Match } from './db-types'
import { Configuration } from 'src/shared/config'

export async function updateRunsFromDatabase (): Promise<void> {
  const config = bundleConfig.nocodb
  if (config === undefined) {
    nodecg.log.error('Database update requested without DB config')
    return
  }

  const api = new Api({
    baseURL: 'https://nocodb.touhouworldcup.com',
    headers: {
      'xc-token': config.token
    }
  })
  nodecg.log.info('Updating runs from database')
  const schedule = await getTable<Match>(api, config.scheduleView)
  const players = await getTable<Player>(api, config.playersView)

  const runDatas = schedule.flatMap((match) => createRunData(match, players, config))
  let prevID: string | undefined = ''
  for (const runData of runDatas) {
    nodecg.sendMessageToBundle('modifyRun', 'nodecg-speedcontrol', { runData, prevID })
    nodecg.log.info('Updated', runData.game)
    prevID = runData.id
  }
}

function createRunData (match: Match, players: Player[], config: NonNullable<Configuration['nocodb']>): RunData[] {
  if (match.Category === '???') return []
  if (match.Category === null) return []
  const [numberName, ...categoryArray] = match.Category.split(' ')
  const category = categoryArray.join(' ')
  const shortName = games.find(g => g.numberName === numberName)?.shortName
  if (shortName === undefined) {
    nodecg.log.error('Did not find game', numberName)
    return []
  }

  return [{
    id: id(match.Category),
    game: `${shortName ?? numberName} ${category}`,
    gameTwitch: 'Touhou Project',
    estimate: getEstimate(match.ResetTime),
    teams: [match.Player_1, match.Player_2, match.Player_3].flatMap((player, index) => {
      return createTeam(player, index, players)
    }),
    customData: getMatchCustomData(match, config)
  }]
}

function getEstimate (minutes: number): string {
  const hh = `${Math.floor(minutes / 60)}`.padStart(2, '0')
  const mm = `${minutes % 60}`.padStart(2, '0')
  return `${hh}:${mm}:00`
}

const dateUTCKey = 'Date__UTC_'
function getMatchCustomData (match: Match, config: NonNullable<Configuration['nocodb']>): {
  [key: string]: string
} {
  const existingCustomData = nodecg.readReplicant<RunData[]>('runDataArray', 'nodecg-speedcontrol')
    ?.find(other => other.id === id(match.Category))?.customData ?? {}
  const time = match[dateUTCKey]
  if (time === null) return {}
  const hourOffset = config.hourOffset
  const offset = hourOffset * 3600000
  const dbTime = Date.parse(time)
  return Object.assign({}, existingCustomData, {
    startTime: new Date(dbTime + offset).toISOString()
  })
}

function createTeam (player: string, index: number, players: Player[]): RunDataTeam[] {
  if (player === '-' || player === '???') return []
  const dbPlayer = players.find(p => p.Name === player)
  if (dbPlayer === undefined) {
    console.error('Did not find player', player)
    return []
  }

  return [{
    id: 'team_' + id(dbPlayer.Name),
    name: ['Fossil', 'Mirage', 'Truth'][index],
    players: [createPlayer(dbPlayer)]
  }]
}

function createPlayer (player: Player): RunDataPlayer {
  const customData: Record<string, string> = {}
  const nameJP = player.JapaneseName
  if (nameJP !== null) customData.nameJP = nameJP

  const nameCN = player.ChineseName
  if (nameCN !== null) customData.nameCN = nameCN

  return {
    name: player.Name,
    id: id(player.Name),
    teamID: 'team_' + id(player.Name),
    social: {
      twitch: player.DisplayStream === 1 ? player.Stream ?? undefined : undefined
    },
    customData
  }
}

function id (input: string): string {
  return input.toLowerCase().replaceAll(/[^a-z0-9]/g, '')
}

async function getTable<T> (api: Api<unknown>, ids: [string, string, string, string]): Promise<T[]> {
  const result: object[] = []
  const params: {
    offset?: number
  } = {}
  while (true) {
    try {
      const { list, pageInfo } = await api.dbViewRow.list(...ids, params)
      result.push(...list)
      if (pageInfo.isLastPage === true) return result as T[]
      params.offset = (params.offset ?? 0) + list.length
    } catch (error) {
      nodecg.log.error(error)
      return result as T[]
    }
  }
}
