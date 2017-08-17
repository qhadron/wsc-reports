/**
 * Converts MSACCESS SQL to PL
 * @param {string} str
 */
function convert(str) {
    const result =
        str.replace(/\b(HYDEX_3)_/ig, `$1.`).replace(/"/g, `'`).replace(/;\s+$/g, '');
    return result;
}

module.exports.convert = convert;