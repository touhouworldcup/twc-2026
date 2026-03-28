/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg, onLoad, querySelector, setText } from '../shared/common'
import { LastSceneSwitchTime } from '../types/schemas/last-scene-switch-time'
import { RunData } from 'nodecg-speedcontrol/src/types'
import { getGameDataByRun } from '../shared/games'

const lastSceneSwitchTime = nodecg.Replicant<LastSceneSwitchTime>('last-scene-switch-time')
export const match = nodecg.Replicant<RunData>('currentMatch')
onLoad(lastSceneSwitchTime, match, async () => {
  if (!gameColorSet) setGameColor()
  const loadTime = Date.now()
  setTimeout(() => {
    recordSceneSwitchTime(loadTime)
  }, 1000)
})

let gameColorSet = false
export function setGameColor (m?: RunData): void {
  gameColorSet = true
  const { game } = getGameDataByRun(m ?? match.value)
  querySelector(':root').style.setProperty('--gameColor', game.color)
  document.querySelectorAll('canvas.color-multiply').forEach(c => c.remove())
  for (const img of document.querySelectorAll<HTMLImageElement>('img.color-multiply')) {
    renderColorBackground(img, game.color)
  }
}

function renderColorBackground (img: HTMLImageElement, color: string): void {
  const canvas = document.createElement('canvas')
  img.parentElement?.insertBefore(canvas, img)
  canvas.className = img.className
  const { width, height } = img
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const colorPixel = ctx.getImageData(0, 0, 1, 1).data

  const rMult = colorPixel[0] / 255
  const gMult = colorPixel[1] / 255
  const bMult = colorPixel[2] / 255
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * rMult
    data[i + 1] = data[i + 1] * gMult
    data[i + 2] = data[i + 2] * bMult
  }

  ctx.putImageData(imageData, 0, 0)
}

export function setupStyles (templateId: string): void {
  const content = querySelector<HTMLTemplateElement>(templateId).content.cloneNode(true) as HTMLElement
  const link = content.querySelector('link') as HTMLLinkElement
  document.head.appendChild(link)

  const background = content.querySelector('img') as HTMLImageElement
  background.classList.add('fullscreen')
  document.body.insertBefore(background, document.body.firstChild)
}

function recordSceneSwitchTime (loadTime: number): void {
  const switchTime = lastSceneSwitchTime.value
  if (switchTime === undefined || switchTime === 0) {
    console.log('Page loaded in unknown time')
  } else {
    lastSceneSwitchTime.value = 0
    const loadDuration = loadTime - switchTime
    console.log(`Page loaded in ${(loadDuration / 1000).toFixed(2)}s`)
  }
}

export function msToString (ms: number): string {
  const min = Math.floor(Math.floor(ms / 1000) / 60)
  const sec = Math.floor(ms / 1000) % 60
  const mm = `${min}`.padStart(2, '0')
  const ss = `${sec}`.padStart(2, '0')

  return `${mm}:${ss}`
}

export function setStretchText (selector: string, text: string): void {
  setText(selector, text)

  setTimeout(() => {
    const elem = querySelector(selector)
    const parent = elem.parentElement
    if (parent === null) return
    const stretchWidth = (parent.offsetWidth - 20) / elem.offsetWidth
    if (stretchWidth < 1) {
      elem.style.transform = `scaleX(${stretchWidth})`
    } else {
      elem.style.transform = 'scaleX(1)'
    }

    elem.style.removeProperty('display')
    elem.style.removeProperty('visibility')
  }, 100)
}
