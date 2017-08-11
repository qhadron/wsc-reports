import lib from './common';
import {DB_TYPES} from './oracle';

const name = document.getElementById('name');
const conditions = document.getElementById('conditions');
const button = document.querySelector('button');
const output = document.querySelector('.output');

function doQuery() {
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
    lib
        .queryDatabase(databaseName, params)
        .catch(err => JSON.stringify(err, ['message', 'arguments', 'type', 'name']))
        .then(res => {
            display(output, res)
        });
}

function display(output, data) {
    let error;
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
        error = data.error;
        output.innerHTML = "";
        output.appendChild(table);
    } catch (err) {
        error = err;
    }
    if (error) {
        const div = document.createElement('div');
        div
            .classList
            .add('error');
        div.innerHTML = `<span>There was an error while executing your query: 
            <code>
                    ${JSON.stringify(error)}
                    <kcode>
                </span>`;
        output.insertBefore(div, output.firstChild);
        console.error(error);
    }
}

button.addEventListener('click', doQuery);