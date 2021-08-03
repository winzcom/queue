const RedisIO = require('ioredis');
const { promisify } = require('util')

const NAMESPACE = 'TEST';

function Redis () {
    const dbPass = {
        db: 4
    }
    const config = {
        host: process.env.REDISHOST,
        port: process.env.REDISHOST,
        db: 4,
    }
    if(!process.env.EBUN_SET) {
        config.password = process.env.REDISPASS;
        dbPass.password = process.env.REDISPASS
    }
    //const client = redis.createClient(config);
    const client = new RedisIO(process.env.REDISPORT, process.env.REDISHOST, dbPass);
    const commands = {
        lpush: client.lpush,
        rpush: client.rpush,
        blpop: client.blpop,
        lrange: client.lrange,
        brpop: client.brpop,
        zadd: client.zadd,
        brpoplpush: client.brpoplpush,
    }

    let redisReady = false, redisConnectionError = false

    client.on('ready', () => {
        if(process.env.NODE_ENV == 'development') {
            client.flushdb();
        }
        redisReady = true
        redisConnectionError = false
    })

    client.on('error', () => {
        redisReady = false,
        redisConnectionError = true
    })

    const isRedisReady = async () => {
        let d;
        if(redisReady) {
            return redisReady;
        }
        return new Promise(res => {
            d = setInterval(() => {
                if(redisReady) {
                    clearInterval(d);
                    res(redisReady);
                }
            }, 100);
        })
    }

    function runCommand(cmd) {
        cmd = promisify(cmd).bind(client)
        return async function() {
            await isRedisReady();
            arguments[0] = `${NAMESPACE}_${arguments[0]}`
            return cmd(...arguments).then(v => {
                return v
            }, err => err)
        }
    }

    return {
        lpush: runCommand(commands.lpush),
        rpush: runCommand(commands.rpush),
        blpop: runCommand(commands.blpop),
        brpop: runCommand(commands.brpop),
        lrange: runCommand(commands.lrange),
        zadd: runCommand(commands.zadd),
        brpoplpush: runCommand(commands.brpoplpush),
    }
}

module.exports = Redis();