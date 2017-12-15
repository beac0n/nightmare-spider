const messages = require('./messages')

const log = (...args) => console.log(args.join('\t'));
module.exports = {
    done: (...args) => log(messages.done, '', ...args),
    doneDownload: (...args) => log(messages.done + ' ' + messages.download, ...args),
    log,
}