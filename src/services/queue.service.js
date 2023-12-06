const Promise = require("bluebird")
const Queue = require('bee-queue')
const pjson = require('../../package.json');

let _redisClient = null
let _redisClientv2 = null

function setRedis(redisClient, redisClientv2){
    _redisClient = redisClient
    _redisClientv2 = redisClientv2
}

class BeeQueueService {
    constructor () {
        if (QueueService._instance) {
            return QueueService._instance
        }
        this.queueList = {}
        QueueService._instance = this
    }
    exist (name) {
        return !!this.queueList[name]
    }
    create (name, handler, concurrency = 1, timeout = 1000*60*15, delay = 0, retries = 1) {
        const queue = new Queue(name, {
            removeOnSuccess: true,
            removeOnFailure: true,
            redis: _redisClientv2
        })
        const config = {
            timeout,
            delay,
            retries
        }

        console.log('Create queue ' + name + ' with config ', config)
    
        queue.process(concurrency, async function(job, done) {
            console.log(`Queue ${name}: Processing job ${job.id}`);
            return await handler(job.data, done)
        })
        queue.checkStalledJobs(5000, (err, numStalled) => {
            if (numStalled > 0) {
                console.log(`Queue ${name}: Detected ${numStalled} stalled jobs`)
            }
        })
        queue.on('retrying', (job, err) => {
            console.log(`Queue ${name}: Job ${job.id} failed with error ${err.message} but is being retried!`)
        })
        queue.on('succeeded', (job, result) => {
            console.log(`Queue ${name}: Job ${job.id} succeeded with result: ${result}`)
        })
        queue.on('error', (err) => {
            console.error(`Queue ${name}: A queue error happened: ${err.message}`)
        })
        queue.on('failed', (job, err) => {
            console.error(`Queue ${name}: Job ${job.id} failed with error ${err.message}`)
        })
        queue.on('stalled', (jobId) => {
            console.log(`Queue ${name}: Job ${jobId} stalled and will be reprocessed`)
        })

        this.queueList[name] = {
            config,
            queue
        }
    }
    async add (name, data) {
        if (this.queueList[name]) {
            const { queue, config } = this.queueList[name]
            await queue.createJob(data)
            .retries(config.retries)
            .timeout(config.timeout)
            .save()
        } else {
            throw new Error("La queue n'existe pas")
        }
    }
}
class QueueService {
    constructor(channel, jobHandler) {
        this.channel = pjson.name + "_" + channel
        this.promise = Promise.resolve()
        this.go = false
        this.beeQueue = new BeeQueueService()
        if (!this.beeQueue.exist(this.channel)) {
            this.beeQueue.create(this.channel, jobHandler)
        }
    }
    handler = async (delay) => {
        const get = async (datas = []) => {
            const data = await _redisClient.RPOP(this.channel)
            
            if (data) {
                datas.push(JSON.parse(data))
                return get(datas)
            }
            return datas
        }
        const datas = await get()
        
        if(datas.length > 0) {
            console.log("Writing to bee-queue <= trigger jobHandler with", datas.length, this.channel, JSON.stringify(datas, null, 1))
            this.beeQueue.add(this.channel, datas)
        }
        await Promise.delay(delay)
        if (this.go) {
            return this.handler(delay)
        } else {
            return
        }
    }
    start = (interval, delay = 0) => {
        if (this.go) {
            console.error("This QueueService is already started")
        } else {
            this.go = true
            setTimeout(() => this.handler(interval), delay)
        }
    }
    stop = () => {
        this.go = false
    }
    add = (data) => {
        return _redisClient.RPUSH(this.channel, JSON.stringify(data))
    }
}

module.exports = {
    setRedis,
    QueueService
}