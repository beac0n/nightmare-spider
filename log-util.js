const messages = require('./messages')

const log = (...args) => console.log(args.join('\t'));
module.exports = {
    done: (...args) => log(messages.done, ...args),
    log,
    kill: () => console.log('\nKILLING', process.pid),
}