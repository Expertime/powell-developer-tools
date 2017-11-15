(function(window, chrome, localStorage, sessionStorage, document, undefined) {

    /******************************************
     * Inject powelldevtools.contentscript.js
     ******************************************/


    if (document.head || document.documentElement)
        injectContentScript();
    else
        document.addEventListener("DOMContentLoaded", injectContentScript);

    function injectContentScript() {
        var s = document.createElement('script');
        var resource = chrome.runtime.id == 'ipcafcbnkhgdaiefpfnmogkcnikmfifa' ?
            'https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/powelldevtools.contentscript.min.js' :
            chrome.runtime.getURL('/resources/js/powelldevtools.contentscript.js');
        s.src = resource;
        s.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(s);
    }

    /********************************************
     * Listen to messages from the page context
     ********************************************/
    // window.postMessage({ type: "POWELL_DEVELOPER_TOOLS", object: 'CONFIG', data: window.Config }, "*");
    // var port = chrome.runtime.connect();

    // window.addEventListener("message", function(event) {
    //     // We only accept messages from ourselves
    //     if (event.source != window || event.data.type != 'POWELL_DEVELOPER_TOOLS')
    //         return;

    //     switch (event.data.object) {
    //         case "CONFIG":
    //             // port.postMessage(event.data.text);
    //             chrome.runtime.sendMessage(event.data,
    //                 function(response) {
    //                     if (!response && chrome.runtime.lastError) {
    //                         deferred.reject(chrome.runtime.lastError);
    //                     } else {
    //                         deferred.resolve(response);
    //                     }
    //                 });
    //             break;
    //     }
    // }, false);

    /*************************************************
     * Listen to messages from other extension pages
     *************************************************/

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch (request.method) {
                case "powDevTools.clearStorage":
                    localStorage.clear();
                    console.log('Local storage cleared !');
                    if (localStorage._keys && localStorage._keys.forEach) {
                        localStorage._keys.forEach(function(key) { localStorage.removeItem(key) })
                        console.log('Session box - Local storage cleared !');
                    }
                    sessionStorage.clear();
                    console.log('Session storage cleared !');
                    if (sessionStorage._keys && sessionStorage._keys.forEach) {
                        sessionStorage._keys.forEach(function(key) { sessionStorage.removeItem(key) })
                        console.log('Session box - Session storage cleared !');
                    }
                    break;
                case "powDevTools.clearSearchStorage":
                    var nk = 0
                    for (var k in sessionStorage) {
                        k.match(/pow_search/gi) && sessionStorage.removeItem(k);
                        nk++;
                    }
                    console.log('Search storage cleared ! (' + nk + ' keys deleted)');
                    if (sessionStorage._keys && sessionStorage._keys.forEach) {
                        nk = 0;
                        sessionStorage._keys.forEach(function(key) { key.match(/pow_search/gi) && nk++ && sessionStorage.removeItem(key) })
                        console.log('Session box - Search storage cleared ! (' + nk + ' keys deleted)');
                    }
                    break;
            }
            sendResponse(true);
        });
})(window, window.chrome, window.localStorage, window.sessionStorage, window.document);