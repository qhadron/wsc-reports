/*global ace*/
import * as lib from '../lib/common';

const left = ace.edit('sqlserver');
left
    .session
    .setMode("ace/mode/sql");

const right = ace.edit('sql');
right
    .session
    .setMode("ace/mode/sql");
right.setReadOnly(true);

left.setOption('wrap', 'free');
right.setOption('wrap', 'free');

left.on('change', e => {
    doConvert();
});

function doConvert() {
    const str = left.getValue();
    lib.sendJSON('/api/convert', {
        q: str
    }, {method: "POST"})
        .then(res => res.text())
        .then(text => right.setValue(text, 0))
        .then(() => {});
}

doConvert();