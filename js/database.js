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
        .then(res => {
            // res     .clone()     .text()     .then(console.log);
            return res.json();
        })
        .catch(err => JSON.stringify(err, ['message', 'arguments', 'type', 'name']))
        .then(res => {
            display(output, res)
        });
}

function display(output, data) {
    try {
        const table = document.createElement('table');
        const thead = table.createTHead();
        {
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
            data
                .rows
                .forEach(src => {
                    const row = table.insertRow();
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
                    src.forEach(entry => {
                        row
                            .insertCell()
                            .textContent = entry;
                    });
                })
        }
        output.innerHTML = "";
        output.appendChild(table);
    } catch (err) {
        output.textContent = JSON.stringify(data);
        console.error(err);
    }
}

button.addEventListener('click', doQuery);