import { combineRgb } from '@companion-module/base'

export function getFeedbacks(self) {
	const ColorWhite = combineRgb(255, 255, 255)
	const ColorBlack = combineRgb(0, 0, 0)
	const ColorRed = combineRgb(200, 0, 0)
	const ColorGreen = combineRgb(0, 200, 0)
	const ColorOrange = combineRgb(255, 102, 0)

	const feedbacks = {
		timelineState: {
			type: 'boolean',
			name: 'Change background color by state of timeline',
			description: 'If the selected timeline has the selected state, change the background color of the button.',
			defaultStyle: {
				bgcolor: ColorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Timeline',
					id: 'timeline',
					choices: self.actionData.timelines,
					required: true,
				},
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					choices: [
						{ id: 'released', label: 'Released' },
						{ id: 'running', label: 'Running' },
						{ id: 'paused', label: 'Paused' },
					],
					default: 'running',
					required: true,
				},
			],
			callback: async (feedback) => {
				// only run this if a timeline is selected to prevent errors
				if (feedback.options.timeline) {
					// get states of all timelines
					const res = await self.controller.getTimelines()
					// filter out the selected timeline
					const timeline = res.timelines.filter((timeline) => timeline.num == feedback.options.timeline)
					// return true if state matches selected state
					return feedback.options.state == timeline[0].state
				}
			},
		},
		sceneState: {
			type: 'boolean',
			name: 'Change background color by state of scene',
			description: 'If the selected scene has the selected state, change the background color of the button.',
			defaultStyle: {
				bgcolor: ColorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Scene',
					id: 'scene',
					choices: self.actionData.scenes,
					required: true,
				},
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					choices: [
						{ id: 'started', label: 'Started' },
						{ id: 'released', label: 'Released' },
					],
					default: 'started',
					required: true,
				},
			],
			callback: async (feedback) => {
				// only run this if a timeline is selected to prevent errors
				if (feedback.options.state && feedback.options.scene) {
					// get states of all scenes
					const res = await self.controller.getScenes()
					// filter out the selected scene
					const scene = res.scenes.filter((scene) => scene.num == feedback.options.scene)
					// return true if state matches selected state
					return feedback.options.state === scene[0].state
				}
			},
		},
		groupState: {
			type: 'boolean',
			name: 'Change background color by level of group',
			description: 'If the selected group has the selected brightness, change the background color of the button.',
			defaultStyle: {
				bgcolor: ColorGreen,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'group',
					choices: self.actionData.groups,
					required: true,
				},
				{
					type: 'dropdown',
					label: 'Operation',
					id: 'operation',
					choices: [
						{ id: 'more', label: '>' },
						{ id: 'less', label: '<' },
						{ id: 'equal', label: '=' },
					],
					default: 'equal',
					required: true,
				},
				{
					type: 'number',
					label: 'Level',
					id: 'level',
					max: 100,
					min: 0,
					required: true,
				},
			],
			callback: async (feedback) => {
				// only run this if everything is selected to prevent errors
				if (feedback.options.level && feedback.options.operation && feedback.options.group) {
					// get states of all groups
					const res = await self.controller.getGroups()
					// filter out the selected group
					const group = res.groups.filter((group) => group.num == feedback.options.group)
					// return true if state matches selected state
					console.log(group[0].level > feedback.options.level, group[0].level, feedback.options.level)
					switch (feedback.options.operation) {
						case 'more':
							return group[0].level > feedback.options.level
						case 'less':
							return group[0].level < feedback.options.level
						case 'equal':
							return group[0].level == feedback.options.level
					}
				}
			},
		},
	}
	return feedbacks
}
