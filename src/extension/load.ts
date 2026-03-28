/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { setupAdminActions } from './admin-actions'
import { setDefaultReplicants } from './default-replicants'
import { setupRemoteLoggerListener } from './logger'
import { setupInstanceSync } from './sync/instance-sync'
import { nodecg } from './util/nodecg'

setupRemoteLoggerListener()
setupInstanceSync()
setupAdminActions()
nodecg.listenFor('reset-replicants', setDefaultReplicants)
