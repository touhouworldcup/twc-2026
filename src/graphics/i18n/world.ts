import { english } from './english'
import { westernDateTimeDisplay } from './i18n-util'

export const world = { ...english }
world.localTime = (date) => westernDateTimeDisplay('Asia/Tokyo', date)
