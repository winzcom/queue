const { fork } = require('child_process');
const EventEmitter = require('events');

const redis = require("../service/redis");

class Manager extends EventEmitter {
    static instance;
    static queueNames = [];
    static queues = new Map();

    static child_process;

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
        Manager.child_process.on('message', this.handler)
    }

    handler(data) {

        const parsed = JSON.parse(data)


        const { value } = parsed

        const queue_name = value[0].split('_')[1];

        const queue_obj = Manager.queues.get(queue_name);

        queue_obj.process(value[1]);
    }

    push(queue_name, data) {
        redis.lpush(queue_name, data);
    }

    initiateProcess() {
        Manager.child_process = fork(`${process.cwd()}/start/worker.js`)
    }

    addToList(name) {
        Manager.child_process.send(name)
    }

    getQueues() {
        return Manager.queues;
    }

    getQueuesNames() {
        return Manager.queueNames;
    }
}

module.exports = Manager;