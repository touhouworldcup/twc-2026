/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { key, nodecg } from '../common'

export const file = location.pathname.replace('/bundles/twc-2026/', '')
export const randomId = crypto.randomUUID().split('-')[0]

const STORAGE_KEY = 'remote_logging_id'
let logId = ''
async function setupLogId (): Promise<void> {
  nodecg.listenFor('change-log-id', (data: string[]) => {
    if (logId !== data[0]) return
    setLogId(data[1])
  })

  const existingCookie = await cookieStore.get(STORAGE_KEY)
  if (existingCookie !== null) {
    logId = existingCookie.value ?? ''
    return
  }

  setLogId(crypto.randomUUID().split('-')[0])
}

function setLogId (value: string): void {
  logId = value
  void cookieStore.set({
    name: STORAGE_KEY,
    value,
    path: '/'
  })
  console.log('Log ID changed')
}

type LogLevel = 'debug' | 'error' | 'info' | 'log' | 'warn'
type LogHandler = (level: LogLevel, ...data: unknown[]) => void
export function patchLogger (handler: LogHandler): void {
  let logging = false
  for (const key of ['debug', 'error', 'info', 'log', 'warn'] as LogLevel[]) {
    const originalHandler = console[key]
    console[key] = (...data: unknown[]): void => {
      if (logging) return
      try {
        logging = true
        originalHandler.apply(console, data)
        handler(key, ...data)
      } finally {
        logging = false
      }
    }
  }
}

export async function addRemoteLogging (): Promise<void> {
  await setupLogId()
  patchLogger((originalLevel, ...data) => {
    const level = originalLevel === 'log' ? 'info' : originalLevel // nodecg log does not have 'log' level
    const dataString = JSON.stringify([`[remote/${logId}]`, ...data.map(arg => {
      return arg instanceof Error ? formatObject(arg) : arg
    })])
    nodecg.sendMessage('log', { level, dataString }).catch(() => {}) // noop error
  })
}

export function logToHTML (target: HTMLElement, level: string, ...data: any[]): void {
  const argsString = data.map((object) => {
    if (object instanceof Error) {
      return [object.name, object.message, object.cause, object.stack].join(' ')
    }
    const type = typeof object
    if (type === 'bigint') return (object as bigint).toString()
    if (type === 'symbol') return (object as symbol).toString()
    if (type === 'object') return JSON.stringify(object)
    if (type === 'function') return (object as Function).toString()
    return object
  }).join(' ')

  const element = document.createElement('span')
  element.innerHTML = `${new Date().toISOString()} [${level}] ${redactNodeCGKey(argsString)}`
  target.appendChild(element)
  if (target.childElementCount > 40) {
    target.firstChild?.remove()
  }
}

export function formatObject (error: unknown): string {
  return error instanceof Error
    ? [error.name, error.message, formatObject(error.cause), '\n', error.stack].map(s => s ?? '').join(' ')
    : String(error)
}

export function redactNodeCGKey (text: string): string {
  if (key === null) return text
  return text.replaceAll(key, 'NODECG_KEY_REDACTED')
}
