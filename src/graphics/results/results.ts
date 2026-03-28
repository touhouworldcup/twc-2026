/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg, onLoad, params, querySelector, setText } from '../../shared/common'
import { match, setStretchText, setupStyles } from '../graphic'
import { getGameDataByRun } from '../../shared/games'
import { TextControl } from '../../types/schemas/text-control'
import { parseResults } from './parseResults'
import { i18n } from '../i18n'

const textControlReplicant = nodecg.Replicant<TextControl>('text-control')
const artworkAssets = nodecg.Replicant<Array<{
  base: string
  url: string
}>>('assets:artwork')

const hasArt = params.has('art')
onLoad(textControlReplicant, match, artworkAssets, async () => {
  setupStyles(hasArt ? '#art' : '#no-art')
}, async () => {
  textControlReplicant.on('change', (tc) => {
    if (tc === undefined) return
    setText('#results', parseResults({
      results: tc.results,
      mode: 'final-results',
      run: match.value
    }), {
      alignHoriz: true,
      alignVert: true,
      multiLine: false
    })
  })

  const run = match.value
  if (run === undefined) return
  const { game, category } = getGameDataByRun(run)
  setStretchText('#game', i18n.gameName(game))
  setStretchText('#category', i18n.categoryName(category))

  if (!hasArt) return
  const credit = run.customData.artworkCredit
  if (credit !== undefined) {
    setText('#credit', `Artwork by ${credit}`, {
      alignHoriz: true,
      alignVert: true,
      maxFontSize: 60
    })
  }

  const asset = artworkAssets.value?.find(asset => asset.base === run?.customData.artworkFile)
  if (asset !== undefined) {
    querySelector<HTMLImageElement>('#artwork').src = asset.url
  }
})
