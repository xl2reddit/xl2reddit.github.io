// This function generates an array of all the Excel column letters
function generateExcelColumns() {
    const columns = [];
    let column = '';
    for (let i = 1; i <= 16384; i++) {
        let temp = i;
        column = '';
        while (temp > 0) {
            temp--;
            column = String.fromCharCode(temp % 26 + 65) + column;
            temp = Math.floor(temp / 26);
        }
        columns.push(column);
    }
    return columns;
}

////////////////////////////////// Copy formatted code adapted from https://jsfiddle.net/Loilo/xymhgLjc/4/
// This is the actual copy function.
// It expects an HTML string to copy as rich text.
function copyFormatted(rtjson, html) {
    // Remove CopyDIV if it exists
    try {
        document.getElementById("CopyDIV").remove()
    } catch (error) {
        // do nothing
    }

    // Create an iframe (isolated container) for the HTML
    var container = document.getElementById("container")
    container.innerHTML = "&nbsp;"
    var divToCopy = document.createElement('div')
    divToCopy.id = "CopyDIV"

    divToCopy.innerHTML = html

    container.appendChild(divToCopy)

    // Detect all style sheets of the page
    var activeSheets = Array.prototype.slice.call(document.styleSheets)
        .filter(function(sheet) {
            return !sheet.disabled
        })

    // Copy to clipboard
    window.getSelection().removeAllRanges()

    var range = document.createRange()
    range.selectNode(container)

    window.getSelection().addRange(range)

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copy command 1 was ' + msg + " code = " + successful);
    } catch (err) {
        console.log('Oops, unable to copy');
    }

    for (var i = 0; i < activeSheets.length; i++)
        activeSheets[i].disabled = true

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
        console.log('Oops, unable to copy');
    }

    for (var i = 0; i < activeSheets.length; i++)
        activeSheets[i].disabled = false
}

columnLetters = generateExcelColumns()

document.querySelector('#copy').onclick = function() {
    var contents = window.editor.getData()
    var div = document.getElementById("copy-space")

    div.innerHTML = contents

    table = div.getElementsByTagName("table")[0]

    if (!table) {
        // Check if the clipboard contains a broken Excel range paste
        const pattern = /.*\|\| \|\| \|[^|]*?/;
        if (pattern.test(contents.trim())) {
            function convertToHTMLTable(inputText) {
				// Remove leading '<p>|| ||'
				trimmedInputText = inputText.replace(/^.*\|\| \|\| \|(.*) \|[^|]*?$/,'$1');
				
                // Split the input text by rows (using newline as a separator)
                const rows = trimmedInputText.split(/\|\s\|/);

                // Create the table HTML structure
                let tableHTML = '<table>';

                // Loop through each row
                rows.forEach(row => {
                    const cells = row.split(/\|/); // Split by columns
                    tableHTML += '<tr>'; // Start a new row
                    cells.forEach(cell => {
                        tableHTML += `<td>${cell.trim()}</td>`; // Add each cell
                    });
                    tableHTML += '</tr>'; // End the row
                });

                tableHTML += '</table>'; // Close the table
				editor.setData(tableHTML);	// Replace editor text area with reformatted table
                return tableHTML;
            }
            html = convertToHTMLTable(contents);

			// Create a temporary container to manipulate the HTML
			let tableContainer = document.createElement("div");
			tableContainer.innerHTML = html; // Load the table HTML
            table = tableContainer.querySelector('table');
        } else {
            alert("No table found")
            return
        }
    }

	// Insert row numbers and column headings?
    if (document.getElementById("rowsAndColumns").checked) {
        // insert columns
        var numCols = table.childNodes[0].childNodes[0].childElementCount;
        var row = table.insertRow(0);
        row.innerHTML = ""

        // Get address of upper left cell
        upperLeftCell = document.getElementById("cellAddress").value.toUpperCase();
        startColumn = upperLeftCell.match(/[A-Z]+/);
        startColumnIndex = columnLetters.indexOf(startColumn[0]);
        startRow = upperLeftCell.match(/[0-9]+/)[0] * 1

        // Add column letters as headers
        for (var i = 0; i < numCols; i++) {
            row.innerHTML += "<th><b>" + columnLetters[startColumnIndex + i] + "</b></th>"
        }

        for (var i = 0; i < table.childNodes[0].childElementCount; i++) {
            // Insert row number column
            var x = table.childNodes[0].childNodes[i].insertCell(0);
            // If first row, then change element to <th> and put a +
            if (i == 0) {
                x.outerHTML = "<th><b>+</b></th>"
            } else {
                x.innerHTML = "<b>" + (i - 1 + startRow) + "</b>"
            }
        }
    }

	var animatedClone = this.cloneNode(true)
	animatedClone.classList.add('fading')
	animatedClone.addEventListener('animationend', function() {
		animatedClone.parentNode.removeChild(animatedClone)
	})
	this.parentNode.appendChild(animatedClone)

	// Set up the message popup
	const popup = document.getElementById('popup');

	popup.style.display = 'block';

	// Hide after 5 seconds
	setTimeout(() => {
		popup.style.display = 'none';
		}, 5000);

    result = tableToJson(table) 

    contents = "<table>" + table.innerHTML + "</table>"

    function convertFirstRowToTh(tableHtml) {
        // Create a temporary container to manipulate the HTML
        let tempContainer = document.createElement("div");
        tempContainer.innerHTML = tableHtml; // Load the table HTML

        // Select the first row
        let firstRow = tempContainer.querySelector("tr");

        if (firstRow) {
            firstRow.querySelectorAll("td").forEach(td => {
                let th = document.createElement("th");
                th.innerHTML = td.innerHTML; // Copy content
                td.replaceWith(th); // Replace <td> with <th>
            });
        }

        // Return the modified HTML as a string
        return tempContainer.innerHTML;
    }

    let contents_th = convertFirstRowToTh(contents);
    copyFormatted(result, contents_th)
}

