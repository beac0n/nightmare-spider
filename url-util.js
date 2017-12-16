const {URL} = require('url')
const normalizeUrlBase = require('normalize-url')
const normalizeUrlConfig = {
    stripWWW: false,
    removeTrailingSlash: false,
    removeQueryParameters: [/[\s\S]*/ig]
}
const normalizeUrl = (url) => normalizeUrlBase(url, normalizeUrlConfig)

const {domain, ssl, start} = require(process.argv[2])

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

const fix = (url, pathname) => {
    let newUrl = url.trim()
    if (newUrl.startsWith(HTTP)) {
        return normalizeUrl(newUrl)
    }

    return normalizeUrl(getRealHref(newUrl, pathname))
}

const getUrlDownloadKey = (url) => url + ' DOWNLOAD'

const shouldDownload = (url) => url
    && !global.urlsTodo[getUrlDownloadKey(url)]
    && urlMatchesDomain(url)

module.exports = {
    getUrlDownloadKey,
    fix,
    shouldVisitFixed: (url) => url
        && urlMatchesDomain(url)
        && !global.urlsTodo[url],
    shouldDownload,
    shouldDownloadXhr: (resourceType, requestMethod, url) => shouldDownload(url)
        && resourceType === XHR
        && requestMethod === GET,
    startUrl: normalizeUrl(ENC_SCHEME + '://' + start),
}