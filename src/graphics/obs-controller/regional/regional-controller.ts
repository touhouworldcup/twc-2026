/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { setupAudio } from './audio'
import { setupNowPlaying } from './nowPlaying'
import { setupVoiceDisplayCrop } from './vc-crop'
import { region } from '../../../shared/common'

export async function initRegionalController (): Promise<void> {
  if (region === 'cn') return // no automation yet for CN

  setupNowPlaying()
  void setupAudio()
  setupVoiceDisplayCrop()
}
