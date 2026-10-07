const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadPage({ failCopy = false } = {}) {
    let copyDIV;
    let copyHandler;
    const copies = [];
    const sheets = [{ disabled: false }, { disabled: true }];
    const container = { innerHTML: '', appendChild(div) { copyDIV = div; div.parentNode = this; } };
    const row = { childElementCount: 2, childNodes: [{ innerText: 'name' }, { innerText: 'value' }] };
    const rows = { childElementCount: 1, childNodes: [row] };
    function event() {
        const values = {};
        return { values, prevented: false, clipboardData: { setData(type, value) { values[type] = value; } },
            preventDefault() { this.prevented = true; } };
    }
    const document = {
        styleSheets: sheets,
        querySelector() { return {}; },
        getElementById(id) { return id === 'CopyDIV' ? copyDIV : container; },
        createElement() { return { childNodes: [{ childNodes: [rows] }], remove() { copyDIV = undefined; } }; },
        createRange() { return { selectNode() {} }; },
        addEventListener(type, handler) { if (type === 'copy') copyHandler = handler; },
        execCommand() {
            if (failCopy) throw new Error('Copy is unavailable');
            const e = event(); copyHandler(e); copies.push(e); return true;
        }
    };
    const context = vm.createContext({ document, window: { getSelection() {
        return { removeAllRanges() {}, addRange() {} };
    } }, console: { log() {}, error() {} }, ClassicEditor: { create() { return Promise.resolve({}); } } });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/functions.js'), 'utf8'), context);
    return { copy() { const e = event(); copyHandler(e); return e; },
        format() { context.copyFormatted({}, '<table><tr><th>name</th><th>value</th></tr></table>'); }, copies, sheets };
}

test('ordinary copy works before any table has been formatted', () => {
    const page = loadPage();
    const e = page.copy();
    assert.equal(e.prevented, false);
    assert.deepEqual(e.values, {});
});

test('ordinary copy is not replaced by the last formatted table', () => {
    const page = loadPage(); page.format();
    const e = page.copy();
    assert.equal(e.prevented, false);
    assert.deepEqual(e.values, {});
});

test('both intentional table-copy commands retain Markdown and rich text', () => {
    const page = loadPage(); page.format();
    assert.equal(page.copies.length, 2);
    for (const e of page.copies) {
        assert.equal(e.prevented, true);
        assert.match(e.values['text/plain'], /\|\*\*name\*\*\|value\|\n\|:-\|:-\|/);
        assert.match(e.values['text/plain'], /ExcelToReddit/);
        assert.match(e.values['text/html'], /ExcelToReddit/);
    }
    assert.deepEqual(page.sheets.map(sheet => sheet.disabled), [false, true]);
});

test('failed copy commands do not intercept later copies or change stylesheet state', () => {
    const page = loadPage({ failCopy: true }); page.format();
    const e = page.copy();
    assert.equal(e.prevented, false);
    assert.deepEqual(e.values, {});
    assert.deepEqual(page.sheets.map(sheet => sheet.disabled), [false, true]);
});
