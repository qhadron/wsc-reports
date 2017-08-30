import {displayDataAsTable, addMessage} from '../lib/queryparser';
import {queryDatabaseQueryId, queryDatabaseList} from '../lib/common';

const output = document.getElementById('output');
const errors = document.getElementById('errors');
const tableTemplate = document.getElementById('table');

async function main() {
    const url = new URL(window.location.href);
    let ids;
    try {
        ids = url
            .searchParams
            .getAll('id');
    } catch (e) {
        addMessage(e.name, `Could not get query id: ${e.message}`, 'error');
        return;
    }
    let queryList = queryDatabaseList();
    document.title = `Loading...`;

    const promises = ids.map(id => (async() => {
        const data = queryDatabaseQueryId(id);
        const clone = document.importNode(tableTemplate.content, true);
        const query = (await queryList).find(x => x.id === id);
        clone
            .querySelector('.title')
            .textContent = query.displayName;
        displayDataAsTable(clone.querySelector('.output'), await data, errors);
        console.dir(clone);
        output.appendChild(clone);
        return query.displayName;
    })());
    const names = await Promise.all(promises);
    document.title = names.join(',');
}

window.addEventListener('load', () => {
    main().catch(err => {
        addMessage(errors, err.name, err.message, 'error');
    }).then(() => {
        if (errors.childElementCount === 0) 
            errors.parentElement.classList.add('hidden');
        }
    ).then(() => {
        $('.dimmer').remove()
    });
});