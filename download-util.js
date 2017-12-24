const urlUtil = require('./url-util')
const logUtil = require('./log-util')
const messages = require('./messages')
const fs = require('fs-extra')
const request = require('request')

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



module.exports = {
    downloadFile,
}
