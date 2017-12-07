const fs = require('fs-extra')
const path = require('path')
const kill = require('tree-kill')
const request = require('request-promise')
const cheerio = require('cheerio')
const normalizeUrl = require('normalize-url')

fs.emptyDirSync(path.join(__dirname, 'data'))

const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const {domain, ssl, start} = require(process.argv[2] || './config.json')

const urlsReceived = {}
const urlsTodo = {}

const httpOrHttps = new RegExp('^https?://', 'g')
const dataDirPath = path.join(__dirname, 'data')
const getFilePath = (url) => path.join(dataDirPath, ...url.replace(httpOrHttps, '').split('/'))
    + (!url.endsWith('.png') ? '.data' : '')

const domainRegex = new RegExp('^https?://' + domain + '[^\\.]')
const subDomainRegex = new RegExp('^https?://.*\\.' + domain + '[^\\.]')
const matchesDomain = (href) => href.match(domainRegex) || href.match(subDomainRegex)

const failLog = (toLog, where) => console.log('FAIL:', where, toLog)

let counter = 0
const log = (url) => console.log(`${counter++} current: ${url}`)

const visitHtmlHref = (href) => matchesDomain(href) && !href.includes('#') && !urlsTodo[href]

const fixUrl = (url) => {
    let newUrl = url
    newUrl = newUrl.trim()
    if (!newUrl.startsWith('http')) {
        newUrl = normalizeUrl((ssl ? 'https' : 'http') + '://' + domain + '/' + newUrl)
    }

    return newUrl
}

const mainNightmare = () => Nightmare(
    {
        show: false, // DO NOT SET THIS TO TRUE!!!
        ignoreDownloads: true, // TODO: download stuff...
    })
    .downloadManager()
    .on('did-get-response-details',
        (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
            if (resourceType === 'xhr' && requestMethod === 'GET' && matchesDomain(fixUrl(originalUrl))) {
                request({uri: originalUrl, headers})
                    .then((json) => fs.outputFile(getFilePath(originalUrl), json))
                    .catch(() => failLog(originalUrl, 'XHR'))
            }
        })

const openSite = (url) => {
    log(url)
    urlsReceived[url] = true

    return mainNightmare()
        .goto(url)
        .html(getFilePath(url), 'HTMLComplete')
        .evaluate(() => document.body.outerHTML)
        .end()
        .then((html) => {
            const $ = cheerio.load(html);
            const hrefs = []
            $('a[href]').each((index, element) => {
                hrefs.push(fixUrl(element.attribs.href))
            })
            return hrefs
        })
        .then((hrefs) => {
            const hrefsLength = hrefs.length
            for(let i = 0; i < hrefsLength; ++i) {
                const href = hrefs[i]
                if (visitHtmlHref(href)) {
                    urlsTodo[href] = 'pending'
                    urlsTodo[href] = openSite(href)
                }
            }
        })
        .catch((error) => {
            if (error.details !== 'ERR_ABORTED') {
                failLog(error, url)
            }
        })
        .then(() => 'done')
}

const startUrl = normalizeUrl(`http${ssl ? 's' : ''}://${start}`)
urlsTodo[startUrl] = openSite(startUrl)

