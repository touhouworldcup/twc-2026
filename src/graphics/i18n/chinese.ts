import { I18N, albumArtist, categoryNames, easternDateTimeDisplay, formatScore, getPlayerName, results } from './i18n-util'

export const chinese: I18N = {
  nowPlaying: (s) => `正在播放：${s.title} - ${s.artist}${albumArtist(s, ` 「${s.albumArtist}」`)}`,
  playerCurrentText: (s) => `机体：${formatScore(s, ',')}`,
  playerTargetText: (p) => {
    if (p === undefined) return '目标：-'
    const target = `目标 (${p.tie ? '第' : '第'}${p.targetPlace}) `
    return `${target}: ${formatScore(p.target, ',')}`
  },
  results: results('暂无成绩', ','),
  artwork: (a) => `画师: ${a}`,
  teamName: (t) => t,
  playerName: (p) => getPlayerName(p, 'jp', 'cn'),
  gameName: (g) => g.japaneseName,
  categoryName: categoryNames('Lunatic 避弹', 'Lunatic打分', 'Extra打分', '预选'),
  localTime: (date) => easternDateTimeDisplay('Asia/Shanghai', date),
  resetTime: ['推把', '时间'],
  finalResults: '最终成绩'
}
