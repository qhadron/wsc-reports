import {displayDataAsTable} from '../lib/queryparser';
import * as lib from '../lib/common';
import {columns} from '../lib/queryListStructure';

const queryListOutput = document.getElementById('query-list-output');
const queryOutput = document.getElementById('query-output');
const TABLE_ID = `query-table`;
const BUTTON_RUN_QUERY = `<button class="run ui primary button">Run</button>`;
const BUTTON_REMOVE_ROW = `<button class="remove ui button">Remove</button>`;

async function updateQueryList() {
    const data = await lib.queryDatabaseList();
    const table = formatQueryList(data);
    queryListOutput.innerHTML = '';
    queryListOutput.appendChild(table);
}

async function handleTableClick(e) {
    const row = e.target.parentElement.parentElement;
    switch (true) {
            case e
                .target
                .classList
                .contains('remove'):
            if (!row.classList.contains('new')) {
                // remove query
                await lib.removeQuery(row.querySelector('.id').value);
            }
            row.remove();
            break;
        case e
                .target
                .classList
                .contains('run'):
            let id,
                query;
            id = row
                .querySelector('.id')
                .value;
            query = row
                .querySelector('.sql')
                .value;
            queryOutput
                .querySelector('.title')
                .classList
                .remove('hidden');
            queryOutput
                .querySelector(`.id`)
                .textContent = id;
            queryOutput
                .querySelector('.loader')
                .classList
                .add('active');
            const data = await lib.queryDatabaseSql(query);

            displayDataAsTable(queryOutput.querySelector('.out'), data);

            queryOutput
                .querySelector('.loader')
                .classList
                .remove('active');
            break;
        default:
            break;
    }
}

function handleTableInput(e) {
    const el = e.target;
    const parent = el.parentElement.parentElement.parentElement;
    if (!parent.classList.contains('new')) 
        parent.classList.add('modified', 'warning');
    }

function formatQueryList(queries) {
    const table = document.createElement('table');
    table.id = TABLE_ID;

    // header
    {
        const header = table
            .createTHead()
            .insertRow();
        for (let col of columns) {
            const cell = document.createElement('th');
            cell.innerHTML = `<h4>${col.toUpperCase()}</h4>`;
            header.appendChild(cell);
        }
        // actions
        {
            const actions = document.createElement('th');
            actions.innerHTML = `<h4>Actions</h4>`;
            actions.colSpan = 2;
            header.appendChild(actions);
        }
    }
    // body
    {
        const tbody = table.createTBody();
        for (let query of queries) {
            tbody.appendChild(addRow(query));
        }
    }

    table.addEventListener('click', handleTableClick);
    table.addEventListener('input', handleTableInput);
    table
        .classList
        .add('ui', 'celled', 'striped', 'table');
    return table;
}

function addRow(query) {
    const row = document.createElement('tr');
    row
        .classList
        .add('data');
    if (!query) 
        row.classList.add('new', 'positive');
    for (let col of columns) {
        const cell = row.insertCell();
        cell.innerHTML = `<div class="ui icon input">
        <input type="text" class="${col}" placeholder="${col}"></input>
        <i class="icon"></i>
        </div>`;
        if (query && query[col]) {
            cell
                .querySelector(`.${col}`)
                .value = query[col];
        }
    }
    if (query) 
        row.setAttribute('data-old-id', query.id);
    const run = row.insertCell();
    run.innerHTML = BUTTON_RUN_QUERY;
    const remove = row.insertCell();
    remove.innerHTML = BUTTON_REMOVE_ROW;
    return row;
}

async function submit(_e) {
    const rows = Array.from(queryListOutput.querySelectorAll('.modified, .new'));
    Array
        .from(queryListOutput.querySelectorAll('.input'))
        .forEach(elem => elem.classList.add('disabled', 'loading'));
    await Promise.all(rows.map(row => {
        let p = Promise.resolve();
        let query = {};
        for (let col of columns) {
            const val = row
                .querySelector(`.${col}`)
                .value
                .trim();
            query[col] = val;
        };
        if (!row.classList.contains('new') && row.classList.contains('modified')) {
            // delete entry first
            p = p.then(() => lib.removeQuery(row.getAttribute('data-old-id')))
        }
        return p.then(() => lib.addQuery(query))
    }));
    updateQueryList();
}

updateQueryList();
document
    .getElementById('addrow')
    .addEventListener('click', () => queryListOutput.querySelector('tbody').appendChild(addRow()));

document
    .getElementById('submit')
    .addEventListener('click', submit);

document
    .getElementById('refresh')
    .addEventListener('click', updateQueryList);

window.updateQueryList = updateQueryList;