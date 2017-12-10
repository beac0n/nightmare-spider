const path = require('path')
const fs = require('fs-extra')

const HTTP_OR_HTTPS_REGEX = new RegExp('^https?://', 'g')

const dataPath = path.join(__dirname, 'data')
const downloadsPath = path.join(__dirname, 'downloads')

const DOT_FILE = '.file'
const EMPTY_STRING = ''
const SLASH = '/'

module.exports = {
    downloads: downloadsPath,
    prepare: () => {
        fs.emptyDirSync(dataPath)
        fs.emptyDirSync(downloadsPath)
    },
    getFilePath: (url) => path.join(dataPath, ...url.replace(HTTP_OR_HTTPS_REGEX, EMPTY_STRING).split(SLASH)) + DOT_FILE
}