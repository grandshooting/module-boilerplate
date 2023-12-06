const axios = require("axios")
const axiosRetry = require("axios-retry")
const _ = require('lodash')
const Promise = require('bluebird')
const { v4: uuidv4 } = require('uuid')

var cacheForce = {}

module.exports = class APIGS {
    constructor(token, account_id)  {
		this.account_id = account_id
		this.request = axios.create({
			baseURL: process.env.API_SPECS_HOST,
            headers: {
                account_id
            }
		})
		this.request.defaults.headers.common['Authorization'] = "Bearer "  + token
        this.request.interceptors.request.use(request => {
            console.log(`Send for account ${account_id}: ${request.method.toUpperCase()} ${request.baseURL}${request.url}`)
            return request
        })

        this.waiting_certificate = {}
        this.resolve_certificate = {}

		axiosRetry(this.request, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: () => true
	})

        this._requestCertificate()
    }
    _requestCertificate = async () => {
        if (_.size(this.waiting_certificate) > 0) {
            try {
                const res = await this.request.post(`/certificate/pictures`, {
                    images: _.toArray(this.waiting_certificate)
                })

                _.forEach(res.data.processed, analyse => {
                    this.resolve_certificate[analyse.data.uuid] = analyse
                    delete this.waiting_certificate[analyse.data.uuid]
                })
            } catch (error) {
                console.error(error)
            }
        }

        await Promise.delay(1000)
        await this._requestCertificate()
    }
    getCertificate = async (picture, wait = true, retry = 3 * 15 * 60 * 10, uuid) => {
        if (retry === 0) {
            delete this.waiting_certificate[uuid]
            console.error("Can't analyse picture", picture)
            throw 'Analyse error'
        }

	if (!picture.thumbnail) {
	    console.error('Picture without thumbnail', picture)
	}
        if (wait) {
            uuid = uuid || uuidv4()
            if (!this.waiting_certificate[uuid]) {
                this.waiting_certificate[uuid] = {
                    url: picture.thumbnail.replace('750', 'raw'),
                    smalltext: picture.smalltext,
                    _id: _.first((picture.thumbnail).match(/([^\/]+)(?=\.\w+$)/)),
                    uuid: uuid
                }
            }
            if (this.resolve_certificate[uuid]) {
                const res = { ...this.resolve_certificate[uuid] }
                delete this.resolve_certificate[uuid]

                return res
            } else {
                await Promise.delay(100)

                return await this.getCertificate(picture, wait, retry - 1, uuid) 
            }
        } else {
            try {
                await this.request.post(`/certificate/pictures`, {
                    force_analysis : cacheForce[picture.thumbnail] ? false : true,
                    images: [{
                        url: picture.thumbnail.replace('750', 'raw'),
                        smalltext: picture.smalltext,
                        _id: _.first((picture.thumbnail).match(/([^\/]+)(?=\.\w+$)/)),
                    }]
                })
                cacheForce[picture.thumbnail] = true
                return
            } catch (error) {
                console.error(error.toJSON ? error.toJSON() : error)
                throw error
            }
        }
    }
}
