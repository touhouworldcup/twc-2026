/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { nodecg } from '../util/nodecg'

export function clone<T> (t: T): T {
  if (t === undefined) return t
  return JSON.parse(JSON.stringify(t))
}

let lastRecord: number
let bytesWritten = 0

export function setupSSEStats (): void {
  lastRecord = Date.now()
  setInterval(outputSSEStats, 60000)
}

export function recordSSEStats (bytes: number): void {
  bytesWritten += bytes
  if (Date.now() - lastRecord < 1000) return

  const bps = getBitrate()
  if (bps > 100000) {
    outputSSEStats()
  }
}

function getBitrate (now: number = Date.now()): number {
  return bytesWritten / (now - lastRecord) * 1000
}

let lastLoggedBitrate: number | undefined
function outputSSEStats (): void {
  const now = Date.now()
  const bps = getBitrate(now)
  bytesWritten = 0
  lastRecord = now
  if (lastLoggedBitrate !== undefined) {
    const diff = Math.abs(bps - lastLoggedBitrate)
    const max = Math.max(bps, lastLoggedBitrate)
    const change = diff / max
    if (change < 1) return // only log big SSE bitrate changes
  }
  nodecg.log.info(`SSE Bitrate changed: ${formatBitrate(bps)}`)
  lastLoggedBitrate = bps
}

export function formatBitrate (bps: number): string {
  if (bps < 10_000) return `${Math.floor(bps)}bps`
  if (bps < 10_000_000) return `${Math.floor(bps / 1_000)}kbps`
  return `[!!] ${Math.floor(bps / 1_000_000)}mbps`
}
