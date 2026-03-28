/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { obs } from '../obs-controller'
import { bundleConfig } from '../../../shared/common'

let lastText: string = ''
export function setupNowPlaying (): void {
  setInterval(() => {
    pollSong0().catch(console.error)
  }, 1000)
}

const inputName = 'Now Playing'
const sourceName = inputName
const sceneName = 'Match Card'
async function pollSong0 (): Promise<void> {
  if (!obs.identified) return
  const np = await getNowPlaying()
  if (np.type === 'ignore') return
  if (lastText === np.text) return
  await obs.call('SetInputSettings', {
    inputName, inputSettings: { text: np.text }
  })
  await setNowPlayingScrolling(false)
  await new Promise(resolve => setTimeout(resolve, 20))
  const { sceneItemId } = await obs.call('GetSceneItemId', {
    sceneName, sourceName
  })
  const { sceneItemTransform } = await obs.call('GetSceneItemTransform', {
    sceneName, sceneItemId
  })
  const sourceWidth = sceneItemTransform.sourceWidth as number
  const boundsWidth = sceneItemTransform.boundsWidth as number
  if (sourceWidth > boundsWidth) {
    await setNowPlayingScrolling(true, boundsWidth)
  }

  lastText = np.text
}

async function setNowPlayingScrolling (filterEnabled: boolean, cx?: number): Promise<void> {
  await Promise.all(['Crop', 'Scroll'].map(async (filterName) => {
    await obs.call('SetSourceFilterEnabled', {
      sourceName: 'Now Playing', filterName, filterEnabled
    })
    if (cx === undefined) return
    const filterSettings = { cx, limit_cx: true, speed_x: 100 }
    await obs.call('SetSourceFilterSettings', { sourceName, filterName, filterSettings })
  }))
}

const IGNORE_TITLES = new Set(['COMMENTARY START'])

interface FoobarResponse {
  player: {
    activeItem: {
      columns: string[]
    }
    playbackState: string
  }
}

const NOT_PLAYING: ResponseUpdate = { type: 'update', text: '' }
interface ResponseUpdate {
  type: 'update'
  text: string
}

interface ResponseIgnore {
  type: 'ignore'
}

type Response = ResponseUpdate | ResponseIgnore

async function getNowPlaying (): Promise<Response> {
  const config = bundleConfig.beefweb
  if (config === undefined) return { type: 'ignore' }
  const { url, auth } = config
  const headers: Record<string, string> = {}
  if (auth !== undefined) {
    headers.Authorization = `Basic ${btoa(`${auth.user}:${auth.password}`)}`
  }

  let response: FoobarResponse
  try {
    const requestUrl = `${url}/api/player?columns=%artist%,%album%20artist%,%title%`
    const request = await fetch(requestUrl, { headers })
    if (!request.ok) {
      throw new Error(`Beefweb Error: ${request.status} ${request.statusText}`)
    }

    response = await request.json()
  } catch (error) {
    return NOT_PLAYING
  }

  if (response.player.playbackState !== 'playing') return NOT_PLAYING
  const [artist, albumArtist, title] = response.player.activeItem.columns
  if (IGNORE_TITLES.has(title)) {
    return { type: 'ignore' }
  }

  let text = ''
  if (albumArtist === 'OverClocked ReMix') {
    text = `Now playing: ${title} by ${artist} (ocremix.org)`
  } else if (albumArtist === 'COOL&CREATE' || albumArtist === 'COOL＆CREATE' || albumArtist === 'COOL&CREATE') {
    text = `Now playing: ${title} by COOL&CREATE (http://cool‑create.cc)`
  } else if (albumArtist === 'NoCopyrightSounds' || albumArtist === 'NCS Arcade') {
    text = `Now playing: ${title} (http://spoti.fi/NCS)`
  } else if (albumArtist === artist) {
    text = `Now playing: ${title} by ${artist}`
  } else {
    text = `Now playing: ${title} by ${artist} (${albumArtist})`
  }

  return { type: 'update', text }
}
