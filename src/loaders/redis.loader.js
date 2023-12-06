const Promise = require("bluebird")
const redis = require("redis")
const redisv2 = require("redis-v2")

module.exports = async () => {
    const client = redis.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD
    })
    client.on('error', (err) => console.log('Redis Client Error', err))

    await client.connect()

    const clientv2 = redisv2.createClient({
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD
    })

    clientv2.on('error', (err) => console.log('Redis Client Error', err))

    return { client, clientv2 }
}