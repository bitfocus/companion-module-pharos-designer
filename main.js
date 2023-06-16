import { InstanceBase, runEntrypoint, InstanceStatus, Regex } from '@companion-module/base'
import { getActions } from './actions.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { UpgradeScripts } from './upgrades.js'

import { DesignerClient } from 'pharos-controllers'

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
		this.pharosConnected = false
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

		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}

		if (this.config.host) {
			this.controller = new DesignerClient(this.config.host)
			const authRes = await this.controller.authenticate(this.config.user, this.config.password)
			this.log('debug', authRes.error)
			if (!authRes.success) {
				if (self.lastStatus != InstanceStatus.UnknownError) {
					self.updateStatus(InstanceStatus.UnknownError, 'Network error')
					self.lastStatus = InstanceStatus.UnknownError
					self.log('error', 'A network error occured while trying to authenticate')
				}
				this.pharosConnected = false
			} else if (authRes.success) {
				self.connect_time = Date.now()
				if (self.lastStatus != InstanceStatus.Ok) {
					self.updateStatus(InstanceStatus.Ok, 'Connected')
					self.log('info', 'Controller connected')
					self.lastStatus = InstanceStatus.Ok
				}
				this.pharosConnected = true
				this.groupsResponse = await this.controller.getGroups()
				this.scenesResponse = await this.controller.getScenes()
				this.timelinesResponse = await this.controller.getTimelines()
				if (this.groupsResponse.success && this.scenesResponse.success && this.timelinesResponse.success) {
					this.log('debug', 'Storing variables...')
					// filter groups first because some dont have an id
					this.filteredGroups = this.groupsResponse.groups.filter(function (group) {
						if (group.num) {
							return group
						}
					})
					// mapping the data to select option arrays
					this.actionData.groups = this.filteredGroups.map(function (group) {
						return { id: group.num, label: group.name }
					})
					this.actionData.scenes = this.scenesResponse.scenes?.map(function (scene) {
						return { id: scene.num, label: scene.name }
					})
					this.actionData.timelines = this.timelinesResponse.timelines?.map(function (timeline) {
						return { id: timeline.num, label: timeline.name }
					})
					// update actions and feedbacks after data has been recieved
					this.updateActions() // update actions to have the actionData
					this.updateFeedbacks() // update feedbacks to have actionData
				} else {
					if (self.lastStatus != InstanceStatus.UnknownError) {
						self.updateStatus(InstanceStatus.UnknownError, 'Network error')
						self.lastStatus = InstanceStatus.UnknownError
						self.log('error', 'Populating the groups/timelines/scenes failed')
					}
				}
			}
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

	updateFeedbacks() {
		this.setFeedbackDefinitions(getFeedbacks(this))
	}

	updateActions() {
		this.setActionDefinitions(getActions(this))
	}

	updateVariableDefinitions() {
		this.setVariableDefinitions(getVariables(this))
	}

	async controlTimeline(action, options) {
		const res = await this.controller.controlTimeline(action, options)
		this.checkFeedbacks('timelineState')
		this.log('debug', `controlTimeline success: ${res.success}`)
	}

	async controlGroup(action, options) {
		const res = await this.controller.controlGroup(action, options)
		this.checkFeedbacks('groupState')
		this.log('debug', `controlGroup success: ${res.success}`)
	}

	async controlScene(action, options) {
		const res = await this.controller.controlScene(action, options)
		this.checkFeedbacks('sceneState')
		this.log('debug', `controlScene success: ${res.success}`)
	}
}

runEntrypoint(PharosInstance, UpgradeScripts)
