/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { OBSEventTypes } from 'obs-websocket-js'
import { obs } from './obs-controller'

class EventDispatcher<E> {
  private readonly handlers: Array<(event: E) => (void | Promise<void>)> = []
  dispatch (event: E): void {
    this.handlers.forEach(handler => {
      void handler(event)
    })
  }

  on (handler: (event: E) => (void | Promise<void>)): void {
    this.handlers.push(handler)
  }
}

export interface SceneTransitionEvent {
  fromScene: string
  toScene: string
  transitionName: string
  transitionUuid: string
}

export const obsSceneTransition = new EventDispatcher<SceneTransitionEvent>()
export let currentScene: string = ''

export async function registerCustomOBSEvents (): Promise<void> {
  obs.on('CurrentProgramSceneChanged', (event) => {
    currentScene = event.sceneName
  })
  obs.on('SceneTransitionStarted', (event) => {
    void onSceneTransitionStarted(event)
  })
  obs.on('Identified', () => {
    obs.call('GetCurrentProgramScene').then((event) => {
      currentScene = event.currentProgramSceneName
    }).catch(() => {}) // ignore errors
  })
  if (!obs.identified) return
  try {
    const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene')
    currentScene = currentProgramSceneName
  } catch (error) {
    console.error('Failed to initialize current scene for OBS:', error)
  }
}

async function onSceneTransitionStarted (event: OBSEventTypes['SceneTransitionStarted']): Promise<void> {
  const { transitionName, transitionUuid } = event
  const { sceneName: toScene } = await obs.call('GetCurrentProgramScene')
  const fromScene = currentScene
  currentScene = toScene
  const customEvent = { fromScene, toScene, transitionName, transitionUuid }
  obsSceneTransition.dispatch(customEvent)
  console.log(`Scene transition from ${fromScene} to ${toScene} (${transitionName})`)
}
