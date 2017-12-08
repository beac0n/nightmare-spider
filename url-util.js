const normalizeUrl = require('normalize-url')

const {domain, ssl, start} = require(process.argv[2] || './config.json')

const domainRegex = new RegExp('^https?://' + domain + '[^\\.]')
const subDomainRegex = new RegExp('^https?://.*\\.' + domain + '[^\\.]')
const matchesUrl = (url) => url.match(domainRegex) || url.match(subDomainRegex)

const fixUrl = (url) => {
    let newUrl = url
    newUrl = newUrl.trim()
    if (!newUrl.startsWith('http')) {
        if (newUrl.startsWith('//')) { // same encryption
            newUrl = normalizeUrl((ssl ? 'https' : 'http') + ':' + newUrl)
        } else if (newUrl.includes('.')) { // subdomain
            newUrl = normalizeUrl((ssl ? 'https' : 'http') + '://' + newUrl)
        } else { // path
            newUrl = normalizeUrl((ssl ? 'https' : 'http') + '://' + domain + '/' + newUrl)
        }
    }

    return newUrl
}

module.exports = {
    fix: fixUrl,
    shouldVisit: (url) => matchesUrl(url) && !url.includes('#') && !global.urlsTodo[url],
    getStart: () => normalizeUrl(`http${ssl ? 's' : ''}://${start}`),
    shouldDownloadUrl: (resourceType, requestMethod, url) => resourceType === 'xhr' && requestMethod === 'GET' && matchesUrl(fixUrl(url))
}