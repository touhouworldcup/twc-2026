/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

export async function checkReady (): Promise<void> {
  await Promise.all([checkRendered(), checkFonts(), checkImages(), checkVideos(), checkStyles()])
}

async function checkRendered (): Promise<void> {
  for (let i = 0; i < 2; i++) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
}

async function checkFonts (): Promise<void> {
  await document.fonts.ready
  await Promise.all(Array.from(document.fonts).map(async (font) => {
    try {
      await font.load()
    } catch (error) {
      console.log('Error loading font', font)
    }
  }))
}

async function checkImages (): Promise<void> {
  await Promise.all([...document.querySelectorAll('img')].map(async (image) => {
    if (image.complete) return
    await new Promise(resolve => {
      image.onload = image.onerror = resolve
    })
  }))
}

async function checkVideos (): Promise<void> {
  await Promise.all([...document.querySelectorAll('video')].map(async (vid) => {
    if (vid.readyState >= 3) return
    await new Promise(resolve => {
      vid.oncanplay = vid.onerror = resolve
    })
  }))
}

async function checkStyles (): Promise<void> {
  await Promise.all([...document.querySelectorAll('link')].map(async (link) => {
    if (link.rel !== 'stylesheet' || link.sheet !== null) return
    await new Promise(resolve => {
      link.addEventListener('load', resolve, { once: true })
      link.addEventListener('error', resolve, { once: true })
    })
  }))
}
