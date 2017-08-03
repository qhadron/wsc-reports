const app = require('./app'),
    router=  require('./routes.js'),
    db = require('./db.js');
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});

app.use('/', router);