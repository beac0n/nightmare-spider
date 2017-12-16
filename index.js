#!/usr/bin/env node

const kill = require('tree-kill')
const fs = require('fs-extra')
const request = require('request')
const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const {maxConnections = 10} = require(process.argv[2])

const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')
const errorUtil = require('./error-util')

const messages = require('./messages')

const PromisePoolWrapper = require('./promise-pool-wrapper')
const wrapper = PromisePoolWrapper.create(maxConnections)

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
            logUtil.doneDownload(url)
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

const hrefRegex = /href="(\s*)([^"\s]*)(\s*)"/ig

const getParseRegexPromise = (regex, html, retryTimes, pathname) => new Promise((resolve, reject) => {
    const href = regex.exec(html)
    if (href !== null) {
        const hrefFixed = urlUtil.fix(href[2], pathname)
        if (urlUtil.shouldVisitFixed(hrefFixed)) {
            openSiteAndSet(hrefFixed, retryTimes, messages.pending)
        }
        resolve(regex)
    } else {
        reject(messages.done)
    }
}).then((newRegex) => getParseRegexPromise(newRegex, html, retryTimes, pathname))

const isKilled = () => global.killed

const openSite = (url, retryTimes = 0) => !isKilled() && wrapper(() => Nightmare(nightmareOptions)
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
    .then(({html, pathname}) => getParseRegexPromise(hrefRegex, html, retryTimes, pathname).catch((reason) => {
        if (reason !== messages.done) {
            logUtil.log(reason)
        }
    }))
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
            downloadFile(error.url, pathUtil.getDownloadPath(error.url))
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
    global.killed = true
    logUtil.log('killing in 5 seconds...', process.pid)
    setInterval(() => {
        logUtil.log('killing now...')
        kill(process.pid)
    }, 5000)
})

pathUtil.prepare()

openSiteAndSet(urlUtil.startUrl, 0, messages.pending)
