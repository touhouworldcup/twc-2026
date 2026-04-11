import { english } from './english'
import { I18N, easternDateTimeDisplay, results } from './i18n-util'

export const japanese: I18N = {
  nowPlaying: english.nowPlaying,
  playerCurrentText: english.playerCurrentText,
  playerTargetText: english.playerTargetText,
  results: results('未完走', ','),
  artwork: (a) => `アーティスト: ${a}`,
  teamName: (t) => t,
  playerName: english.playerName,
  gameName: (g) => g.japaneseName,
  categoryName: english.categoryName,
  localTime: (date) => easternDateTimeDisplay('Asia/Tokyo', date),
  resetTime: ['RESET', 'TIME'],
  finalResults: 'FINAL RESULTS'
}
