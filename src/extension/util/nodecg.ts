/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { Configuration } from 'src/shared/config'
import { getNodeCG } from './nodecg_set'
export const nodecg = getNodeCG()
export const bundleConfig = nodecg.bundleConfig as unknown as Configuration
