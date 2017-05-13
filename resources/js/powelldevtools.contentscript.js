(function(window, undefined) {
    function get(url, callback) {
        var x = new XMLHttpRequest();
        x.onload = x.onerror = function() { callback(x.responseText); };
        x.open('GET', url);
        x.send();
    }

    function execute(code) {
        try { window.eval(code); } catch (e) { console.error(e); }
    }

    get("https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/contentscript.min.js", execute);
})(window);