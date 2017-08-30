const patterns = [
    [
        /\b(HYDEX_3)_/ig, `$1.`
    ], // database name
    [
        /(like\s+"[^"]*?)\*/ig, `$1%`
    ], // like: * => %
    [
        /(like\s+"[^"]*?)\?/ig, `$1_`
    ], // like: ? => _
    [
        /"/g, `'`
    ], // quotes
    [
        /\[(.*?)\]/g, `"$1"`
    ], // replace alias
    [
        /;\s+$/g, ''
    ], // remove trailing semicolon
]

/**
 * Converts MSACCESS SQL to PL
 * @param {string} str
 */
function convert(str) {
    patterns.forEach(pattern => {
        let replacement;
        while (true) {
            replacement = str.replace(...pattern);
            if (replacement === str) 
                break;
            str = replacement;
        }
    });
    return str;
}

module.exports.convert = convert;