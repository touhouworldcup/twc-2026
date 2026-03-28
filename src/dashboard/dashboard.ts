/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { onLoad, region } from '../shared/common'

export function loadWorldFeedDashboard (...objs: Parameters<typeof onLoad>): void {
  if (region === 'world') {
    onLoad(...objs)
  } else {
    document.body.innerHTML = 'Only available on world feed'
  }
}
