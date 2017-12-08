const leftPad = require('./left-pad')

let counter = 0
module.exports = {
    log: (...args) => console.log(`${leftPad(counter++, 4, 0)}:\t${args.join('\t')}`),
    fail: (...args) => console.log('FAIL:', ...args),
}