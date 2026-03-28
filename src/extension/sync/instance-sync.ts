/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { Operation } from 'fast-json-patch'
import { bundleConfig } from '../util/nodecg'
import { setupFollower } from './follower-sync'
import { setupLeader } from './leader-sync'

export function setupInstanceSync (): void {
  const region = bundleConfig.regions.currentRegion
  const setupSync = region === 'world' ? setupLeader : setupFollower
  setupSync()
}

export interface Replicant {
  replicantName: string
  bundleName?: string
}
export type SerializedReplicant = Replicant & { data: unknown }
export type UpdateOperation = Full | Patch

interface Full {
  op: 'full'
  state: SerializedReplicant[]
}

interface Patch {
  op: 'patch'
  patches: Operation[]
}
