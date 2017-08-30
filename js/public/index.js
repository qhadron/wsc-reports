import lib from '../lib/common';
import FileSaver from 'file-saver';
import {formatAsCsvBlob} from '../lib/queryparser';

const columns = ['Name', 'Description']

const BUTTON_VIEW = (id) => {
    const a = document.createElement('a');
    a.target = '_blank';
    a.href = `display?id=${id}`;
    a.textContent = 'View';
    a
        .classList
        .add('ui', 'primary', 'button');
    return a;
}
const BUTTON_DOWNLOAD = (id) => `<button class="download ui primary button" data-query-id="${id}">CSV</button>`;

function addMessage(header, msg, type) {
    $('#messages').append(`<div class="ui ${type
        ? type
        : ''} message">
            <div class="header">
                ${header}
            </div>
            <i class="close icon" onclick="$(this).closest('.message').transition('fade')"></i>
            <p>${msg}</p>
        </div>`);
}

window.addMessage = addMessage;

function selectFilename() {
    return new Promise((resolve, _reject) => {
        const filename = window.prompt('Please enter a filename:', `${new Date().toISOString()}.csv`);
        resolve(filename);
    })
}

function delay(ms) {
    return new Promise((r, _) => setTimeout(r, ms));
}

async function saveAsCSV(id) {
    try {
        const data = lib.queryDatabaseQueryId(id);
        const filename = await selectFilename();
        if (filename === null || !filename) {
            return;
        }
        const err = (await data).err;
        if (err) {
            addMessage('Database Error', err.message, 'error');
        }
        FileSaver.saveAs(formatAsCsvBlob(await data), await filename);
    } catch (err) {
        addMessage(err.name, err.message, 'error');
    }
}

async function handleTableClick(evt) {
    if (evt.target.tagName === 'BUTTON') {
        switch (true) {
                case evt
                    .target
                    .classList
                    .contains('download'):
                evt.stopPropagation();
                $('#querylist')
                    .find('.ui.dimmer')
                    .addClass('active');
                await delay(100);
                const id = evt
                    .target
                    .getAttribute('data-query-id');
                await saveAsCSV(id);
                $('#querylist')
                    .find('.ui.dimmer')
                    .removeClass('active');
                break;
            default:
                break;
        }
    }
}

function formatQueryList(queries) {
    const table = document.createElement('table');

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

    table
        .classList
        .add('ui', 'celled', 'striped', 'table');
    return table;
}

function addRow(query) {
    const row = document.createElement('tr');
    // name
    {
        const name = row.insertCell();
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = `display?id=${query.id}`;
        a.textContent = query.displayName;
        name.appendChild(a);
    }
    // Description
    {
        const desc = row.insertCell();
        desc.textContent = query.description;
    }
    // actions
    {
        const view = row.insertCell();
        view.appendChild(BUTTON_VIEW(query.id));
        const dl = row.insertCell();
        dl.innerHTML = BUTTON_DOWNLOAD(query.id);
    }
    return row;
}

window.addEventListener('load', () => {
    lib
        .queryDatabaseList()
        .then(list => {
            document
                .getElementById('querylist')
                .appendChild(formatQueryList(list));
        });
});