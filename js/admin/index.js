import lib from '../lib/common';
console.log(lib);

const ta = document.querySelector('textarea');
const container = document.querySelector('.container');

const button = document.querySelector('button');

function send() {
    const start = performance.now();
    lib
        .sendJSON('/api/echo', JSON.parse(ta.value))
        .then(res => {
            const clone = res.clone();
            clone
                .text()
                .then(console.log);
            return res;
        })
        .then(res => res.json())
        .then(json => {
            const end = performance.now();
            container.innerHTML = `<pre>${JSON.stringify(json, null, 4)}</pre>
        <p>${json.msg}</p>`;
            console.log(`Received json ${JSON.stringify(json, null, 4)} in ${end - start}ms`);
        });
}

ta.addEventListener('change', send);
button.addEventListener('click', send);