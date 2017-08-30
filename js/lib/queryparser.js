import {DB_TYPES} from './oracle';
export function formatAsTable(data) {
    if (!data || typeof data.metaData === "undefined" || typeof data.rows === "undefined") 
        return;
    const table = document.createElement('table');
    // header & footer
    {
        const thead = table.createTHead();
        // const tfoot = table.createTFoot();
        const headrow = thead.insertRow();
        // const footrow = tfoot.insertRow();
        data
            .metaData
            .forEach(({name}) => {
                const th = document.createElement('th');
                th.innerHTML = `<h4>${name}</h4>`;
                headrow.appendChild(th.cloneNode(true));
                // footrow.appendChild(th);
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
                    cell
                        .classList
                        .add('collapsing');
                    // this is probably an image, display it as such
                    if (data.metaData[i].dbType === DB_TYPES.DB_TYPE_BLOB) {
                        const image = document.createElement('a');
                        const img = document.createElement('img');
                        const url = `${src[i]}`;
                        image.target = `_blank`;
                        image.href = url;
                        img
                            .classList
                            .add('ui', 'small', 'image');
                        img.src = url;
                        img.addEventListener('error', () => {
                            const a = document.createElement('a');
                            a.href = url;
                            a.textContent = `Click here to view file`;
                            a.target = `_blank`;
                            image
                                .parentElement
                                .replaceChild(a, image);
                        });

                        image.appendChild(img);
                        cell.appendChild(image);
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
    table
        .classList
        .add('ui', 'celled', 'striped', 'table');

    return table;
}

export function formatAsCsvBlob(data) {
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

export function displayDataAsTable(output, data, error) {
    error = error || output;
    // clear output
    output.innerHTML = "";

    if (data.error) {
        addMessage(error, 'Database Error', data.error, 'error');
    }
    try {
        const table = formatAsTable(data);
        if (table) 
            output.appendChild(table);
        else 
            return;
        
        // datatable
        if (typeof $ !== undefined && typeof $().DataTable !== undefined) {
            let dt = $(table).DataTable();
            // add text fields
            $(table)
                .find('thead th')
                .each((i, elem) => {
                    const txt = $(elem).text();
                    const container = document.createElement('div');
                    const input = document.createElement('input');
                    input.type = "text";
                    container
                        .classList
                        .add('ui', 'input');
                    input.placeholder = `Search ${txt}`;
                    container.appendChild(input);
                    elem.appendChild(container);
                    container.addEventListener('click', e => e.stopPropagation());
                    input.addEventListener('input', e => {
                        dt
                            .columns(i)
                            .search(e.target.value)
                            .draw();
                    })
                });
        }
    } catch (err) {
        addMessage(error, 'Dispaly Error', err.message);
    }
}

export function addMessage(output, header, msg, type) {
    $(output).append(`<div class="ui ${type
        ? type
        : ''} message">
            <div class="header">
                ${header}
            </div>
            <i class="close icon" onclick="$(this).closest('.message').transition('fade')"></i>
            <p>${msg}</p>
        </div>`);
}