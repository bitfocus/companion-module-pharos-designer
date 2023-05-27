/**
 * Class to define the PharosClient
 * @author Jonas Hartmann
 */
export class PharosClient {
	host
	token

	constructor() {
		this.host = ''
		this.token = ''
	}

	/**
	 * Authenticate the client with the Pharos controller using the provided username and password.
	 * @param host The IP Address of the controller.
	 * @param username The username for authentication.
	 * @param password The password for authentication.
	 */
	async authenticate(host, username, password) {
		console.log('Authenticating...')
		this.host = host

		const url = `http://${this.host}/authenticate`
		const body = new FormData()
		body.append('username', username)
		body.append('password', password)
		// QUESTION: are those try/catch's really neccessary?
		try {
			const response = await fetch(url, {
				method: 'POST',
				body: body,
			})

			if (response.ok) {
				console.log('Authentication successful')
				// Authentication successful
				const responseData = await response.json()
				this.token = await responseData.token
				const data = {
					success: true,
					token: this.token,
				}
				return data
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occured during authentification: ${error}`,
			}
		}
	}

	/**
	 * Logout the client.
	 */
	async logout() {
		console.log('Logout...')
		const url = `http://${this.hose}/logout`

		const headers = new Headers()
		headers.append('Authorization', `Bearer ${this.token}`)

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: headers,
			})

			if (response.ok) {
				return {
					success: true,
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occured while logging out: ${error}`,
			}
		}
	}

	/**
	 * Get information about the timelines in the project.
	 * @param timelineNumbers Optional. The timeline numbers to filter the results.
	 * @returns An array containing the timeline objects.
	 */
	async getTimelines(timelineNumbers) {
		console.log(`Getting timelines${timelineNumbers ? ' ' + timelineNumbers : ''}...`)
		const url = `http://${this.host}/api/timeline${timelineNumbers ? `?num=${timelineNumbers}` : ''}`

		const headers = new Headers()
		headers.append('Content-Type', 'application/json')
		headers.append('Authorization', `Bearer ${this.token}`)

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: headers,
			})

			if (response.ok) {
				const responseData = await response.json()
				const timelines = responseData.timelines
				// Update token
				this.token = responseData.token
				const data = {
					success: true,
					token: this.token,
					timelines,
				}
				return data
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occured while getting the timelines: ${error}`,
			}
		}
	}

	/**
	 * Control the timeline of the project.
	 * @param action The action to perform on the timeline.
	 * @param options Additional options for controlling the timeline.
	 * @returns success = true if request was successful.
	 */
	async controlTimeline(action, options) {
		console.log('Controlling timeline...')
		const url = `http://${this.host}/api/timeline`

		const headers = new Headers()
		headers.append('Content-Type', 'application/json')
		headers.append('Authorization', `Bearer ${this.token}`)
		const body = {
			action,
			...options,
		}

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify(body),
			})
			// this response returns a 204 (no-content)
			// the docs state that a new token should be returned
			// this is not critical since the 4.5min timer takes
			// care of always having a valid token
			// https://pharos-controller-api.readthedocs.io/en/latest/guide/web-api-authentication.html#token-authentication
			if (response.status === 204) {
				return {
					success: true,
				}
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occurred while controlling the timeline: ${error}`,
			}
		}
	}

	/**
	 * Get information about the groups in the project.
	 * @param groupNumbers Optional. The group numbers to filter the results.
	 * @returns An array containing the group objects.
	 */
	async getGroups(groupNumbers) {
		console.log(`Getting groups${groupNumbers ? ' ' + groupNumbers : ''}...`)
		const url = `http://${this.host}/api/group${groupNumbers ? `?num=${groupNumbers}` : ''}`

		const headers = new Headers()
		headers.append('Content-Type', 'application/json')
		headers.append('Authorization', `Bearer ${this.token}`)

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: headers,
			})

			if (response.ok) {
				const responseData = await response.json()
				const groups = responseData.groups
				// update token
				this.token = responseData.token
				const data = {
					success: true,
					token: this.token,
					groups,
				}
				return data
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occurred while getting the groups: ${error}`,
			}
		}
	}

	/**
	 * Control a group in the project.
	 * @param action The action to perform on the group.
	 * @param options Additional options for controlling the group.
	 * @returns success: true if request was successful.
	 */
	async controlGroup(action, options) {
		console.log('Controlling groups...')
		const url = `http://${this.host}/api/group`

		const headers = new Headers()
		headers.append('Content-Type', 'application/json')
		headers.append('Authorization', `Bearer ${this.token}`)
		const body = {
			action,
			...options,
		}

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify(body),
			})

			// this response returns a 204 (no-content)
			// the docs state that a new token should be returned
			// this is not critical since the 4.5min timer takes
			// care of always having a valid token
			// https://pharos-controller-api.readthedocs.io/en/latest/guide/web-api-authentication.html#token-authentication
			if (response.status === 204) {
				return {
					success: true,
				}
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occurred while controlling the groups: ${error}`,
			}
		}
	}

	/**
	 * Get information about the scenes in the project and their state on the controller.
	 * @param sceneNumber Optional. The scene numbers to filter the results.
	 * @returns An array of Scene objects representing the scenes and their states.
	 */
	async getScenes(sceneNumbers) {
		console.log(`Getting scenes${sceneNumbers ? ' ' + sceneNumbers : ''}...`)
		const url = `http://${this.host}/api/scene${sceneNumbers ? `?num=${sceneNumbers}` : ''}`

		const headers = new Headers()
		headers.append('Content-Type', 'application/json')
		headers.append('Authorization', `Bearer ${this.token}`)

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: headers,
			})

			if (response.ok) {
				const responseData = await response.json()
				const scenes = responseData.scenes
				// Update token
				this.token = responseData.token
				const data = {
					success: true,
					token: this.token,
					scenes,
				}
				return data
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occurred while getting the scenes: ${error}`,
			}
		}
	}

	/**
	 * Control a scene in the project.
	 * Action will propagate to all controllers in a project.
	 * @param action start, release or toggle
	 * @param options num: integer (Number of scene is REQUIRED) fade: number (Optional Fade Time)
	 * @returns success: true if request was successful.
	 */
	async controlScene(action, options) {
		console.log('Controlling scenes...')
		const url = `http://${this.host}/api/scene`

		const headers = new Headers()
		headers.append('Content-Type', 'application/json')
		headers.append('Authorization', `Bearer ${this.token}`)
		const body = {
			action,
			...options,
		}

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: headers,
				body: JSON.stringify(body),
			})

			// this response returns a 204 (no-content)
			// the docs state that a new token should be returned
			// this is not critical since the 4.5min timer takes
			// care of always having a valid token
			// https://pharos-controller-api.readthedocs.io/en/latest/guide/web-api-authentication.html#token-authentication
			if (response.status === 204) {
				return {
					success: true,
				}
			} else if (response.status === 400) {
				return {
					success: false,
					error: 'Invalid request',
				}
			} else {
				return {
					success: false,
					error: 'Authentification failed',
				}
			}
		} catch (error) {
			// Network or server error
			return {
				success: false,
				error: `An error occurred while controlling the groups: ${error}`,
			}
		}
	}
}
