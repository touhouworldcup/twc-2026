/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { RunData } from 'nodecg-speedcontrol/src/types'

export interface Game {
  numberName: string
  color: string
  shortName: string
  japaneseName: string
  englishName: string
  finalRunText: string
}

function game (numberName: string, color: string, shortName: string, japaneseName: string, englishName: string, finalRunText: string = 'FINAL RUN!'): Game {
  return { numberName, color, shortName, japaneseName, englishName, finalRunText }
}

export const games = [
  game('TH06', '#FF191B', 'EoSD', '東方紅魔郷', 'the Embodiment of Scarlet Devil'),
  game('TH07', '#961C87', 'PCB', '東方妖々夢', 'Perfect Cherry Blossom'),
  game('TH08', '#E4AB37', 'IN', '東方永夜抄', 'Imperishable Night'),
  game('TH09', '#EFED6A', 'PoFV', '東方花映塚', 'Phantasmagoria of Flower View'),
  game('TH10', '#77CC64', 'MoF', '東方風神録', 'Mountain of Faith'),
  game('TH11', '#C68C54', 'SA', '東方地霊殿', 'Subterranean Animism'),
  game('TH12', '#349888', 'UFO', '東方星蓮船', 'Undefined Fantastic Object'),
  game('TH125', '#26376f', 'DS', 'ダブルスポイラー ~ 東方文花帖', 'Double Spoiler'),
  game('TH128', '#26D0D7', 'GFW', '妖精大戦争', 'Great Fairy Wars'),
  game('TH13', '#AB4DE2', 'TD', '東方神霊廟', 'Ten Desires'),
  game('TH14', '#2863C5', 'DDC', '東方輝針城', 'Double Dealing Character'),
  game('TH15', '#7B31A6', 'LoLK', '東方紺珠伝', 'Legacy of Lunatic Kingdom'),
  game('TH16', '#F6FDA5', 'HSiFS', '東方天空璋', 'Hidden Star in Four Seasons'),
  game('TH17', '#A27279', 'WBaWC', '東方鬼形獣', 'Wily Beast and Weakest Creature'),
  game('TH18', '#26D893', 'UM', '東方虹龍洞', 'Unconnected Marketeers'),
  game('TH19', '#12B306', 'UDoALG', '東方獣王園', 'Unfinished Dream of All Living Ghost'),
  game('TH20', '#d2d2b2', 'FW', '東方錦上京', 'Fossilized Wonders'),
  game('TH00', '#4d4d4d', '?', '', '')
]

export function getGameDataByRun (run: RunData | undefined): { game: Game, category: string } {
  if (run === undefined) {
    throw new Error('run is undefined')
  }
  const array = (run.game ?? '').split(' ')
  const first = array.shift() ?? ''
  const game = games.find(game => game.shortName === first)
  if (game === undefined) {
    throw new Error(`Game not found: ${first}`)
  }
  const category = array.join(' ')
  return { game, category }
}
