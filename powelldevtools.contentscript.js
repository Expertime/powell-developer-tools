(function(chrome, localStorage) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method == "powDevTools.clearStorage")
                localStorage.clear();
                sendResponse(true);
        });
})(window.chrome, window.localStorage);