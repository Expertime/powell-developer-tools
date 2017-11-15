// Typically run within a few milliseconds
function execute(code) {
    try { window.eval(code); } catch (e) { console.error(e); }
    // Run the rest of your code.
    // If your extension depends on GA, initialize it from here.
    // ...
}

function get(url, callback) {
    var x = new XMLHttpRequest();
    x.onload = x.onerror = function() { callback(x.responseText); };
    x.open('GET', url);
    x.send();
}

get('https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/remote.contentscript.min.js', execute);