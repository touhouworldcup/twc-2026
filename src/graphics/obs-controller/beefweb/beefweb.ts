/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { Api } from './beefweb-generated-client'
import { bundleConfig } from '../../../shared/common'

export const beefweeb = (() => {
  if (bundleConfig.beefweb === undefined) return
  const auth = bundleConfig.beefweb.auth
  const headers: Record<string, string> = auth === undefined
    ? {}
    : { Authorization: `Basic ${btoa(`${auth.user}:${auth.password}`)}` }
  return new Api({
    baseUrl: `${bundleConfig.beefweb.url}/api`,
    baseApiParams: {
      headers
    }
  })
})()
