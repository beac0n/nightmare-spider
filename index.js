#!/usr/bin/env node

const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const globalUtil = require('./global-util')
const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const pathUtil = require('./path-util')
const errorUtil = require('./error-util')
const downloadUtil = require('./download-util')

const messages = require('./messages')

const PromisePoolWrapper = require('./promise-pool-wrapper')
const wrapper = PromisePoolWrapper.create(globalUtil.maxConnections)

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

const openSite = (url, retryTimes = 0) => !globalUtil.isKilled() && wrapper(() => Nightmare(nightmareOptions)
    .downloadManager()
    .on('did-get-response-details', (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
        if (urlUtil.shouldDownloadXhr(resourceType, requestMethod, originalUrl)) {
            downloadUtil.downloadFile(originalUrl, pathUtil.getFilePath(originalUrl), headers)
        }
    })
    .on('download', (state, downloadItem) => {
        if (state === 'started' && urlUtil.shouldDownload(downloadItem.url)) {
            downloadUtil.downloadFile(downloadItem.url, pathUtil.getDownloadPath(downloadItem.filename))
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
            downloadUtil.downloadFile(error.url, pathUtil.getDownloadPath(error.url))
        }
        else {
            throw error
        }
    }))

const openSiteAndSet = (url, retryTimes, preMessage = messages.pending) => {
    global.urlsTodo[url] = preMessage
    global.urlsTodo[url] = openSite(url, retryTimes)
}

openSiteAndSet(urlUtil.startUrl, 0, messages.pending)
