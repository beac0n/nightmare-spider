const fs = require('fs-extra')
const request = require('request-promise')

const urlUtil = require('./url-util.js')
const logUtil = require('./log-util.js')
const pathUtil = require('./path-util.js')
const messages = require('./messages')


module.exports = {
    nightmareConfig: {
        show: false, // DO NOT SET THIS TO TRUE!!!
        paths: {
            userData: pathUtil.downloads
        },
        ignoreDownloads: true, // TODO: download stuff...
    },
    didGetResponseDetails: 'did-get-response-details',
    didGetResponseDetailsEventHandler: (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
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
}