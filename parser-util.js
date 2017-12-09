const urlUtil = require('./url-util')

const hrefRegex = /href="(\s*)([^"\s]*)(\s*)"/ig

module.exports = {
    getUrls: ({html, pathname}) => {
        const urls = []

        let match = hrefRegex.exec(html)
        while (match !== null) {
            const matchFix = urlUtil.fix(match[2], pathname)
            if (urlUtil.shouldVisit(matchFix)) {
                urls.push(matchFix)
            }
            match = hrefRegex.exec(html)
        }

        return urls
    }
}