/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { NodeCGAPIClient } from 'nodecg/dist/dts/client/api/api.client'
import NodeCGTypes from 'nodecg/types'
import { Configuration } from './config'
import { addRemoteLogging, file } from './common/logging'
import { displayError } from './common/error'
import { setupRemoteReloads } from './common/reloads'
import { checkReady } from './common/ready-check'
export { setText } from './common/setText'

export const params = new URLSearchParams(location.search)
export const nodecg = (window as any).nodecg as NodeCGTypes.ClientAPI
export const NodeCG = (window as any).NodeCG as typeof NodeCGAPIClient
export const bundleConfig = nodecg.bundleConfig as unknown as Configuration
export const region = bundleConfig.regions.currentRegion
export const key = params.get('key') ?? ''

export function querySelector<Type extends HTMLElement> (selector: string, target: ParentNode = document): Type {
  const element = target.querySelector(selector)
  if (element === null) {
    throw new Error(`Did not find selector ${selector}`)
  }
  return element as Type
}

type Handler = () => void | Promise<void>
type Replicant = NodeCGTypes.ClientReplicant<any>
const onLoadHandlers: Handler[] = []
const replicants: Replicant[] = []
export function onLoad (...objs: Array<Handler | Replicant>): void {
  for (const obj of objs) {
    if (typeof obj === 'function') {
      onLoadHandlers.push(obj)
    } else {
      replicants.push(obj)
    }
  }
}

window.addEventListener('load', () => {
  void onWindowLoad().catch(displayError)
})

async function onWindowLoad (): Promise<void> {
  document.fonts.forEach(font => {
    void font.load() // preload fonts
  })

  if (nodecg.socket.connected) {
    onNodeCGLoad().catch(displayError)
  } else {
    nodecg.socket.on('connect', () => {
      onNodeCGLoad().catch(displayError)
    })
  }
}

async function onNodeCGLoad (): Promise<void> {
  await addRemoteLogging()
  console.log(`Page loading: ${file}`)
  setupRemoteReloads()

  let lastLength = replicants.length
  do {
    await new Promise(resolve => setTimeout(resolve, 100))
    if (lastLength > 0) {
      await NodeCG.waitForReplicants(...replicants)
      lastLength = replicants.length
    }
  } while (lastLength !== replicants.length)

  await checkReady()
  for (const handler of onLoadHandlers) {
    await handler()
    await checkReady()
  }

  document.body.classList.add('fadeIn')
  console.log('Page has finished loading:', file)
}
