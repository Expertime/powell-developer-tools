(function(window, undefined) {
    console.log(window);
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (!mutation.addedNodes) return

            for (var i = 0; i < mutation.addedNodes.length; i++) {
                // do things to your newly added nodes here
                var node = mutation.addedNodes[i]
                if (node.src && node.src.match(/(?:cdn\.powell-365\.com|powell365-cdn\.azureedge\.net)\/scripts\/Premium\/\d+\/\d+\/\d+\/powell/i)) {
                    // stop watching using:
                    observer.disconnect();

                    function waitUntil(isready, success, error, count, interval) {
                        if (count === undefined) {
                            count = 300;
                        }
                        if (interval === undefined) {
                            interval = 20;
                        }
                        if (isready()) {
                            success();
                            return;
                        }
                        // The call back isn't ready. We need to wait for it
                        setTimeout(function() {
                            if (!count) {
                                // We have run out of retries
                                if (error !== undefined) {
                                    error();
                                }
                            } else {
                                // Try again
                                waitUntil(isready, success, error, count - 1, interval);
                            }
                        }, interval);
                    }
                    waitUntil(function() {
                        return window.angular !== undefined;
                    }, function() {
                        if (window.Config && window.Config.PROPERTIES) {
                            //window.postMessage({ type: "POWELL_DEVELOPER_TOOLS", object: 'CONFIG', data: window.Config }, "*");
                            // window.addEventListener("PassToBackground", function(evt) {
                            //     chrome.runtime.sendMessage(evt.detail);
                            // }, false);
                        }
                        if (window.angular && window.angular.module) {
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
                                        //console.log('$templateCache:', $delegate.templatesArray);
                                        // Otherwise, use the original get method
                                        return origPutMethod(url, content);
                                    };
                                    return $delegate;
                                }]);
                        }
                    });
                }
            }
        });
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
    });
})(window);