const redisService = require('../service/redis');


const queues = new Set()

function it_is(value) {
   process.send(JSON.stringify({
       new_val: true,
       value
   }), (error) => {
       console.log({ error })
   })
}

async function delay() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res()
        }, 100);
    })
}

async function getQueues() {
    return new Promise((res, rej) => {
        process.on('message', (m) => {
            queues.add(m)
            res(m)
        })
    })
}

(async function() {
    const keep_using = getQueues();
    const delayer = delay();
    while(true) {
        await Promise.race([ 
            keep_using,
            delayer,
        ])
        for(let name of queues) {
            const val = await redisService.blpop(name, 2)
            if(val) {
                it_is(val)
            }
        }
    }
}())