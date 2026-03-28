import { english } from './english'
import { I18N, categoryNames, easternDateTimeDisplay, getPlayerName, results } from './i18n-util'

export const japanese: I18N = {
  nowPlaying: english.nowPlaying,
  playerCurrentText: english.playerCurrentText,
  playerTargetText: english.playerTargetText,
  results: results('未完走', ','),
  artwork: (a) => `アーティスト: ${a}`,
  teamName: (t) => t,
  playerName: (p) => getPlayerName(p, 'cn', 'jp'),
  gameName: (g) => g.japaneseName,
  categoryName: categoryNames('Lunaticサバイバル', 'Lunaticスコアタ', 'Extraスコアタ', '予選'),
  localTime: (date) => easternDateTimeDisplay('Asia/Tokyo', date),
  resetTime: ['RESET', 'TIME'],
  finalResults: 'FINAL RESULTS'
}