// Create nice animation on refresh ("X") button click
document.querySelector('#refresh').onclick = function() {
    var animatedClone = this.cloneNode(true)
    animatedClone.classList.add('fading')
    animatedClone.addEventListener('animationend', function() {
        animatedClone.parentNode.removeChild(animatedClone)
    })
    this.parentNode.appendChild(animatedClone)

    var contents = window.editor.setData("")
}

///////////////////// End copy formatted code from https://jsfiddle.net/Loilo/xymhgLjc/4/

// The code triggers when a copy event fires
// This is needed to be able to call the setData method

document.addEventListener('copy', function(e) {
    var textString = '';
    var data = e.clipboardData;
    var copyDIV = document.getElementById("CopyDIV");

    var trList = copyDIV.childNodes[0].childNodes[0];

    for (var i = 0; i < trList.childElementCount; i++) {
        // Insert row number column
        var formatting = '';
        for (var j = 0; j < trList.childNodes[i].childElementCount; j++) {
            textString += '|' + (j==0?'**':'') + trList.childNodes[i].childNodes[j].innerText.replace(/([\[\]\*\^\`\~])/g, '\\$1') + (j==0?'**':'');
            formatting += '|:-'; // align left
        }
        textString += '|\n';
        if (i == 0) {
            textString += formatting + '|\n';
        }
    }

    textString += '\n^Table ^formatting ^by ^[ExcelToReddit](https://xl2redd.it/)\n'

    var htmlString = copyDIV.parentNode.innerHTML;
    var htmlFooter = '<p class="first:mt-0 last:mb-0" dir="ltr"><sup style="white-space: pre-wrap;"><span>Table</span></sup><span style="white-space: pre-wrap;"> </span><sup style="white-space: pre-wrap;"><span>formatting</span></sup><span style="white-space: pre-wrap;"> </span><sup style="white-space: pre-wrap;">by</span></sup><span style="white-space: pre-wrap;"> </span><a href="https://xl2redd.it/"><sup style="white-space: pre-wrap;"><span>ExcelToReddit</span></sup></a></p>'
    data.setData('text/plain', textString);
    data.setData('text/html', htmlString + htmlFooter);
    e.preventDefault();
});

function tableToJson(table) {
    var blocks = [];

    // go through cells
    for (var i = 0; i < table.rows.length; i++) {
        var tableRow = table.rows[i];

        var block = {};
        var colCount = tableRow.cells.length
        for (var j = 0; j < colCount; j++) {
            var text = tableRow.cells[j].innerText
            var key = Math.random().toString(36).substring(2, 7) // generate a 5 character random key
            block = {
                "key": key,
                "text": text,
                "type": "table-cell",
                "depth": 0,
                "inlineStyleRanges": [],
                "entityRanges": [],
                "data": {
                    "colCount": colCount,
                    "colIndex": j,
                    "rowIndex": i
                }
            }

            blocks.push(block)
        }
    }

    blocks.push({
        "key": "ei81j",
        "text": "Table formatting brought to you by ExcelToReddit",
        "type": "unstyled",
        "inlineStyleRanges": [{
            "offset": 0,
            "length": 5,
            "style": "SUPERSCRIPT"
        }, {
            "offset": 6,
            "length": 10,
            "style": "SUPERSCRIPT"
        }, {
            "offset": 17,
            "length": 7,
            "style": "SUPERSCRIPT"
        }, {
            "offset": 25,
            "length": 2,
            "style": "SUPERSCRIPT"
        }, {
            "offset": 28,
            "length": 3,
            "style": "SUPERSCRIPT"
        }, {
            "offset": 32,
            "length": 2,
            "style": "SUPERSCRIPT"
        }, {
            "offset": 35,
            "length": 13,
            "style": "SUPERSCRIPT"
        }],
        "entityRanges": [{
            "offset": 35,
            "length": 13,
            "key": 0
        }],
        "data": {}
    })

    var fullObject = {
        "entityMap": {
            "0": {
                "type": "LINK",
                "mutability": "MUTABLE",
                "data": {
                    "url": "https://xl2reddit.github.io/"
                }
            }
        },
        "blocks": blocks
    }

    return JSON.stringify(fullObject)
}

// Create the ckeditor 5 instance
ClassicEditor
    .create(document.querySelector('#editor'), {
        // toolbar: [ 'heading', '|', 'bold', 'italic', 'link' ]
        toolbar: []
    })
    .then(editor => {
        window.editor = editor;
    })
    .catch(err => {
        console.error(err.stack);
    });