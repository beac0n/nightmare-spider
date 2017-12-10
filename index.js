const kill = require('tree-kill')


const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const nightmareUtil = require('./nightmare-util')
const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')
const errorUtil = require('./error-util')

const messages = require('./messages')

const openSite = (url, retryTimes = 0, node) => Nightmare(nightmareUtil.nightmareConfig)
    .downloadManager()
    .on(nightmareUtil.DID_GET_RESPONSE_DETAILS, nightmareUtil.didGetResponseDetailsEventHandler)
    .goto(url)
    .html(pathUtil.getFilePath(url), nightmareUtil.saveType)
    .evaluate(nightmareUtil.evaluate)
    .end()
    .then(({html, pathname}) => {
        let href = nightmareUtil.hrefRegex.exec(html)
        while (href !== null) {
            const hrefFixed = urlUtil.fix(href[2], pathname)
            if (urlUtil.shouldVisitFixed(hrefFixed)) {
                openSiteAndSet(hrefFixed, retryTimes, messages.pending, node)
            }
            href = nightmareUtil.hrefRegex.exec(html)
        }
    })
    .then(() => messages.done)
    .catch((error) => {
        if (errorUtil.isTimeout(error)) {
            return openSiteAndSet(url, retryTimes + 1, messages.retry, node)
        }
        else if (errorUtil.isAborted(error)) {
            logUtil.fail(url, error)
        } else {
            return JSON.stringify(error)
        }
    })


const openSiteAndSet = (url, retryTimes, preMessage, parentNode) => {
    logUtil.log(preMessage, url)

    if (preMessage) {
        global.urlsTodo[url] = preMessage
    }

    const node = newNode(url)
    addChild(parentNode, node)

    global.urlsTodo[url] = openSite(url, retryTimes, node)
}

const newNode = (label = '') => ({label, nodes: []})
const addChild = (node, child) => node.nodes.push(child)

global.urlsTodo = {}
global.tree = newNode()
global.xhrs = []



process.on('exit', () => {
    logUtil.infoOnce()
})

process.on('SIGINT', () => {
    logUtil.infoOnce()
    logUtil.kill()
    kill(process.pid)
})


pathUtil.prepare()

openSiteAndSet(urlUtil.startUrl, 0, messages.pending, global.tree)
