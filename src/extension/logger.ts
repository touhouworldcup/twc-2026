/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg } from './util/nodecg'

type LogLevel = 'debug' | 'error' | 'info' | 'warn'
interface LogMessage {
  level: LogLevel
  dataString: string
}

export function setupRemoteLoggerListener (): void {
  nodecg.listenFor('log', (message: LogMessage) => {
    const data: unknown[] = JSON.parse(message.dataString)
    nodecg.log[message.level](...data)
  })
}
