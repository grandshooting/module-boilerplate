const _ = require('lodash')
const { activation } = require("../jobs/activation.job")
require('../configs/index.config')
require('../loaders/mongoose.loader')()

let account_id

_.forEach(process.argv, (argv, argc) => {
	if (argv === '-a') {
		account_id = parseInt(process.argv[argc + 1])
	}
})

if (!account_id) {
	console.error('account_id obligatoire')
	console.log('Usage: node activation -a <account_id>')
} else {
	activation(account_id).then(() => {
		process.exit(0)
	}).catch(error => {
		console.error(error)
		process.exit(1)
	})
}