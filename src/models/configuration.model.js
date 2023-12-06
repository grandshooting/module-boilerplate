const { Schema, model } = require('mongoose')

const ConfigurationSchema = new Schema({
    account_id: {
        type: Number,
        required: true
    },
    api: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    // En cas d'utilisation des webhooks
    // webhooks: {
    //     type: Object
    // }
}, { timestamps: true })

module.exports = model('Configuration', ConfigurationSchema)

