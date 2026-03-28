import { I18N, albumArtist, categoryNames, formatScore, getPlayerName, results, westernDateTimeDisplay } from './i18n-util'

export const spanish: I18N = {
  nowPlaying: (s) => `AHORA REPRODUCIENDO: ${s.title} - ${s.artist}${albumArtist(s, ` (${s.albumArtist})`)}`,
  playerCurrentText: (s) => `ACTUAL: ${formatScore(s, ',')}`,
  playerTargetText: (p) => {
    if (p === undefined) return 'OBJETIVO: -'
    const target = `OBJETIVO (#${p.targetPlace}${p.tie ? ' TIE' : ''})`
    return `${target}: ${formatScore(p.target, ',')}`
  },
  results: results('Run aún no completada', ','),
  artwork: (a) => `ARTWORK HECHO POR ${a}`,
  teamName: (t) => t,
  playerName: (p) => getPlayerName(p),
  gameName: (g) => g.englishName,
  categoryName: categoryNames('Lunatic No Bomb', 'Lunatic Puntaje', 'Extra Puntaje', 'Clasificatoria'),
  localTime: (date) => westernDateTimeDisplay('America/Mexico_City', date),
  resetTime: ['TIEMPO', 'LÍMITE'],
  finalResults: 'RESULTADOS FINALES'
}
