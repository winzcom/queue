const { fork } = require('child_process');
const { Worker } = require('worker_threads')
const EventEmitter = require('events');
const { lpush, rpush } = require('../service/redis');

const redis = require("../service/redis");

class Manager extends EventEmitter {
    static instance;
    static queueNames = [];
    static queues = new Map();

    static child_process;
    static delay_child;

    constructor(queue_instance) {
        if(Manager.instance) {
            Manager.queues.set(queue_instance.name, queue_instance);
            Manager.queueNames.push(queue_instance.name)
            return this;
        }
        super()
        Manager.instance = this;
        Manager.queueNames.push(queue_instance.name)
        Manager.queues.set(queue_instance.name, queue_instance)
        this.initiateProcess();
        this.initiateDelay();
        Manager.exitHandler();
    }

    static exitHandler() {
        process.on('SIGINT', () => {
            console.log(Manager.child_process.kill())
            console.log(Manager.delay_child.kill())
            process.exit(0)
        })

        process.on('exit', () => {
            console.log(Manager.child_process.kill())
            console.log(Manager.delay_child.kill())
        })
    }

    static delayHandler(val) {
        try {
            val = JSON.parse(val)
            const { data, queue: qname } = val
            const queue = Manager.queues.get(qname);
            const wrapped = Manager.wrapToPromise(queue.process, queue);
            wrapped(data).then((my_val) => console.log({ my_val })).catch(console.log);
        } finally {
            return val;
        }
    }

    static wrapToPromise(func, context = this) {
        return function () {
            return new Promise((res, rej) => {
                try {
                    const result = func.call(context, ...arguments)
                    if(result instanceof Promise) {
                        return result.then(v => res(v), e => rej(e))
                    }
                    res(result)
                } catch (error) {
                    rej(error)
                }
            })
        }
    }

    handler(data) {

        const parsed = JSON.parse(data)

        let count = options.count || 1;
        const { value: d, options } = parsed

        const queue_name = value[0].split('_')[1];

        const queue_obj = Manager.queues.get(queue_name);
        const wrapped = Manager.wrapToPromise(queue_obj.process, queue_obj);
        wrapped(d).catch(err => {
            options.count = ++count
            // push back to the list
            rpush(queue_name, d);
        })
    }

    push(queue_name, data) {
        redis.lpush(queue_name, data);
    }

    killChild() {
        Manager.child_process.kill()
    }

    killAll() {
        Manager.child_process.kill()
        Manager.delay_child.kill();
    }

    initiateProcess() {
        Manager.child_process = fork(`${process.cwd()}/start/worker.js`)
        Manager.child_process.on('message', this.handler)
    }

    initiateDelay() {
        Manager.delay_child = fork(`${process.cwd()}/start/delayed.js`);
        Manager.delay_child.on('message', Manager.delayHandler)
    }

    addToList(name, options = {}) {
        Manager.child_process.send(name, null, {
            keepOpen: true,
        })
    }

    addData(data, options) {
        const { delay, name } = options
        if(delay && delay > 1) {
            const date = new Date()
            let time = date.getSeconds()
            date.setSeconds(time + delay);
            Manager.delay_child.send(JSON.stringify({
                    time: date.getTime(), data: { ...data, },
                    queue: name
                })
            )
            return
        }
        lpush(name, JSON.stringify(data))
    }

    getQueues() {
        return Manager.queues;
    }

    getQueuesNames() {
        return Manager.queueNames;
    }
}

module.exports = Manager;