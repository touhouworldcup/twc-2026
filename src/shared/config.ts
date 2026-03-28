/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

export type Region = 'world' | 'en' | 'jp' | 'cn' | 'es'
export interface Configuration {
  obs: {
    port: number
    password: string
  }
  regions: {
    currentRegion: Region
    regionSyncKey: string
    allowedServers: string[]
    worldServerUrl: string
  }
  beefweb?: {
    url: string
    auth?: {
      user: string
      password: string
    }
  }
  nocodb?: {
    token: string
    hourOffset: number
    scheduleView: [string, string, string, string]
    playersView: [string, string, string, string]
  }
}
