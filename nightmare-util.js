const fs = require('fs-extra')
const request = require('request-promise')

const urlUtil = require('./url-util.js')
const logUtil = require('./log-util.js')
const pathUtil = require('./path-util.js')

const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

module.exports = {
    create: () => Nightmare(
        {
            show: false, // DO NOT SET THIS TO TRUE!!!
            paths: {
                userData: pathUtil.downloads
            },
            // ignoreDownloads: true, // TODO: download stuff...
        })
        .downloadManager()
        .on('did-get-response-details',
            (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
                if (urlUtil.shouldDownloadUrl(resourceType, requestMethod, originalUrl)) {
                    request({uri: originalUrl, headers})
                        .then((json) => fs.outputFile(pathUtil.getFilePath(originalUrl), json))
                        .catch(() => logUtil.fail(originalUrl, 'XHR'))
                }
            })

}