const path = require('path')

const httpOrHttpsRegex = new RegExp('^https?://', 'g')

const dataPath = path.join(__dirname, 'data')
const getFilePathUrl = (url) => path.join(dataPath, ...url.replace(httpOrHttpsRegex, '').split('/')) + '.file'
const downloadsPath = path.join(__dirname, 'downloads')

module.exports = {
    downloads: downloadsPath,
    data: dataPath,
    getFilePath: getFilePathUrl
}