import lib from './common';
import {DB_TYPES} from './oracle';

const name = document.getElementById('name');
const conditions = document.getElementById('conditions');
const button = document.querySelector('button');
const output = document.querySelector('.output');
const statement = document.getElementById('statement');

function doQuery() {
    let result;
    if (statement.value) {
        result = lib.queryDatabaseSql(statement.value);
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
        const table = document.createElement('table');
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

button.addEventListener('click', doQuery);