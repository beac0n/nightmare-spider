const cheerio = require('cheerio')
const urlUtil = require('./url-util')

module.exports = {
    getUrls: (html) => {
        const $ = cheerio.load(html);
        const urls = []
        $('a[href]').each((index, element) => {
            urls.push(urlUtil.fix(element.attribs.href))
        })
        return urls
    }
}