const kill = require('tree-kill')
const fs = require('fs-extra')
const request = require('request')
const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')
const errorUtil = require('./error-util')

const messages = require('./messages')

const PromisePoolWrapper = require('./promise-pool-wrapper')
const wrapper = PromisePoolWrapper.create(10)

const downloadFile = (url, filePath, headers) => {
    if (global.killed) {
        return
    }

    const urlDownloadKey = urlUtil.getUrlDownloadKey(url)
    global.urlsTodo[urlDownloadKey] = messages.pending
    global.writeToDiskPromise = global.writeToDiskPromise
        .then(() => new Promise((resolve, reject) => {
            request({uri: url, headers})
                .pipe(fs.createWriteStream(filePath))
                .on('finish', resolve)
                .on('error', reject)
        }))
        .then(() => {
            logUtil.done(url)
            global.urlsTodo[urlDownloadKey] = messages.done
            return messages.done
        })
        .catch((reason) => {
            global.urlsTodo[urlDownloadKey] = reason
            return reason
        })
}
const nightmareOptions = {
    show: false, // DO NOT SET THIS TO TRUE!!!
    paths: {
        userData: pathUtil.downloads
    }
}

const getHrefRegex = () => /href="(\s*)([^"\s]*)(\s*)"/ig

const parseHtml = (regex, html, pathname, retryTimes) => {
    const href = regex.exec(html)
    if (href !== null) {
        const hrefFixed = urlUtil.fix(href[2], pathname)
        if (urlUtil.shouldVisitFixed(hrefFixed)) {
            openSiteAndSet(hrefFixed, retryTimes, messages.pending)
        }
        parseHtml(regex, html, pathname, retryTimes)
    }
}

const openSite = (url, retryTimes = 0) => global.killed
    ? 'killed'
    : wrapper(() => Nightmare(nightmareOptions)
        .downloadManager()
        .on('did-get-response-details', (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
            if (urlUtil.shouldDownloadXhr(resourceType, requestMethod, originalUrl)) {
                downloadFile(originalUrl, pathUtil.getFilePath(originalUrl), headers)
            }
        })
        .on('download', (state, downloadItem) => {
            if (state === 'started' && urlUtil.shouldDownload(downloadItem.url)) {
                downloadFile(downloadItem.url, pathUtil.getDownloadPath(downloadItem.filename))
            }
        })
        .goto(url)
        .html(pathUtil.getFilePath(url), 'HTMLComplete')
        .evaluate(() => ({html: document.body.outerHTML, pathname: document.location.pathname}))
        .end()
        .then(({html, pathname}) => {
            const hrefRegex = getHrefRegex()

            let href = hrefRegex.exec(html)
            while (href !== null) {
                const hrefFixed = urlUtil.fix(href[2], pathname)
                if (urlUtil.shouldVisitFixed(hrefFixed)) {
                    openSiteAndSet(hrefFixed, retryTimes, messages.pending)
                }
                href = hrefRegex.exec(html)
            }
        })
        .then(() => {
            logUtil.done(url)
            return messages.done
        })
        .catch((error) => {
            if (errorUtil.isTimeout(error)) {
                global.urlsTodo[url] = messages.retry
                return openSite(url, retryTimes + 1)
            }
            else if (errorUtil.isNavigationError(error) && urlUtil.shouldDownload(error.url)) {
                const urlArray = error.url.split('/')
                const fileName = urlArray[urlArray.length - 1]

                downloadFile(error.url, pathUtil.getDownloadPath(fileName))
            }
            else {
                throw error
            }
        }))

const openSiteAndSet = (url, retryTimes, preMessage = messages.pending) => {
    global.urlsTodo[url] = preMessage
    global.urlsTodo[url] = openSite(url, retryTimes)
}

global.killed = false
global.urlsTodo = {}
global.writeToDiskPromise = Promise.resolve()

process.on('SIGINT', () => {
    logUtil.kill()
    global.killed = true
    kill(process.pid)
})

pathUtil.prepare()

openSiteAndSet(urlUtil.startUrl, 0, messages.pending)
