/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg, querySelector } from '../../shared/common'
import { obs } from './obs-controller'
import { LastSceneSwitchTime } from '../../types/schemas/last-scene-switch-time'
import { logToHTML, patchLogger } from 'src/shared/common/logging'

const lastSceneSwitchTime = nodecg.Replicant<LastSceneSwitchTime>('last-scene-switch-time')

export function setupControllerLogging (): void {
  const log = querySelector('#log')
  patchLogger((level, data) => logToHTML(log, level, data))
  obs.on('CurrentPreviewSceneChanged', () => {
    lastSceneSwitchTime.value = Date.now()
  })

  const originalOBSEmit = obs.emit
  obs.emit = (...data: Parameters<typeof obs.emit>): boolean => {
    if (data[0] !== 'InputVolumeMeters') {
      logToHTML(log, 'log', 'OBS Event', ...data)
    }
    return originalOBSEmit.apply(obs, data)
  }
}
