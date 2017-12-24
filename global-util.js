const kill = require('tree-kill')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')

const {maxConnections = 10} = require(process.argv[2])

pathUtil.prepare()

global.killed = false
global.urlsTodo = {}
global.writeToDiskPromise = Promise.resolve()

process.on('SIGINT', () => {
    global.killed = true
    logUtil.log('killing in 5 seconds...', process.pid)
    setInterval(() => {
        logUtil.log('killing now...')
        kill(process.pid)
    }, 5000)
})

const isKilled = () => global.killed

module.exports = {
    isKilled,
    maxConnections,
}