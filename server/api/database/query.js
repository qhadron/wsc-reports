const express = require('express');
const router = express.Router();
const QueryManager = require('./lib/QueryManager');
const {handleQuery, handleError, staticRouter} = require('./lib/doquery');

router.use(staticRouter);

router.get('/:id', (req, res) => {
    const id = req.params.id;
    QueryManager
        .getQueries()
        .then(queries => {
            const query = queries.find(x => x.id === id);
            if (!query) {
                throw new Error(`The query with id ${id} does not exist.`);
            }
            return handleQuery(query.sql, [], req, res);
        })
        .catch(err => {
            handleError(req, res, err);
        });
});

router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    QueryManager
        .getQueries()
        .then(queries => {
            res.send(queries);
        })
        .catch(err => {
            res.send({error: err});
        });
});

module.exports = router;