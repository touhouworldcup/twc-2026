/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { Region } from 'src/shared/config'
import { bundleConfig, params } from '../../shared/common'
import { chinese } from './chinese'
import { english } from './english'
import { japanese } from './japanese'
import { spanish } from './spanish'
import { world } from './world'

const region: Region = params.get('region') as Region ?? bundleConfig.regions.currentRegion
export const i18n = {
  en: english,
  jp: japanese,
  cn: chinese,
  es: spanish,
  world
}[region]
