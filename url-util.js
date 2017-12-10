const {URL} = require('url')
const normalizeUrlBase = require('normalize-url')
const normalizeUrlConfig = {stripWWW: false, removeTrailingSlash: false}
const normalizeUrl = (url) => normalizeUrlBase(url, normalizeUrlConfig)

const {domain, ssl, start} = require(process.argv[2] || './config.json')

const HTTP = 'http'
const HTTPS = 'https'
const ENC_SCHEME = (ssl ? HTTPS : HTTP)
const BASE = `${ENC_SCHEME}://${domain}/`
const getRealHref = (url, pathname) => new URL(url, BASE + pathname).href

const domainRegex = new RegExp('^' + ENC_SCHEME + '?://' + domain + '[^\\.]')
const subDomainRegex = new RegExp('^' + ENC_SCHEME + '?://.*\\.' + domain + '[^\\.]')
const urlMatchesDomain = (url) => domainRegex.test(url) || subDomainRegex.test(url)

const XHR = 'xhr'
const GET = 'GET'

const fixUrl = (url, pathname) => {
    let newUrl = url.trim()
    if (newUrl.startsWith(HTTP)) {
        return normalizeUrl(newUrl)
    }

    return normalizeUrl(getRealHref(newUrl, pathname))
}

module.exports = {
    fix: fixUrl,
    shouldVisitFixed: (url) => urlMatchesDomain(url) && !global.urlsTodo[url],
    shouldDownload: (resourceType, requestMethod, url) => {
        return !global.urlsTodo['DOWNLOAD ' + url] && resourceType === XHR && requestMethod === GET && urlMatchesDomain(fixUrl(url))
    },
    startUrl: normalizeUrl(ENC_SCHEME + '://' + start),
}