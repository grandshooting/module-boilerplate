const { QueueService } = require("./services/queue.service")
const loaders = require('./loaders/index.loader')
const { processJob } = require('./jobs/process.job')

require('./configs/index.config')
require('console-stamp')( console )
try {
	require('fantomas/log')
} catch (err) {
	console.warn('Cannot load fantomas log')
}

async function startServer() {	
	await loaders()
	const queueProcess = new QueueService("process", processJob)

	queueProcess.start(5000, 100)
}
	
startServer()