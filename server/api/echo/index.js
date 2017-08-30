const debug = require('debug')('api:echo');

module.exports = function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    let source;
    switch (req.method) {
        case "GET":
            source = req.query;
            break;
        case "PUT":
        case "POST":
            source = req.body || req.query;
        default:
            break;
    }
    debug(`Received `, source);
    let copy = Object.assign({}, source);
    copy.time = new Date();
    copy.status = `OK`;
    copy.msg = `You posted ${JSON.stringify(source)}!`;
    res.write(`${JSON.stringify(copy, null, 4)}`);
    res.send();
}