(function(chrome, localStorage, sessionStorage) {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method == "powDevTools.clearStorage")
                localStorage.clear();
                sessionStorage.clear();
                sendResponse(true);
        });
})(window.chrome, window.localStorage, window.sessionStorage);