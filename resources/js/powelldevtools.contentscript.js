(function(chrome, localStorage, sessionStorage, document) {
    var deepClearCache = function(cacheHandler) {
        cacheHandler._keys.forEach(function(key) {
            delete key;
        });
    }

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method == "powDevTools.clearStorage")
                localStorage.clear();
            if (localStorage._keys && localStorage._keys.length > 0) {
                deepClearCache(localStorage);
            }
            sessionStorage.clear();
            if (sessionStorage._keys && sessionStorage._keys.length > 0) {
                deepClearCache(sessionStorage);
            }
            sendResponse(true);
        });

    var actualCode = '(' + function(angular) {
        angular.module('app')
            .config(["$provide", function($provide) {
                $provide.decorator("$templateCache", ["$delegate", function($delegate) {
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
            }]);
    } + ')(window.angular);';
    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
})(window.chrome, window.localStorage, window.sessionStorage, window.document);