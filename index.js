const fs = require('fs-extra')
const kill = require('tree-kill')
const archy = require('archy')
const request = require('request-promise')

const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')
const errorUtil = require('./error-util')

const messages = require('./messages')

process.on('SIGINT', () => {
    console.log('\nKILLING...')
    kill(process.pid)
})

fs.emptyDirSync(pathUtil.data)
fs.emptyDirSync(pathUtil.downloads)

const newNode = (label = '') => ({label, nodes: []})
const addChild = (node, child) => node.nodes.push(child)

global.urlsTodo = {}
global.tree = newNode()
global.xhrs = []

const saveType = 'HTMLComplete'
const hrefRegex = /href="(\s*)([^"\s]*)(\s*)"/ig

const nightmareConfig = {
    show: false, // DO NOT SET THIS TO TRUE!!!
    paths: {
        userData: pathUtil.downloads
    },
    ignoreDownloads: true, // TODO: download stuff...
}
const didGetResponseDetails = 'did-get-response-details'
const didGetResponseDetailsEventHandler = (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
    if (urlUtil.shouldDownload(resourceType, requestMethod, originalUrl)) {
        //logUtil.log(resourceType, originalUrl)
        global.urlsTodo['DOWNLOAD ' + originalUrl] = messages.pending
        global.urlsTodo['DOWNLOAD ' + originalUrl] = request({uri: originalUrl, headers})
            .then((data) => fs.outputFile(pathUtil.getFilePath(originalUrl), data))
            .catch(() => logUtil.fail(resourceType, originalUrl))
            .then(() => {
                global.xhrs.push(originalUrl)

            })
    }
}

const evaluate = () => ({html: document.body.outerHTML, pathname: document.location.pathname});
const openSite = (url, retryTimes = 0, node) => Nightmare(nightmareConfig)
    .downloadManager()
    .on(didGetResponseDetails, didGetResponseDetailsEventHandler)
    .goto(url)
    .html(pathUtil.getFilePath(url), saveType)
    .evaluate(evaluate)
    .end()
    .then(({html, pathname}) => {
        let href = hrefRegex.exec(html)
        while (href !== null) {
            const hrefFixed = urlUtil.fix(href[2], pathname)
            if (urlUtil.shouldVisitFixed(hrefFixed)) {
                openSiteAndSet(hrefFixed, retryTimes, messages.pending, node)
            }
            href = hrefRegex.exec(html)
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

openSiteAndSet(urlUtil.startUrl, 0, messages.pending, global.tree)

process.on('exit', () => {
    console.log(archy(global.tree.nodes[0]))
    console.log('\n\n')
    console.log(global.xhrs)
})