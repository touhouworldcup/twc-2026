/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { WorldFeedLayoutUrl } from 'src/types/schemas/world-feed-layout-url'
import { key, nodecg, onLoad, params, region } from '../../shared/common'

const worldFeedLayoutUrl = nodecg.Replicant<WorldFeedLayoutUrl>('world-feed-layout-url')

function getDelay (paramName: string, defaultEn: number, defaultOther: number): number {
  const param = params.get(paramName)
  if (param !== null) return parseFloat(param)
  const result = region === 'en' ? defaultEn : defaultOther
  console.log({ param, paramName, defaultEn, defaultOther, result })
  return result
}

const delayFadeOut = getDelay('delayFadeOut', 7, 2) * 1000
const delayFadeIn = getDelay('delayFadeIn', 13, 8) * 1000
onLoad(worldFeedLayoutUrl, () => {
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
    }, delayFadeOut)
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
    }, delayFadeIn)
  }
  iframe.src = regionalUrl
  document.body.appendChild(iframe)
}
