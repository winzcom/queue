const redisService = require('../service/redis');

const delay_key = 'delayed_queue';

process.on('message', (m) => {
    const parsed = JSON.parse(m)
    redisService.zadd(delay_key, [parsed.delay, parsed.value]).then(love => console.log({ love }))
})