/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { OBSWebSocket } from 'obs-websocket-js'
import { initWorldFeedController } from './world/world-controller'
import { initRegionalController } from './regional/regional-controller'
import { registerCustomOBSEvents } from './custom-obs-events'
import { setupControllerLogging } from './logger'
import { bundleConfig, region } from '../../shared/common'

export const obs = new OBSWebSocket()
const config = bundleConfig.obs

export async function connectOBS (): Promise<void> {
  const connected = await new Promise<boolean>((resolve) => {
    obs.once('Identified', () => onIdentify(() => resolve(true)))
    obs.connect(`ws://127.0.0.1:${config.port}`, config.password).catch(() => {
      resolve(false) // still resolve so the listeners are setup for later connection
    })
  })
  if (connected) console.log('Connected to OBS Websocket')
}

function onIdentify (resolve: () => void): void {
  obs.once('CurrentProgramSceneChanged', resolve)
  obs.call('GetCurrentProgramScene').then(resolve).catch(() => {
    console.log('obs-websocket connected, but video not ready yet. Waiting for CurrentProgramSceneChanged...')
  })
}

obs.on('ConnectionClosed', () => {
  void onConnectionClosed()
})

async function onConnectionClosed (): Promise<void> {
  // console.error('OBS connection closed', error)
  await new Promise(resolve => setTimeout(resolve, 1000))
  void connectOBS()
}

const currentlyFading = new Set()
interface FadeAudioArgs {
  inputName: string
  startDb?: number
  endDb?: number
  changeDb?: number
  duration?: number
}

export async function fadeAudio (args: FadeAudioArgs): Promise<void> {
  if (!obs.identified) return
  const inputName = args.inputName
  if (currentlyFading.has(inputName)) {
    console.error('Already fading', inputName)
    return
  }

  currentlyFading.add(inputName)
  try {
    await fadeAudio0(args)
  } finally {
    currentlyFading.delete(inputName)
  }
}

async function fadeAudio0 (args: FadeAudioArgs): Promise<void> {
  const inputName = args.inputName
  let startDb = args.startDb
  if (startDb === undefined) {
    const { inputVolumeDb } = await obs.call('GetInputVolume', { inputName })
    startDb = inputVolumeDb
  }
  let endDb = args.endDb
  if (endDb === undefined) {
    if (args.changeDb === undefined) {
      throw new Error('need to specify either end or change db')
    }
    endDb = startDb + args.changeDb
  }

  let duration = args.duration
  if (duration === undefined) {
    duration = 1000
  }

  const startGain = (startDb <= -100) ? 0 : Math.pow(10, startDb / 20)
  const endGain = (endDb <= -100) ? 0 : Math.pow(10, endDb / 20)
  const startTime = Date.now()

  while (true) {
    const currentTime = Date.now()
    const elapsedPercentage = (currentTime - startTime) / duration
    if (elapsedPercentage >= 1) {
      await obs.call('SetInputVolume', { inputName, inputVolumeDb: endDb })
      currentlyFading.delete(inputName)
      return
    }

    const currentGain = startGain + (endGain - startGain) * elapsedPercentage

    let inputVolumeDb
    if (currentGain <= 0.00001) {
      inputVolumeDb = -100
    } else {
      inputVolumeDb = 20 * Math.log10(currentGain)
    }

    await obs.call('SetInputVolume', { inputName, inputVolumeDb })
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

void initController().catch(console.error)
async function initController (): Promise<void> {
  setupControllerLogging()
  await connectOBS()
  await registerCustomOBSEvents()
  if (region === 'world') {
    await initWorldFeedController()
  } else {
    await initRegionalController()
  }
}
