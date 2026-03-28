/*
 * Touhou World Cup 2026 https://touhouworldcup.com/
 * Copyright (c) 2026 Paul Schwandes / 32th System
 * All Rights Reserved.
 */

import { bundleConfig, nodecg, onLoad, querySelector } from '../../shared/common'
import { WorldDataTargetServer } from '../../types/schemas/world-data-target-server'
import { WorldDataConnected } from '../../types/schemas/world-data-connected'
import { StreamDelay } from 'src/types/schemas/stream-delay'

const config = bundleConfig.regions
const isWorldFeedNodeCG = config.currentRegion === 'world'

const selectServerReplicant = nodecg.Replicant<WorldDataTargetServer>('world-data-target-server')
const connected = nodecg.Replicant<WorldDataConnected>('world-data-connected')
const streamDelay = nodecg.Replicant<StreamDelay>('stream-delay')
onLoad(selectServerReplicant, connected, streamDelay)

createButtons('#general-buttons', 'reset-text-info', 'Reset text info', '#24e6f7ff', true)
createButtons('#general-buttons', 'reload-pages', 'Reload all browser pages', '#f3ec2aff')
createButtons('#danger-buttons', 'update-runs', 'Run database update', '#ff7f08ff', true)
createButtons('#danger-buttons', 'reboot-nodecg', 'Reboot NodeCG', '#ee4c24ff')

type Container = '#general-buttons' | '#danger-buttons'
function createButtons (
  container: Container,
  actionName: string,
  description: string,
  color: string,
  worldOnly: boolean = false
): void {
  if (!worldOnly || isWorldFeedNodeCG) createActionButton(container, actionName, description, color, false)
  if (!worldOnly && isWorldFeedNodeCG) createActionButton(container, actionName, description, color, true)
}

function createActionButton (container: Container, actionName: string, description: string, color: string, subs: boolean): void {
  const btn = document.createElement('button')
  const text = `${subs ? '!! TO ALL !! ' : ''}${description}`
  btn.style.backgroundColor = color
  if (subs) btn.style.border = '2px solid red'
  btn.innerHTML = text
  querySelector(container).appendChild(btn)
  btn.addEventListener('click', () => {
    btn.disabled = true
    void nodecg.sendMessage(actionName, subs).then((result) => {
      btn.innerHTML = `${text}, Action completed. ${result as string}`
      setTimeout(() => {
        btn.disabled = false
        btn.innerHTML = text
      }, 5000)
    })
  })
}

const selectServer = querySelector<HTMLSelectElement>('#select-server')
for (const allowedServer of bundleConfig.regions.allowedServers) {
  const option = document.createElement('option')
  option.value = allowedServer
  option.innerHTML = allowedServer
  selectServer.appendChild(option)
}
selectServer.onchange = () => {
  selectServerReplicant.value = selectServer.value
}
selectServerReplicant.on('change', (value) => {
  selectServer.value = value ?? ''
})

connected.on('change', (value) => {
  const isConnected = value === true
  const elem = querySelector('#is-connected')
  if (bundleConfig.regions.currentRegion === 'world') {
    elem.innerHTML = 'This is a world feed NodeCG'
    return
  }

  elem.innerHTML = isConnected
    ? 'Connected to world feed NodeCG'
    : 'Not connected to world feed NodeCG'
  elem.style.color = isConnected ? '' : 'red'
})

querySelector('#updateLogId').onclick = () => {
  const data = ['#oldLogId', '#newLogId'].map(id => querySelector<HTMLInputElement>(id).value)
  void nodecg.sendMessage('change-log-id', data)
  console.log('Sending update log message', data)
}

const streamDelayInput = querySelector<HTMLInputElement>('#stream-delay-input')
querySelector('#stream-delay-update').onclick = () => {
  const delay = parseFloat(streamDelayInput.value)
  if (isNaN(delay)) {
    streamDelayInput.value = 'Invalid input'
    return
  }
  streamDelay.value = delay
}
streamDelay.on('change', (val) => {
  streamDelayInput.value = String(val)
})
