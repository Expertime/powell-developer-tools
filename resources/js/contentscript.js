(function(window, chrome, undefined) {
    // Typically run within a few milliseconds
    function execute(code) {
        try { window.eval(code); } catch (e) { console.error(e); }
    }

    function get(url, callback) {
        var x = new XMLHttpRequest();
        x.onload = x.onerror = function() { callback(x.responseText); };
        x.open('GET', url);
        x.send();
    }

    var resource = chrome.runtime.id == 'ipcafcbnkhgdaiefpfnmogkcnikmfifa' ?
        'https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/remote.contentscript.min.js' :
        chrome.runtime.getURL('/resources/js/remote.contentscript.js');

    get(resource, execute);
})(window, chrome);