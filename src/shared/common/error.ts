/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import textFit from 'textfit'
import { formatObject, redactNodeCGKey } from './logging'

export function displayError (error: unknown): void {
  const errorMessage = document.createElement('span')
  errorMessage.className = 'errorMessage fullscreen'
  errorMessage.textContent = redactNodeCGKey(formatObject(error))
  document.body.appendChild(errorMessage)
  textFit(errorMessage, {
    alignHoriz: true,
    alignVert: true,
    multiLine: true
  })
  console.error(error)
  document.body.classList.add('fadeIn')
}
