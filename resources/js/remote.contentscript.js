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
            'https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools@latest/resources/js/powelldevtools.contentscript.min.js' :
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

    /*******************************************
     * Get SharePoint Resource by name and key
     *******************************************/

    function getResource(resourceName, resourceKey) {
        return new Promise((resolve, reject) => {
            getInstalledLanguages().then((languages) => {
                let promises = [];
                let results = {};
                languages.forEach(language => {
                    promises.push(getResourceValue(resourceName, resourceKey, language));
                });

                Promise.all(promises).then(values => {
                    values.forEach((value) => {
                        results[value.Lcid] = value.Value;
                    });

                    // Output
                    resolve(JSON.stringify(results));
                });
            });
        });
    }

    function getInstalledLanguages() {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", window.location.origin + '/_api/SP.ServerSettings.getGlobalInstalledLanguages(15)');
            xhr.setRequestHeader("Accept", "application/json");

            xhr.onload = () => {
                const response = JSON.parse(xhr.responseText);
                resolve(response.value);
            };

            xhr.onerror = () => {
                reject();
            };

            xhr.send();
        });
    }

    function getResourceValue(resourceName, resourceKey, language) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `${window.location.origin}/_layouts/15/ScriptResx.ashx?culture=${language.LanguageTag}&name=${resourceName}`);

            xhr.onload = () => {
                let standardOutput = {
                    'Lcid': language.Lcid,
                    'Value': ''
                };

                const regex = new RegExp(resourceKey + ":'(.*?)'", 'gi');
                const matches = xhr.responseText.match(regex);
                if (matches && matches.length > 0) {
                    const regexResourceValue = new RegExp("'(.*?)'", 'gi');
                    const values = matches[0].match(regexResourceValue);
                    if (values && values.length > 0) {
                        let resourceValue = values[0].replace(/^'/g, '');
                        resourceValue = resourceValue.replace(/'$/g, '');
                        resolve({
                            'Lcid': language.Lcid,
                            'Tag': language.LanguageTag,
                            'Value': resourceValue
                        });
                    } else
                        resolve(standardOutput);
                } else
                    resolve(standardOutput);
            };

            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });
    }

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
                    sendResponse(true);
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
                    sendResponse(true);
                    break;
                case "powDevTools.getResourceValues":
                    var name = request.data.name;
                    var key = request.data.key;
                    getResource(name, key).then((results) => {
                        sendResponse(results);
                    });
                    return true;
            }
        });
})(window, window.chrome, window.localStorage, window.sessionStorage, window.document);