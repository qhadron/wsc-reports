import lib from './lib/common';
import {DB_TYPES} from './lib/oracle';
import FileSaver from 'file-saver';

/*global ace*/

const name = document.getElementById('name');
const conditions = document.getElementById('conditions');
const queryButton = document.querySelector('#query');
const csvButton = document.querySelector('#csv');
const output = document.querySelector('.output');
const statement = ace.edit(document.getElementById('statement'));

statement
    .session
    .setMode("ace/mode/sql");
statement.setOption('wrap', 'free');

let queryData = null;

function saveAsCsv() {
    if (!queryData) {
        console.error('Tried saving without data...');
        alert('Please do a query first');
        return;
    }
    const filename = window.prompt('Please enter a filename:', `${new Date().toISOString()}.csv`);
    if (filename === null) {
        return;
    }

    FileSaver.saveAs(formatAsCsvBlob(queryData), filename, true);
}

function updateCsvStatus() {
    if (queryData) {
        csvButton.disabled = false;
    } else {
        csvButton.disabled = true;
    }
}

function formatAsTable(data) {
    if (!data) 
        return;
    const table = document.createElement('table');
    // header
    {
        const thead = table.createTHead();
        const row = thead.insertRow();
        data
            .metaData
            .forEach(({name}) => {
                row
                    .insertCell()
                    .innerHTML = `<h4>${name}</h4>`;
            });
    }
    // body
    {
        const tbody = table.createTBody();
        data
            .rows
            .forEach(src => {
                const row = tbody.insertRow();
                for (let i = 0; i < src.length; ++i) {
                    const cell = row.insertCell();
                    // this is probably an image, display it as such
                    if (data.metaData[i].dbType === DB_TYPES.DB_TYPE_BLOB) {
                        const img = document.createElement('img');
                        const url = `${src[i]}`;
                        row[i] = '';
                        img.src = url;
                        img.addEventListener('error', () => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.textContent = `Click here`;
                            a.target = `_blank`;
                            img
                                .parentElement
                                .replaceChild(a, img);
                        });
                        cell.appendChild(img);
                    } else {
                        cell.innerHTML = src[i];
                    }
                }
            });
        if (data.rows.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = table
                .querySelector('thead')
                .firstElementChild
                .childElementCount;
            cell.textContent = "No data exist for the given parameters";
        }
    }
    return table;
}

function formatAsCsvBlob(data) {
    if (!data) 
        return;
    const out = [];
    // headers
    out.push(data.metaData.map(({name}) => name).join(','));
    // rows
    data
        .rows
        .map(row => {
            for (let i = 0; i < row.length; ++i) {
                if (data.metaData[i].dbType === DB_TYPES.DB_TYPE_BLOB) {
                    row[i] = 'Binary Data';
                }
            }
            return row;
        })
        .map(row => row.join(','))
        .forEach(str => (out.push(str)));
    return new Blob([out.join('\n')], {type: 'text/csv'});
}

function doQuery() {
    queryData = null;
    output.innerHTML = 'Loading...';
    let result;
    if (statement.getValue()) {
        result = lib.queryDatabaseSql(statement.getValue());
    } else {
        const databaseName = name
            .value
            .toUpperCase();
        let params;
        try {
            params = JSON.parse(conditions.value || '{}');
        } catch (err) {
            output.textContent = err;
            return;
        }
        result = lib
            .queryDatabaseTable(databaseName, params)
            .catch(err => JSON.stringify(err, ['message', 'arguments', 'type', 'name']))
    }
    result.then(res => {
        queryData = res;
        updateCsvStatus();
        display(output, res)
    });
}

function display(output, data) {
    // clear output
    output.innerHTML = "";

    if (data.error) {
        addError(data.error);
    }
    try {
        const table = formatAsTable(data);
        output.appendChild(table);
    } catch (err) {
        addError(err.message);
    }
}

function addError(message) {
    const div = document.createElement('div');
    div
        .classList
        .add('error');
    div.innerHTML = `<span>
        There was an error while executing your query: 
        <code>
                ${message}
        </code>
    </span>`;
    return output.insertBefore(div, output.firstChild);
}

queryButton.addEventListener('click', doQuery);
csvButton.addEventListener('click', saveAsCsv);
updateCsvStatus();