const fs = require('fs-extra')
const kill = require('tree-kill')

const nightmareUtil = require('./nightmare-util')
const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')
const parserUtil = require('./parser-util')
const errorUtil = require('./error-util')

const messages = require('./messages')

fs.emptyDirSync(pathUtil.data)
fs.emptyDirSync(pathUtil.downloads)

global.urlsTodo = {}
const saveType = 'HTMLComplete'

const openSite = (url, retryTimes = 0) => nightmareUtil.create()
    .goto(url)
    .html(pathUtil.getFilePath(url), saveType)
    .evaluate(() => ({html: document.body.outerHTML, pathname: document.location.pathname}))
    .end()
    .then(parserUtil.getUrls)
    .then((urls) => {
        const urlLength = urls.length
        for (let i = 0; i < urlLength; ++i) {
            const url = urls[i]
            if (urlUtil.shouldVisit(url)) {
                openSiteAndSet(url, retryTimes, messages.pending)
            }
        }
    })
    .then(() => messages.done)
    .catch((error) => {
        if (errorUtil.isTimeout(error)) {
            return openSiteAndSet(url, retryTimes + 1, messages.retry)
        }
        else if (errorUtil.isAborted(error)) {
            logUtil.fail(url, error)
        } else {
            return JSON.stringify(error)
        }
    })


const openSiteAndSet = (url, retryTimes, preMessage) => {
    logUtil.log(preMessage, url)

    if (preMessage) {
        global.urlsTodo[url] = preMessage
    }

    global.urlsTodo[url] = openSite(url, retryTimes)
}

openSiteAndSet(urlUtil.startUrl, 0, messages.pending)
