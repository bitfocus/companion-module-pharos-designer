export function getActions(self) {
	return {
		controlTimeline: {
			name: 'Control Timeline',
			options: [
				/* 	QUESTION: why is this not working?
					https://bitfocus.github.io/companion-module-base/interfaces/CompanionInputFieldStaticText.html */
				{
					id: 'info-text-fade',
					type: 'static-text',
					label: 'Important',
					value: 'The fade time set in Companion will always overwrite the default fade time',
				},
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'start', label: 'Start' },
						{ id: 'release', label: 'Release' },
						{ id: 'toggle', label: 'Toggle' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'resume', label: 'Resume' },
						{ id: 'set_rate', label: 'Set rate' },
						{ id: 'set_position', label: 'Set position' },
					],
					default: 'start',
					required: true,
				},
				{
					type: 'dropdown',
					id: 'num',
					label: 'Timeline',
					choices: self.actionData.timelines,
				},
				{
					id: 'rate',
					type: 'textinput',
					label: 'Rate (0.1 to 1 is default timeline rate)',
					isVisible: (options) => options.action == 'set_rate',
					min: 0,
					max: 1,
					default: 1,
					required: true,
				},
				{
					id: 'position',
					type: 'textinput',
					label: 'Position (Fraction of timeline e.g. 0.5 or 10:100)',
					isVisible: (options) => options.action == 'set_position',
					required: true,
				},
				{
					id: 'fade',
					type: 'number',
					label: 'Fade (seconds)',
					min: 0,
				},
			],
			callback: (event) => {
				event = event.options
				console.log(event)
				const action = event.action
				delete event.action
				const options = event
				self.controlTimeline(action, options)
			},
		},
		controlGroups: {
			name: 'Control Groups',
			options: [
				/*{
					id: 'info-text-fade',
					type: 'static-text',
					label: 'Important',
					value: 'The fade time set in Companion will always overwrite the default fade time!',
				},*/
				{
					type: 'dropdown',
					id: 'num',
					label: 'Groups',
					choices: self.actionData.groups,
				},
				{
					id: 'level',
					type: 'number',
					label: 'Master Intensity  (0-1)',
					default: 0,
					max: 1,
					min: 0,
				},
				{
					id: 'fade',
					type: 'number',
					label: 'Fade (seconds)',
					min: 0,
				},
			],
			callback: (event) => {
				// currently only master-intensity is supported
				// therefore the string is hard coded in here
				// in future API versions this might change and
				// a new input field needs to be added
				event = event.options
				const options = event
				console.log(options)
				self.controlGroup('master_intensity', options)
			},
		},
		controlScenes: {
			name: 'Control Scenes',
			options: [
				/*{
					id: 'info-text-fade',
					type: 'static-text',
					label: 'Important',
					value: 'The fade time set in Companion will always overwrite the default fade time!',
				},*/
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					choices: [
						{ id: 'start', label: 'Start' },
						{ id: 'release', label: 'Release' },
						{ id: 'toggle', label: 'Toggle' },
					],
					default: 'start',
				},
				{
					type: 'dropdown',
					id: 'num',
					label: 'Scenes',
					choices: self.actionData.scenes,
				},
				{
					id: 'fade',
					type: 'number',
					label: 'Fade (seconds)',
					min: 0,
				},
			],
			callback: (event) => {
				event = event.options
				const action = event.action
				delete event.action
				const options = event
				self.controlScene(action, options)
			},
		},
	}
}
