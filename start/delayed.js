const redisService = require('../service/redis');

const { parentPort } = require('worker_threads')

const delay_key = 'delayed_queue';

function sender(val) {
    typeof (val == 'string' || typeof val == 'object') && process.send(val, null, {
        keepOpen: true,
    })
}

function delay() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res()
        }, 100);
    })
}

function addToSet() {
    return new Promise((res, rej) => {
        process.on('message', (m) => {
            const parsed = JSON.parse(m)
            console.log({ delayed: parsed })
            redisService.zadd(delay_key, [parsed.time, JSON.stringify(parsed)]).then(love => console.log({ love }))
            res()
        })
    })
}

function peeker() {
   return redisService.peekElement(delay_key)
}

function currentTimeStamp() {
    return (new Date()).getTime()
}

(async function() {
    const delayer = delay();
    const aset = addToSet();

    while(true) {
        await Promise.race([
            aset, delayer
        ])
        const val = await peeker();
        if(val && val.length > 0) {
            const timestamp = val[1];
            const current_time = currentTimeStamp()
            if(parseFloat(timestamp) <= current_time) {
                // add it to the list
                sender(val[0]);
                //remove from the set
                await redisService.removemin(delay_key)
            }
        }
    }
}())