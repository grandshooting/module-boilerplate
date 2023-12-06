const mongooseLoader = require('./mongoose.loader')
const redisLoader = require('./redis.loader')
const expressLoader = require('./express.loader')
const { setRedis: setRedisQueue } = require('../services/queue.service')
const initEndpoints = require('../endpoints/index.endpoint')

module.exports = async () => {
    console.log('Initialization start')

    await mongooseLoader()
    console.log('✅ MongoDB Initialized')

    const { client, clientv2 } = await redisLoader()
    console.log('✅ Queue Initialized')

    setRedisQueue(client, clientv2)
    console.log('✅ Services Initialized')

    const app = await expressLoader()
    initEndpoints(app)
    console.log('✅ Express Initialized')

    console.log('Initialization ended')

    return {}
}