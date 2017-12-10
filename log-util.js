const archy = require('archy')
const leftPad = require('./left-pad')

let infoWasLogged = false

let counter = 0
module.exports = {
    log: (...args) => console.log(`${leftPad(counter++, 4, 0)}: ${args.join('\t')}`),
    fail: (...args) => console.log('FAIL:', ...args),
    infoOnce: () => {
        if(infoWasLogged) {
            return
        }

        console.log('\n\nURL TREE:')
        console.log(archy(global.tree.nodes[0]))
        console.log('SAVED XHRs:')
        console.log(global.xhrs)
        infoWasLogged = true
    },
    kill: () => {
        console.log('\nKILLING', process.pid)
    }
}