const _ = require("lodash")
const Promise = require('bluebird')
const APIGS = require("../services/api-gs.service")
const Mongo = require('../services/mongo.service')

const process = async (pictures) => {
    const mongo = new Mongo()
    const servicesAPIGS = {}
    const configs = {}

    pictures = _.uniqBy(pictures, picture => picture.account_id + "%%" + picture.picture_id)

    await Promise.map(pictures, async picture => {
        try {
            const account_id = picture.account_id
            configs[account_id] = configs[account_id] ? configs[account_id] : await mongo.getConfigurationForAccount(account_id)
            const config = configs[account_id]
            
            servicesAPIGS[account_id] = servicesAPIGS[account_id] || new APIGS(config.token, account_id, config.api)
            const apiGS = servicesAPIGS[account_id]

            let tag = picture.taginfo
            if (!tag) {
                tag = await apiGS.getTag(picture.picture_id)
            }
            if (!tag.tags['PROCESSED']) {
                //do some stuff

                await apiGS.setTag(picture.picture_id, { tags: { 'PROCESSED': true }})
                console.log('Processed picture', picture)
            }
        } catch (error) {
            console.error(error)
        }
    }, { concurrency: 10 })
}

module.exports = {
    processJob: process
}