const fs = require('fs-extra')
const path = require('path')
const URL = require('url')
const kill = require('tree-kill')
const request = require('request-promise')
const cheerio = require('cheerio')

fs.emptyDirSync(path.join(__dirname, 'data'))

const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const {domain, ssl, start, show} = require(process.argv[2] || './config.json')


const alreadyProcessed = {}
const urlsTodo = {}

const httpOrHttps = new RegExp('^https?://', 'g')
const dataDirPath = path.join(__dirname, 'data')
const getFilePath = (url) => path.join(dataDirPath, ...url.replace(httpOrHttps, '').split('/')) + '.data'

const domainRegex = new RegExp('^https?://' + domain + '[^\\.]')
const subDomainRegex = new RegExp('^https?://.*\\.' + domain + '[^\\.]')
const matchesDomain = (href) => href.match(domainRegex) || href.match(subDomainRegex)

const burnUrl = (url) => {
    delete urlsTodo[url]
}


const failLog = (toLog, where) => console.log('FAIL:', where, toLog)

const log = (url, todos) => console.log(`done: ${Object.keys(alreadyProcessed).length} | todo: ${todos} | current: ${url}`)

const visitHtmlHref = (href) => matchesDomain(href) && !href.includes('#') && !alreadyProcessed[href]

const mainNightmare = Nightmare({show})
    .on('did-get-response-details',
        (event, status, newUrl, originalUrl, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
            if (resourceType === 'xhr' && requestMethod === 'GET' && matchesDomain(originalUrl)) {
                request({uri: originalUrl, headers})
                    .then((json) => fs.outputFile(getFilePath(originalUrl), json))
                    .catch(() => failLog(originalUrl, 'XHR'))
            }
        })
    .on('download', (state, downloadItem) => {
        if (state === 'started') {
            const {url} = downloadItem
            burnUrl(url)
            mainNightmare.emit('download', getFilePath(url), downloadItem)
        }
    })
const htmlComplete = 'HTMLComplete'
const openSite = () => {
    const urlsTodoArray = Object.keys(urlsTodo)
    if (urlsTodoArray.length === 0) {
        console.log('done')
        kill(process.pid)
        return
    }

    const url = URL.format(urlsTodoArray.pop())
    console.log(url)
    if (alreadyProcessed[url]) {
        return
    }

    log(url, urlsTodoArray.length)

    const filePath = getFilePath(url)
    alreadyProcessed[url] = mainNightmare
        .goto(url)
        .html(filePath, htmlComplete)
        .then(() => fs.readFile(filePath))
        .then((file) => file.toString())
        .then((html) => {
            const $ = cheerio.load(html);
            const hrefs = []
            $('a[href]').each((index, element) => element.attribs.href && hrefs.push(element.attribs.href))
            return hrefs
        })
        .then((hrefs) => {
            hrefs.forEach((href) => {
                if (visitHtmlHref(href)) {
                    urlsTodo[href] = true
                }
            })

            burnUrl(url)
        })
        .catch((error) => {
            burnUrl(url)
            if (error.details !== 'ERR_ABORTED') {
                failLog(error, url)
            }
        })
}

urlsTodo[URL.format(`http${ssl ? 's' : ''}://${start}`)] = true
setInterval(openSite, 0)
