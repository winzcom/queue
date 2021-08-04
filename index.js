const { Worker, isMainThread } = require('worker_threads');

require('dotenv').config({
    path: `${process.cwd()}/.env`
})

const Queue = require('./core/index');

const testQueue = new Queue('testqueue');

if(isMainThread) {

    const func = function(val) {
        return {
            mytrue: val
        }
    }

    // setTimeout(() => {
    //     testQueue.addProcessName(func, 'owa')
    //     testQueue.addData({
    //         name: 'cone'
    //     }, {}, 'owa')
    // }, 2000);

    // setTimeout(() => {
    //     testQueue.addData({
    //         name: 'come home sammy'
    //     })
    // }, 5000);

    setTimeout(() => {
        testQueue.addProcessName(func, 'owa')
        testQueue.addData({
            name: 'mortal kombat'
        }, {
            delay: 10
        }, 'owa')
        //testQueue.manager.killAll()
    }, 1000);
}