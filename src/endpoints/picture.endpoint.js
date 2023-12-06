const _ = require("lodash")
const { QueueService } = require("../services/queue.service")
const Mongo = require('../services/mongo.service')
const APIGS = require("../services/api-gs.service")
const Promise = require('bluebird')

const manage = async (body) => {
    const mongo = new Mongo()
    const config = await mongo.getConfigurationForAccount(body.account_id)
    const queueProcess = new QueueService("process")

    if (!config) {
        return
    }

    if (!body.data) {
        const api = new APIGS(config.token, body.account_id, config.api)
        const pictures = await api.getPictures({ picture_id: [].concat(body.picture_id) })
        body.data = _.keyBy(pictures, 'picture_id')
    }

    await Promise.mapSeries(_.toArray(body.data), async picture => {
        picture.account_id = body.account_id

        await queueProcess.add(picture)
        console.log('Add picture to process', picture)
    })
}

module.exports = {
    manage: manage,
    endpoints: (expressApp) => {
        expressApp.post('/picture', async (req, res) => {
            try {
                const body = req.body

                await manage(body)

                res.status(200).end()
            } catch (error) {
                console.error('Endpoint error', error, req)
                res.status(500).end()
            }
        })
    }
}
