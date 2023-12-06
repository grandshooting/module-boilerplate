const _ = require('lodash')
const { cleanWebhooks } = require("../jobs/activation.job")
const Mongo = require("../services/mongo.service")
require('../configs/index.config')
require('../loaders/mongoose.loader')()

let account_id
const mongo = new Mongo()

_.forEach(process.argv, (argv, argc) => {
	if (argv === '-a') {
		account_id = parseInt(process.argv[argc + 1])
	}
})

if (!account_id) {
	console.error('account_id obligatoire')
	console.log('Usage: node activation -a <account_id>')
	return
}
console.log("static config:", require('../configs/account.config')(account_id))
mongo.getConfigurationForAccount(account_id)
.then(console.log)
.then(() => {
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})