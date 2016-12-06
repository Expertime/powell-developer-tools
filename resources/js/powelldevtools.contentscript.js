(function(chrome, localStorage, sessionStorage, document) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method == "powDevTools.clearStorage")
                localStorage.clear();
                sessionStorage.clear();
                sendResponse(true);
        });

    var actualCode = '(' + function(angular) {
        angular.module('app')
            .config(["$provide", function ($provide) {
                $provide.decorator("$templateCache", ["$delegate", function ($delegate) {
                    console.log('OK Delegate');
                    // Stash away the original get method
                    var origPutMethod = $delegate.put;
                    $delegate.templatesArray = []
                    // Replace it with our getter
                    $delegate.put = function (url, content) {
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
    (document.head||document.documentElement).appendChild(script);
    script.remove();
})(window.chrome, window.localStorage, window.sessionStorage, window.document);