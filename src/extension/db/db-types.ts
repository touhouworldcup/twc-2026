/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

export interface Match {
  Date__UTC_: string | null
  Category: string
  Player_1: string
  Player_2: string
  Player_3: string
  ResetTime: number
}

export interface Player {
  Name: string
  JapaneseName: string | null
  Stream: string | null
  DisplayStream: number
  ChineseName: string | null
}
