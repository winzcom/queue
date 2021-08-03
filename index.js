const { Worker, isMainThread } = require('worker_threads');

const Queue = require('./core/index');

const testQueue = new Queue('testqueue');

if(isMainThread) {


    setTimeout(() => {
        testQueue.addProcessName(function(val) {
            console.log({ val })
        })
        testQueue.addData({
            name: 'cone'
        })
    }, 2000);

    setTimeout(() => {
        testQueue.addData({
            name: 'come home sammy'
        })
    }, 5000);
}