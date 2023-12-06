const Mongo = require('../services/mongo.service')
require('../configs/index.config')
require('../loaders/mongoose.loader')()

const _config = {
    token: 'test',
    account_id: -1,
    api: "https://api-19.grand-shooting.com/v3"
}

const run = async () => {
    const mongo = new Mongo()
    let config =  await mongo.getConfigurationForAccount(2)
    console.log('config', config)
    config =  await mongo.saveConfiguration(_config)
    console.log('config', config)
    config =  await mongo.getConfigurationForAccount(2)
    console.log('config', config)
    await mongo.deleteConfiguration(2)
    config =  await mongo.getConfigurationForAccount(2)
    console.log('config', config)
}

run()