/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { WorldFeedLayoutUrl } from 'src/types/schemas/world-feed-layout-url'
import { key, nodecg, onLoad } from '../../shared/common'
import { StreamDelay } from 'src/types/schemas/stream-delay'

const worldFeedLayoutUrl = nodecg.Replicant<WorldFeedLayoutUrl>('world-feed-layout-url')
const streamDelay = nodecg.Replicant<StreamDelay>('stream-delay')
function getDelay (offset: number): number {
  const delay = streamDelay.value ?? 2
  return (delay + offset) * 1000
}

onLoad(worldFeedLayoutUrl, streamDelay, () => {
  worldFeedLayoutUrl.on('change', (url) => {
    void update(url)
  })
})

function getRegionalUrl (worldFeedUrl: string | undefined): string {
  if (worldFeedUrl === undefined) return ''
  const url = new URL(worldFeedUrl)
  url.searchParams.delete('key')
  url.searchParams.set('key', key)
  return `${location.origin}${url.pathname}?${url.searchParams.toString()}`
}

async function update (worldFeedUrl: string | undefined): Promise<void> {
  const regionalUrl = getRegionalUrl(worldFeedUrl)
  const activeIframe = document.querySelector<HTMLIFrameElement>('iframe.active')
  if (activeIframe?.src === regionalUrl) return

  let previousExisted = false
  document.querySelectorAll('iframe').forEach(iframe => {
    previousExisted = true
    iframe.classList.remove('active')
    console.log('Removing old regional overlay', iframe.src)
    setTimeout(() => {
      iframe.remove()
    }, getDelay(-2))
  })

  const iframe = document.createElement('iframe')
  iframe.className = 'fullscreen active'
  iframe.style.border = '0'
  iframe.width = '1920'
  iframe.height = '1080'
  if (previousExisted) {
    iframe.style.opacity = '0'
    setTimeout(() => {
      iframe.style.opacity = '1'
    }, getDelay(2))
  }
  iframe.src = regionalUrl
  document.body.appendChild(iframe)
}
