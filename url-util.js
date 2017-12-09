const { URL } = require('url')
const normalizeUrlBase = require('normalize-url')
const normalizeUrl = (url) => normalizeUrlBase(url, {
    stripWWW: false,
})

const {domain, ssl, start} = require(process.argv[2] || './config.json')

const HTTP = 'http'
const HTTPS = 'https'
const ENC_SCHEME = (ssl ? HTTPS : HTTP)
const BASE = `${ENC_SCHEME}://${domain}/`
const getRealHref = (url, pathname) => new URL(url, BASE + pathname).href

const domainRegex = new RegExp('^' + ENC_SCHEME + '?://' + domain + '[^\\.]')
const subDomainRegex = new RegExp('^' + ENC_SCHEME + '?://.*\\.' + domain + '[^\\.]')
const urlMatchesDomain = (url) => domainRegex.test(url) || subDomainRegex.test(url)

const fixUrl = (url, pathname) => {

    let newUrl = url.trim()
    if (newUrl.startsWith(HTTP)) { // this one is prop. okay, normalize anyway
        return normalizeUrl(newUrl)
    }

    return normalizeUrl(getRealHref(newUrl, pathname))
}

const XHR = 'xhr'
const GET = 'GET'

module.exports = {
    fix: fixUrl,
    shouldVisit: (url) => urlMatchesDomain(url) && !global.urlsTodo[url],
    shouldDownload: (resourceType, requestMethod, url) => resourceType === XHR && requestMethod === GET && urlMatchesDomain(url),
    startUrl: normalizeUrl(ENC_SCHEME + '://' + start),
}