const axios = require("axios")
const axiosRetry = require("axios-retry")
const _ = require("lodash")
const Promise = require("bluebird")
const rateLimit = require("axios-rate-limit")
const qs = require('qs')

module.exports = class APIGS {
    constructor(token, account_id, url)  {
		this.account_id = account_id
		this.requestMain = axios.create({
			baseURL: url,
            headers: {
                account_id
            },
			paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
		})
		this.requestMain.defaults.headers.common['Authorization'] = "Bearer "  + token
        this.requestMain.interceptors.request.use(request => {
            console.log(`Send for account ${account_id}: ${request.method.toUpperCase()} ${request.baseURL}${request.url}`)
            return request
        })
		this.requestSecondary = axios.create({
			baseURL: process.env.API_GS_HOST_SECONDARY,
            headers: {
                account_id
            },
			paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' })
		})
		this.requestSecondary.defaults.headers.common['Authorization'] = "Bearer "  + token
        this.requestSecondary.interceptors.request.use(request => {
            console.log(`Send for account ${account_id}: ${request.method.toUpperCase()} ${request.baseURL}${request.url}`)
            return request
        })

		this.requestMain = rateLimit(this.requestMain, { maxRPS: 5 })
		this.requestSecondary = rateLimit(this.requestSecondary, { maxRPS: 5 })

		axiosRetry(this.requestMain, { retries: 3, retryDelay: axiosRetry.exponentialDelay, retryCondition: () => true })
		axiosRetry(this.requestSecondary, { retries: 3, retryDelay: axiosRetry.exponentialDelay, retryCondition: () => true })
    }
	getMe = async () => {
		try {
			const res = await this.requestSecondary.get(`/account/me`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    createProduction = async (prod) => {
        try {
			const res = await this.requestMain.post(`/production`, prod)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
    }
	getProduction = async (root_id) => {
		try {
			const res = await this.requestMain.get(`/production/${root_id}/bench`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	triggerExport = async (root_id) => {
		try {
			const res = await this.requestMain.post(`/production/${root_id}/export`, {})

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getSizeOfBench = async (bench_id) => {
		try {
			const res = await this.requestMain.get(`/picture?bench_id=${bench_id}`)

			return res.headers["x-total-count"]
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getProductions = async () => {
		try {
			const res = await this.requestMain.get(`/production`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getPicture = async (picture_id) => {
		try {
			const res = await this.requestMain.get(`/picture/${picture_id}`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getPictures = async (params) => {
		try {
			let pictures = []
			console.log('params', params)
			const get = async (offset = 0) => {
				const res = await this.requestMain.get(`/picture`, { params, headers: { offset } })
				if (_.size(res.data) > 0) {
					pictures = pictures.concat(res.data)
					console.log('loading pictures ', _.size(pictures) + ' / ', res.headers['x-total-count'])
				}
				if ( _.size(pictures) < res.headers['x-total-count']) {
					await get(offset + _.size(res.data))
				}
			}
			await get()
			console.log("received total", pictures.length)

			return pictures
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setPictureFrame = async (picture_id, frame) => {
		try {
			await Promise.delay(50)
			const res = await this.requestMain.put(`/picture/${picture_id}/frame`, frame)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setPicturestatus = async (picture_id, picturestatus, comment) => {
		try {
			await Promise.delay(50)
			const res = await this.requestMain.post(`/picture/${picture_id}/picturestatus`, {
                picturestatus,
                comment
            })

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getReference = async (reference_id) => {
		try {
			const res = await this.requestMain.get(`/reference/${reference_id}`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getReferences = async (params) => {
		try {
			let references = []
			console.log('params references', params)
			const get = async (offset = 0) => {
				const res = await this.requestSecondary.get(`/reference`, { params, headers: { offset } })
				if (_.size(res.data) > 0) {
					references = references.concat(res.data)
					await get(offset + _.size(res.data))
				}
			}
			await get()

			return references
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}

    getFormats = async () => {
		try {
			const res = await this.requestMain.get(`/specification/format`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getFormat = async (format_id) => {
		try {
			const res = await this.requestMain.get(`/specification/format/${format_id}`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setFormat = async (format) => {
		try {
			const res = await this.requestMain.post(`/specification/format`, format)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getPictureUrl = async (picture_id, api = "main") => {
		try {
			let request = this.requestMain
			if (api !== "main") {
				request = this.requestSecondary
			}
			const res = await request.post(`/picture/${picture_id}/publicurl`, {})

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    downloadPicture = async (picture_id) => {
		try {
			const res = await this.requestMain.get(`/picture/${picture_id}/download`, { responseType: 'arraybuffer' })

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    uploadPicture = async (root_id, bench_id, body) => {
		try {
			const res = await this.requestMain.post(
                `/production/${root_id}/bench/${bench_id}/upload`,
                body,
                {
                    headers: {
                        "Content-Type": `multipart/form-data; boundary=${body._boundary}`
                    }
                }
            )

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	uploadPictureUrl = async (root_id, bench_id, body) => {
		try {
			const res = await this.requestMain.post(
				`/production/${root_id}/bench/${bench_id}/upload/url`
				, body
			)
			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getShootingmethod = async () => {
		try {
			const res = await this.requestMain.get(`/shootingmethod`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setShootingmethod = async (shootingmethod) => {
		try {
			const res = await this.requestMain.post(`/shootingmethod`, shootingmethod)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    getWebhook = async () => {
		try {
			const res = await this.requestSecondary.get(`/webhook`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setWebhook = async (webhook) => {
		try {
			const res = await this.requestSecondary.post(`/webhook`, webhook)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    deleteWebhook = async (webhook_id) => {
		try {
			const res = await this.requestSecondary.delete(`/webhook/${webhook_id}`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getExports = async () => {
		try {
			const res = await this.requestMain.get(`/production/export`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setExport = async (_export) => {
		try {
			const res = await this.requestMain.post(`/production/export`, _export)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    archiveExport = async (export_id) => {
		try {
			const res = await this.requestMain.delete(`/production/export/${export_id}`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getTemplates = async () => {
		try {
			const res = await this.requestMain.get(`/production/template`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    setTemplate = async (template) => {
		try {
			const res = await this.requestMain.post(`/production/template`, template)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
    deleteTemplate = async (template_id) => {
		try {
			const res = await this.requestMain.delete(`/production/template/${template_id}`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getPlugins = async () => {
		try {
			const res = await this.requestSecondary.get(`/account/plugin`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	activePlugin = async (plugin_id) => {
		try {
			const res = await this.requestSecondary.patch(`/account/plugin/${plugin_id}`, { active: true })

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	sendToEdition = async (edition) => {
		try {
			const res = await this.requestMain.post(`/picture/edit/bulk`, edition)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getTransfers = async () => {
		try {
			const res = await this.requestMain.get(`/transfer`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getTag = async (picture_id) => {
		try {
			const res = await this.requestMain.get(`/picture/${picture_id}/tag`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	setTag = async (picture_id, tag) => {
		try {
			await Promise.delay(50)
			const res = await this.requestMain.put(`/picture/${picture_id}/tag`, tag)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getComments = async (picture_id) => {
		try {
			const res = await this.requestMain.get(`/picture/${picture_id}/comment`)

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	setComment = async (picture_id, comment) => {
		try {
			const res = await this.requestMain.post(`/picture/${picture_id}/comment`, { comment })

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getAnnotation = async (picture_id) => {
		try {
			const res = await this.requestMain.get(`/picture/${picture_id}/annotations`)

			return res.data && res.data.annotations
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	setAnnotation = async (picture_id, annotation) => {
		try {
			const res = await this.requestMain.post(`/picture/${picture_id}/annotations`, { annotations: annotation })

			return res.data
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
	getFormatForPicture = async (picture_id) => {
		try {
			const res = await this.requestMain.get(`/picture/${picture_id}/specification`)

			return _.first(res.data.formats)
		} catch (error) {
			console.error(error.toJSON ? error.toJSON() : error)
			throw error
		}
	}
}
