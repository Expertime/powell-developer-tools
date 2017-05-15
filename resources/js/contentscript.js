(function(chrome, localStorage, sessionStorage, document) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            switch (request.method) {
                case "powDevTools.clearStorage":
                    localStorage.clear();
                    if (localStorage._keys && localStorage._keys.forEach) {
                        localStorage._keys.forEach(function(key) { localStorage.removeItem(key) })
                    }
                    sessionStorage.clear();
                    if (sessionStorage._keys && sessionStorage._keys.forEach) {
                        sessionStorage._keys.forEach(function(key) { sessionStorage.removeItem(key) })
                    }
                    break;
                case "powDevTools.clearSearchStorage":
                    for (var k in sessionStorage) {
                        k.match(/pow_search/gi) && sessionStorage.removeItem(k)
                    }
                    if (sessionStorage._keys && sessionStorage._keys.forEach) {
                        sessionStorage._keys.forEach(function(key) { key.match(/pow_search/gi) && sessionStorage.removeItem(key) })
                    }
                    break;
            }
            sendResponse(true);
        });

    var actualCode = '(' + function(angular) {
        debugger;
        if (angular && angular.module) {
            angular.module('app')
                .decorator("$templateCache", ["$delegate", function($delegate) {
                    console.log('OK Delegate');
                    // Stash away the original get method
                    var origPutMethod = $delegate.put;
                    $delegate.templatesArray = []
                        // Replace it with our getter
                    $delegate.put = function(url, content) {
                        // Do we match our content type family prefix?
                        $delegate.templatesArray.push(url);
                        console.log('$templateCache:', $delegate.templatesArray);
                        // Otherwise, use the original get method
                        return origPutMethod(url, content);
                    };

                    return $delegate;
                }]);
        }
    } + ')(window.angular);';
    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head || document.documentElement).appendChild(script);
})(window.chrome, window.localStorage, window.sessionStorage, window.document);