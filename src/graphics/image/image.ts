/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { setReloadsEnabled } from '../../shared/common/reloads'
import { onLoad, params, querySelector } from '../../shared/common'

onLoad(() => {
  setReloadsEnabled(false)
  const template = querySelector<HTMLTemplateElement>(`#${params.get('img') ?? ''}`)
  document.body.appendChild(template.content.cloneNode(true))
  const img = querySelector<HTMLImageElement>('body > img')
  img.classList = 'fullscreen'
})
