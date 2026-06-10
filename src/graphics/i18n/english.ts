import { I18N, albumArtist, categoryNames, formatScore, getPlayerName, results, westernDateTimeDisplay } from './i18n-util'

export const english: I18N = {
  nowPlaying: (s) => `Now Playing: ${s.title} by ${s.artist}${albumArtist(s, ` (${s.albumArtist})`)}`,
  playerCurrentText: (s) => `CURRENT: ${formatScore(s, ',')}`,
  playerTargetText: (p) => {
    if (p === undefined) return 'TARGET: -'
    const target = `TARGET (#${p.targetPlace}${p.tie ? ' TIE' : ''})`
    return `${target}: ${formatScore(p.target, ',')}`
  },
  results: results('No run yet', ','),
  artwork: (a) => `Artwork by ${a}`,
  teamName: (t) => `Team ${t}`,
  playerName: (p) => getPlayerName(p),
  gameName: (g) => g.englishName,
  categoryName: categoryNames('Lunatic Survival', 'Lunatic Scoring', 'Extra Scoring', 'Qualifier'),
  localTime: (date) => westernDateTimeDisplay('Europe/Berlin', date),
  resetTime: ['RESET', 'TIME'],
  finalResults: 'FINAL RESULTS'
}
