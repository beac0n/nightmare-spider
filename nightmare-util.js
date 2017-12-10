const fs = require('fs-extra')
const request = require('request-promise')

const urlUtil = require('./url-util.js')
const pathUtil = require('./path-util.js')
const messages = require('./messages')


module.exports = {
    hrefRegex: /href="(\s*)([^"\s]*)(\s*)"/ig,
    htmlSaveType: 'HTMLComplete',
    evaluateCallback: () => ({html: document.body.outerHTML, pathname: document.location.pathname}),
    nightmareConfig: {
        show: false, // DO NOT SET THIS TO TRUE!!!
        paths: {
            userData: pathUtil.downloads
        },
        ignoreDownloads: true, // TODO: download stuff...
    },
    DID_GET_RESPONSE_DETAILS: 'did-get-response-details',
    didGetResponseDetailsEventHandler: (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
        if (urlUtil.shouldDownload(resourceType, requestMethod, originalUrl)) {
            //logUtil.log(resourceType, originalUrl)

            const downloadUrl = urlUtil.getDownloadUrl(originalUrl)
            global.urlsTodo[downloadUrl] = messages.pending
            global.urlsTodo[downloadUrl] = request({uri: originalUrl, headers})
                .then((data) => fs.outputFile(pathUtil.getFilePath(originalUrl), data))
                .then(() => {
                    global.xhrs[originalUrl] = messages.done
                    return messages.done
                })
                .catch((reason) => {
                    global.xhrs[originalUrl] = reason
                    return reason
                })
        }
    }
}