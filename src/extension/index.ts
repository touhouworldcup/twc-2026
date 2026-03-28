/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import NodeCG from 'nodecg/types'
import { setNodeCG } from './util/nodecg_set'

export default (nodecg: NodeCG.ServerAPI): void => {
  setNodeCG(nodecg)
  require('./load')
}
