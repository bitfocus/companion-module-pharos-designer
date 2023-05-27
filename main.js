import { InstanceBase, runEntrypoint, InstanceStatus, Regex } from '@companion-module/base'
import { getActions } from './actions.js'
import { getVariables } from './variables.js'
import { UpgradeScripts } from './upgrades.js'

import { PharosClient } from './pharos.js'

class PharosInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.startup(config)
	}

	// When module gets deleted
	async destroy() {
		if (this.controller !== undefined) {
			this.controller.logout()
			delete this.controller
		}
		if (this.poll_interval !== undefined) {
			clearInterval(this.poll_interval)
			delete this.poll_interval
		}
		this, this.updateStatus(InstanceStatus.Disconnected)
		this.log('debug', 'destroy')
	}

	startup(config) {
		this.config = config
		this.actionData = {
			groups: [],
			scenes: [],
			timelines: [],
		}

		this.updateActions() // export actions
		this.updateVariableDefinitions() // export variable definitions
		this.initController()
	}

	async initController() {
		const self = this
		if (this.controllerTimer) {
			clearInterval(this.controllerTimer)
			delete this.controllerTimer
		}

		if (this.poll_interval) {
			clearInterval(this.poll_interval)
			delete this.poll_interval
		}

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.host) {
			this.controller = new PharosClient()
			const authRes = await this.controller.authenticate(this.config.host, this.config.user, this.config.password)
			this.log('debug', authRes.error)
			if (!authRes.success) {
				if (self.lastStatus != InstanceStatus.UnknownError) {
					self.updateStatus(InstanceStatus.UnknownError, 'Network error')
					self.lastStatus = InstanceStatus.UnknownError
					self.log('error', 'A network error occured while trying to authenticate')
				}
				self.pharosConnected = false
				// set timer to retry connection in 10s
				if (self.controllerTimer) {
					clearInterval(self.controllerTimer)
					delete self.controllerTimer
				}
				delete self.controller
				self.controllerTimer = setInterval(function () {
					self.updateStatus(InstanceStatus.ConnectionFailure, 'Retrying connection')
					self.initController()
				}, 10000)
			} else if (authRes.success) {
				self.connect_time = Date.now()
				if (self.lastStatus != InstanceStatus.Ok) {
					self.updateStatus(InstanceStatus.Ok, 'Connected')
					self.log('info', 'Controller connected')
					self.lastStatus = InstanceStatus.Ok
				}
				self.pharosConnected = true
				// start the 4.5min timer for new tokens
				if (this.poll_interval) {
					delete this.poll_interval
				}
				this.pollTime = 270000 // 4.5min intervals
				this.poll_interval = setInterval(this.poll.bind(this), this.pollTime) //ms for poll
				this.poll()
				this.groupsResponse = await this.controller.getGroups()
				this.scenesResponse = await this.controller.getScenes()
				this.timelinesResponse = await this.controller.getTimelines()
				this.log('debug', 'Storing variables...')
				// filter groups first because some dont have an id
				this.filteredGroups = this.groupsResponse.groups.filter(function (group) {
					if (group.num) {
						return group
					}
				})
				this.actionData.groups = this.filteredGroups.map(function (group) {
					return { id: group.num, label: group.name }
				})
				this.actionData.scenes = this.scenesResponse.scenes?.map(function (scene) {
					return { id: scene.num, label: scene.name }
				})
				this.actionData.timelines = this.timelinesResponse.timelines?.map(function (timeline) {
					return { id: timeline.num, label: timeline.name }
				})
				this.updateActions() // update actions to have the actionData
			}
		}
	}

	async poll() {
		this.log('debug', 'Polling new token')

		// re-connect?
		if (!this.pharosConnected) {
			this.initController()
			return
		}

		// wait for class response before sending status requests
		if (this.controller === undefined) {
			this.log('error', 'Controller undefined')
			return
		}

		// first time or every 4.5mins
		if (this.lastHours === undefined || Date.now() - this.lastHours > 300000) {
			this.log('debug', 'First time poll')
			this.lastHours = Date.now()
		}

		// get the new token
		const res = await this.controller.getGroups()
		if (!res.success || res.token == undefined) {
			this.log('error', 'Polling new token failed')
			await this.initController()
		} else if (res.success) {
			this.log('debug', 'Recieved new token')
		}
	}

	async configUpdated(config) {
		this.config = config
		this.init(config)
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value:
					'This module requires API v6 in your Designer 2 project.<br/>API v6 is available from Pharos Designer Version 2.9 upwards and can be selected under Project > Project Properties > Controller API.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 12,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'user',
				label: 'User',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
			},
		]
	}

	updateActions() {
		const actions = getActions.bind(this)()
		this.setActionDefinitions(actions)
	}

	updateVariableDefinitions() {
		const variables = getVariables.bind(this)()
		this.setVariableDefinitions(variables)
	}

	async controlTimeline(action, options) {
		const res = await this.controller.controlTimeline(action, options)
		if (!res.success) {
			this.updateStatus(InstanceStatus.UnknownError, res.error)
		}
		this.log('debug', `controlTimeline success: ${res.success}`)
	}

	async controlGroup(action, options) {
		const res = await this.controller.controlGroup(action, options)
		if (!res.success) {
			this.updateStatus(InstanceStatus.UnknownError, res.error)
		}
		this.log('debug', `controlGroup success: ${res.success}`)
	}

	async controlScene(action, options) {
		const res = await this.controller.controlScene(action, options)
		if (!res.success) {
			this.updateStatus(InstanceStatus.UnknownError, res.error)
		}
		this.log('debug', `controlScene success: ${res.success}`)
	}
}

runEntrypoint(PharosInstance, UpgradeScripts)
