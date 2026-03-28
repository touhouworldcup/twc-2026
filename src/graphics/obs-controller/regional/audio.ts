/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { region } from '../../../shared/common'
import { obsSceneTransition, SceneTransitionEvent } from '../custom-obs-events'
import { fadeAudio, obs } from '../obs-controller'

export async function setupAudio (): Promise<void> {
  obsSceneTransition.on((event) => {
    void handleTransition(event)
  })
  if (region === 'en') {
    // only EN uses audio monitor
    setInterval(switchAudioMonitorOutputs, 60000)
  }
}

async function handleTransition (e: SceneTransitionEvent): Promise<void> {
  const { fromScene, toScene } = e
  const [commsNowLive, commsWereLive] = await Promise.all([
    isCommentaryLive(toScene), isCommentaryLive(fromScene)
  ])
  void handleCommsAudio(commsNowLive)
  void handleMusic(commsNowLive, commsWereLive)
  void handleGameplayAudioTransition(fromScene, toScene)
}

async function isCommentaryLive (sceneName: string): Promise<boolean> {
  const { sceneItems } = await obs.call('GetSceneItemList', { sceneName })
  const vc = sceneItems.find(item => item.sourceName === 'VC Display')
  if (vc === undefined) return false
  return vc.sceneItemEnabled === true
}

function isGameScene (scene: string): boolean {
  return scene.includes('Gameplay')
}

async function handleCommsAudio (commsNowLive: boolean): Promise<void> {
  const inputAudioTracks: Record<number, boolean> = {}
  for (const track of [2, 3, 4, 5, 6]) {
    inputAudioTracks[track] = false
  }
  inputAudioTracks[1] = commsNowLive

  for (const inputName of ['Comm1', 'Comm2', 'Comm3', 'Comm4', 'Discord']) {
    void obs.call('SetInputAudioTracks', { inputName, inputAudioTracks })
  }
}

async function handleMusic (commsNowLive: boolean, commsWereLive: boolean): Promise<void> {
  // only EN plays custom music, for rest raise/lower world feed
  const inputName = region === 'en' ? 'Music' : 'World Feed'
  if (!commsWereLive && commsNowLive) {
    void fadeAudio({ inputName, changeDb: -5 })
  }
  if (commsWereLive && !commsNowLive) {
    void fadeAudio({ inputName, changeDb: +5 })
  }
}

async function handleGameplayAudioTransition (fromScene: string, toScene: string): Promise<void> {
  if (region !== 'en') return // only EN does things here
  if (!isGameScene(fromScene) && isGameScene(toScene)) {
    void fadeAudio({ inputName: 'Music', endDb: -100 })
    void fadeAudio({ inputName: 'World Feed', endDb: -15 })
  }
  if (isGameScene(fromScene) && !isGameScene(toScene)) {
    void fadeAudio({ inputName: 'Music', endDb: -5 })
    void fadeAudio({ inputName: 'World Feed', endDb: -100 })
  }
}

let currentMonitor = 1
function switchAudioMonitorOutputs (): void {
  if (!obs.identified) return
  currentMonitor = currentMonitor === 1 ? 2 : 1
  for (const sourceName of ['Music', 'World Feed']) {
    void obs.callBatch([1, 2].map(n => {
      return {
        requestType: 'SetSourceFilterEnabled',
        requestData: {
          sourceName,
          filterName: `Audio Monitor ${n}`,
          filterEnabled: currentMonitor === n
        }
      }
    }))
  }
  console.log('Switched Audio Monitor Filters')
}
