import lib from '../lib/common';
import FileSaver from 'file-saver';
import {formatAsCsvBlob, displayDataAsTable} from '../lib/queryparser';

/*global ace*/

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
function doQuery() {
    queryData = null;
    output.innerHTML = 'Loading...';
    let result;
    result = lib.queryDatabaseSql(statement.getValue());
    result.then(res => {
        queryData = res;
        updateCsvStatus();
        displayDataAsTable(output, res)
    });
}

queryButton.addEventListener('click', doQuery);
csvButton.addEventListener('click', saveAsCsv);
updateCsvStatus();