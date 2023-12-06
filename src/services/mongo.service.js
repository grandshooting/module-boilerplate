const ConfigurationModel = require("../models/configuration.model")

module.exports = class Mongo {
    constructor()  {
    }

	getConfigurationForAccount = async (account_id) => {
        const config = await ConfigurationModel.findOne({ account_id: account_id })

        return config
	}
    saveConfiguration = async (_config) => {
        const config = await ConfigurationModel.findOneAndUpdate({ account_id: _config.account_id }, _config, { new: true, upsert: true })

        return config
	}
    deleteConfiguration = async (account_id) => {
        await ConfigurationModel.deleteMany({ account_id: account_id })

        return
	}
}