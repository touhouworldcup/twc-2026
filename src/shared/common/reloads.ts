/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg } from '../common'

let reloadsEnabled = true
export function setReloadsEnabled (enabled: boolean): void {
  reloadsEnabled = enabled
}

export function setupRemoteReloads (): void {
  nodecg.listenFor('reload-pages', () => {
    if (!reloadsEnabled) return
    document.body.classList = 'fadeOut'
    setTimeout(() => {
      location.reload()
    }, 1000)
  })
}
