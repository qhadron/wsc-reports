import express from 'express';
import QueryManager from '../lib/QueryManager';
import {handleError} from '../lib/doquery';

const router = express.Router();

function setResponseHeaders(req, res, next) {
    res.setHeader('Content-Type', 'application/json');
    next();
}

async function getQueries(req, res) {
    res.status(200);

    try {
        const queries = await QueryManager.getQueries();
        res.send(queries)
    } catch (err) {
        console.error(err);
        res.send({error: err});
    }
    res.send();
}

async function addQuery(req, res) {
    let data = req.body.query;
    let query = new QueryManager.Query(data.id, data.displayName, data.description, data.sql);
    await QueryManager.addQuery(query);
    res.status(200);
    res.send({message: 'OK'});
}

async function removeQuery(req, res) {
    res.setHeader('Content-Type', 'application/json');
    const id = req.params.id;
    await QueryManager.removeQuery(id);
    res.status(200);
    res.send({message: 'OK'});
}

router.use(setResponseHeaders);

router.get('/', (req, res) => {
    getQueries(req, res).catch(err => handleError(req, res, err));
});

router.put('/', (req, res) => {
    addQuery(req, res).catch(err => handleError(req, res, err));
});

router.delete('/:id', (req, res) => {
    removeQuery(req, res).catch(err => handleError(req, res, err));
});

module.exports = router;