const path = require('path')
const fs = require('fs-extra')

const HTTP_OR_HTTPS_REGEX = new RegExp('^https?://', 'ig')

const config = require(process.argv[2])

const savePath = config.path || __dirname

const dataPath = path.join(savePath, 'data')
const downloadsPath = path.join(savePath, 'downloads')

module.exports = {
    downloads: downloadsPath,
    getDownloadPath: (filename) => {
        if (!filename.includes('/')) {
            return path.join(downloadsPath, filename)
        }

        const urlArray = filename.split('/')
        return path.join(downloadsPath, urlArray[urlArray.length - 1])
    },
    prepare: () => {
        fs.emptyDirSync(dataPath)
        fs.emptyDirSync(downloadsPath)
    },
    getFilePath: (url) => path.join(dataPath, ...url.replace(HTTP_OR_HTTPS_REGEX, '').split('/')) + '.file'
}