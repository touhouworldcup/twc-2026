/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { OBSResponseTypes } from 'obs-websocket-js'
import { querySelector } from '../../../shared/common'
import { obs } from '../obs-controller'

let lastBottomCrop = 0
let lastRightCrop = 0

async function getVCDisplayTransform (
  scenes: OBSResponseTypes['GetSceneList']['scenes']
): Promise<OBSResponseTypes['GetSceneItemTransform'] | undefined> {
  try {
    // try from a known scene first
    const sourceName = 'VC Display'
    const sceneName = 'Gameplay (3P)'
    const { sceneItemId } = await obs.call('GetSceneItemId', { sourceName, sceneName })
    return await obs.call('GetSceneItemTransform', { sceneName, sceneItemId })
  } catch (error) {
    // ignore error, go to fallback
  }

  for (const scene of scenes) {
    const sceneName = scene.sceneName as string
    const { sceneItems } = await obs.call('GetSceneItemList', { sceneName })
    const item = sceneItems.find(item => item.sourceName === 'VC Display')
    if (item === undefined) continue
    const sceneItemId = item.sceneItemId as number
    return await obs.call('GetSceneItemTransform', { sceneName, sceneItemId })
  }

  return undefined
}

export async function checkVoiceDisplayCrop (): Promise<void> {
  if (!obs.identified) return
  const { scenes } = await obs.call('GetSceneList')
  const response = await getVCDisplayTransform(scenes)
  if (response === undefined) return
  const { imageData } = await obs.call('GetSourceScreenshot', {
    sourceName: 'VC Display',
    imageFormat: 'png',
    imageWidth: Math.round((response.sceneItemTransform.sourceWidth as number) / 10),
    imageHeight: Math.round((response.sceneItemTransform.sourceHeight as number) / 10)
  })

  const img = querySelector<HTMLImageElement>('#img')
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = imageData
  })
  const canvas = querySelector<HTMLCanvasElement>('#canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const bottomCrop = getBottomCrop(data)
  const rightCrop = getRightCrop(data)
  const dy = Math.abs(bottomCrop - lastBottomCrop)
  const dx = Math.abs(rightCrop - lastRightCrop)
  if (dx < 50 && dy < 50) return
  lastBottomCrop = bottomCrop
  lastRightCrop = rightCrop
  const tasks = scenes.map(scene => scene.sceneName as string).map(async (sceneName) => {
    await setVoiceCrop(sceneName, bottomCrop, rightCrop)
  })
  await Promise.allSettled(tasks)
  console.log('VC crop updated')
}

async function setVoiceCrop (sceneName: string, cropBottom: number, cropRight: number): Promise<void> {
  const sceneItemId = await getSceneItemId(sceneName)
  if (sceneItemId === undefined) return
  try {
    await obs.call('SetSceneItemTransform', {
      sceneName,
      sceneItemId,
      sceneItemTransform: {
        cropLeft: 20,
        cropTop: 20,
        cropBottom,
        cropRight
      }
    })
  } catch (error) {
    console.log('Error setting vc transform', error)
  }
}

async function getSceneItemId (sceneName: string): Promise<number | undefined> {
  try {
    const { sceneItemId } = await obs.call('GetSceneItemId', {
      sceneName, sourceName: 'VC Display'
    })
    return sceneItemId
  } catch (error) {
    return undefined
  }
}

function getBottomCrop (data: ImageData): number {
  for (let y = data.height - 1; y >= 0; y--) {
    const x = 8 // magic value chosen based on vc display
    if (!isEmpty(data, x, y)) return Math.max(0, data.height - y - 2) * 10
  }
  return 0
}

function getRightCrop (data: ImageData): number {
  let furthestX = 0
  for (let y = 0; y < data.height; y++) {
    let x = data.width - 1
    for (; x > 0; x--) {
      if (!isEmpty(data, x, y)) break
    }
    if (x > furthestX) {
      furthestX = x
    }
  }
  return Math.max(0, data.width - furthestX - 2) * 10
}

function isEmpty (data: ImageData, x: number, y: number): boolean {
  const base = (y * data.width + x) * 4
  for (let delta = 0; delta < 4; delta++) {
    if (data.data[base + delta] > 10) return false
  }
  return true
}
