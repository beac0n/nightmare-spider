const cache = [
    '',
    ' ',
    '  ',
    '   ',
    '    ',
    '     ',
    '      ',
    '       ',
    '        ',
    '         '
]

const MAX_CACHED_SPACE = 10
const SPACE = ' '
module.exports = function leftPad(string, padLength = 0, padChar = ' ') {
    string = String(string)
    padLength = padLength - string.length

    if (padLength <= 0) {
        return string
    }

    padChar = String(padChar)
    if (padChar === SPACE && padLength < MAX_CACHED_SPACE) {
        return cache[padLength] + string
    }

    let pad = ''
    while (padLength) {
        if (padLength & 1) { // is padLength odd?
            pad += padChar
        }
        padLength >>= 1 // divide by 2, ditch remainder

        // "double" the 'padChar' so this operation count grows logarithmically on 'padLength'
        // each time 'padChar' is "doubled", the 'padLength' would need to be "doubled" too
        // similar to finding a value in binary search tree, hence O(log(n))
        if (padLength) {
            padChar += padChar
        }
    }

    return pad + string
}
