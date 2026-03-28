/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import textfit, { TextFitOption } from 'textfit'
import { querySelector } from '../common'

export function setText (
  elem: HTMLElement | string,
  text: string | undefined,
  textFitOptions?: TextFitOption
): void {
  if (typeof elem === 'string') {
    elem = querySelector(elem)
  }

  if (text === undefined || text.trim() === '') {
    elem.style.display = 'none'
    return
  }

  elem.style.removeProperty('display')
  elem.innerText = text

  if (textFitOptions === undefined) {
    return
  }

  textfit(elem, textFitOptions)

  if (text.includes('\n')) return
  // TWC 2026 underscore font fix
  const textfitted = elem.querySelector('.textFitted') as HTMLSpanElement
  textfitted.innerHTML = text.split('_').map(t => {
    const span = document.createElement('span')
    span.textContent = t
    return span.outerHTML
  }).join('<span style="position: relative; top: -8px;">_</span>')
}
