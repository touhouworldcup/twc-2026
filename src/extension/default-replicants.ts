/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { TextControl } from '../types/schemas/text-control'
import { bundleConfig, nodecg } from './util/nodecg'
import { ActiveAudio } from '../types/schemas/active-audio'
import { LastSceneSwitchTime } from '../types/schemas/last-scene-switch-time'
import { WorldDataConnected } from '../types/schemas/world-data-connected'
import { WorldDataTargetServer } from '../types/schemas/world-data-target-server'

export function setDefaultReplicants (): void {
  def<ActiveAudio>('active-audio', 1)
  def<LastSceneSwitchTime>('last-scene-switch-time', Date.now())
  def<TextControl>('text-control', {
    top: [],
    bottom: [],
    results: '',
    selectedPlayer: 1
  })
  def<WorldDataConnected>('world-data-connected', false)
  def<WorldDataTargetServer>('world-data-target-server', bundleConfig.regions.allowedServers[0])
}

function def<T> (name: string, value: T): void {
  nodecg.Replicant(name, undefined).value = value
}
