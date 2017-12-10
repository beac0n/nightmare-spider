const INTERVAL_TIME = 100

let currentConcurrentPromises = 0

const isPoolFull = (maxConcurrentPromises) => currentConcurrentPromises >= maxConcurrentPromises
const reduceCounterCallback = (valueOrReason) => {
    currentConcurrentPromises--
    return valueOrReason
}
const reduceCounter = (promise) => promise.then(reduceCounterCallback, reduceCounterCallback)

const wrap = (promiseCreator, maxConcurrentPromises) => {
    if (!promiseCreator) {
        return Promise.resolve()
    }

    if (!isPoolFull(maxConcurrentPromises)) {
        currentConcurrentPromises++
        return reduceCounter(promiseCreator())
    }

    return new Promise((resolve) => {
        const intervalId = setInterval(() => {
            if (!isPoolFull(maxConcurrentPromises)) {
                currentConcurrentPromises++
                resolve(reduceCounter(promiseCreator()))
                clearInterval(intervalId)
            }
        }, INTERVAL_TIME)
    })
};

module.exports = {
    create: (concurrentPromises) => (promiseCreator) => wrap(promiseCreator, concurrentPromises)
}