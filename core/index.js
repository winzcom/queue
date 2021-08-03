const redis = require('../service/redis');
const Manager = require('./manager')

class Queue {
    constructor(name) {
        this.name = name;
        this.manager = new Manager(this)
        // if(this.manager.getQueuesNames().includes(name)) {
        //     throw Error(`A Queue with this name already exists`)
        // }
        this.mapper = new Map();
        this.process_mapper = new Map();
        this.manager.addToList(name)
    }

    addProcessName(func, process_name = '*') {
        if(!func) {
            throw new Error('Please provide a function to run')
        }
        const finder = this.mapper.get(process_name);

        if(finder) {
            throw new Error('cannot add a process with a name that already exists');
        }
        this.mapper.set(process_name, func);
    }

    addData(data, process_name = '*') {
        // add to the queue
        data.process  = process_name;
        redis.lpush(this.name, JSON.stringify(data))
    }

    process(data) {
        data = JSON.parse(data);
        const { process } = data;
        const func = this.mapper.get(process)

        if(func) {
            func({ ...data, })
        }
    }

    get nameQ() {
        return this.constructor.name.toLocaleLowerCase();
    }
}

module.exports = Queue