/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { ActiveAudio } from '../../../types/schemas/active-audio'
import { fadeAudio, obs } from '../obs-controller'
import { currentScene, obsSceneTransition, SceneTransitionEvent } from '../custom-obs-events'
import { nodecg } from '../../../shared/common'
import { WorldFeedLayoutUrl } from 'src/types/schemas/world-feed-layout-url'
import { redactNodeCGKey } from 'src/shared/common/logging'

const activeAudio = nodecg.Replicant<ActiveAudio>('active-audio')
const worldFeedLayoutUrl = nodecg.Replicant<WorldFeedLayoutUrl>('world-feed-layout-url')

export async function initWorldFeedController (): Promise<void> {
  setInterval(() => {
    void updateAudioTracks()
  }, 5000)
  obsSceneTransition.on((event) => {
    void onSceneTransitionStarted(event)
  })
  obs.on('InputMuteStateChanged', (event) => {
    void onInputMuteStateChanged(event)
  })
  setInterval(() => {
    void handleRegionalOverlay()
  }, 1000)
}

async function onSceneTransitionStarted (event: SceneTransitionEvent): Promise<void> {
  const { transitionName } = event
  let executionTime = Date.now()
  if (transitionName === 'Stinger') {
    executionTime += 1000
  }
  void updateAudioTracks(executionTime)
  void handleFoobar(executionTime)
  void handleRegionalOverlay(currentScene)
}

async function handleRegionalOverlay (sceneName?: string): Promise<void> {
  if (!obs.identified) return
  const { outputActive } = await obs.call('GetStreamStatus')
  if (!outputActive) return

  if (sceneName === undefined) {
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene')
    sceneName = currentProgramSceneName
  }

  const { sceneItems } = await obs.call('GetSceneItemList', { sceneName })
  const item = sceneItems.reverse().find(i => i.inputKind === 'browser_source' && String(i.sourceName).includes('Layout: '))
  const { inputSettings } = await obs.call('GetInputSettings', { inputUuid: item?.sourceUuid as string })
  const url = redactNodeCGKey(inputSettings.url as string)
  if (worldFeedLayoutUrl.value === url) return
  worldFeedLayoutUrl.value = url
}

async function onInputMuteStateChanged (event: { inputName: string, inputMuted: boolean }): Promise<void> {
  const { inputName, inputMuted } = event

  if (inputMuted) return
  const streamNumber = parseInt(inputName.slice(-1), 10) - 1
  if (isNaN(streamNumber)) return
  activeAudio.value = streamNumber
  if (isGameplayScene()) {
    void fadeAudio({ inputName, startDb: -100, endDb: 0, duration: 1000 })
  } else {
    void obs.call('SetInputVolume', { inputName, inputVolumeDb: 0 })
  }
  const otherInputNames = [1, 2, 3, 4, 5].flatMap(num => {
    return [`VLC-${num}`, `Web-${num}`]
  })

  for (const otherInputName of otherInputNames) {
    if (inputName === otherInputName) continue
    void muteStreamInput(otherInputName)
  }
}

async function muteStreamInput (inputName: string): Promise<void> {
  if (isGameplayScene()) {
    await fadeAudio({ inputName, endDb: -100 })
    await obs.call('SetInputMute', { inputName, inputMuted: true })
    await obs.call('SetInputVolume', { inputName, inputVolumeDb: -100 })
  } else {
    await obs.call('SetInputMute', { inputName, inputMuted: true })
    await obs.call('SetInputVolume', { inputName, inputVolumeDb: 0 })
  }
}

async function waitForExecutionTime (executionTime?: number): Promise<void> {
  const now = Date.now()
  if (executionTime !== undefined && executionTime > now) {
    const delay = executionTime - now
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

async function updateAudioTracks (executionTime?: number): Promise<void> {
  await waitForExecutionTime(executionTime)

  for (const num of [1, 2, 3]) {
    for (const inputName of [`VLC-${num}`, `Web-${num}`]) {
      void setTrackEnabled(inputName, isGameplayScene())
    }
  }
  void setTrackEnabled('Music', !isGameplayScene())
}

function isGameplayScene (): boolean {
  return currentScene.includes('Gameplay')
}

async function setTrackEnabled (inputName: string, enabled: boolean): Promise<void> {
  const inputAudioTracks: Record<number, boolean> = {}
  for (const track of [2, 3, 4, 5, 6]) {
    inputAudioTracks[track] = false
  }
  inputAudioTracks[1] = enabled
  await obs.call('SetInputAudioTracks', { inputName, inputAudioTracks })
}

function executeCommand (command: string): void {
  fetch(`http://localhost:8880/api/player/${command}`, { method: 'POST' }).catch((error) => {
    console.error(`Failed to send command ${command} to foobar`, error)
  })
}

async function handleFoobar (executionTime: number): Promise<void> {
  let response: any
  try {
    response = await fetch('http://localhost:8880/api/player').then(async r => await r.json())
  } catch (error) {
    console.error('Failed to get foobar player state', error)
    return
  }
  const isPlaying = response.player.activeItem.position > 0
  const shouldBePlaying = !isGameplayScene()
  await waitForExecutionTime(executionTime)
  if (isPlaying && !shouldBePlaying) {
    await waitForExecutionTime(executionTime + 1000)
    void executeCommand('stop')
  }
  if (!isPlaying && shouldBePlaying) {
    await waitForExecutionTime(executionTime + 5000)
    void executeCommand('play')
  }
}
