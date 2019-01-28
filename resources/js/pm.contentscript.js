(function(window, document, chrome, undefined) {
    function get(url, callback) {
        var th = document.querySelector('head');
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', url);
        s.addEventListener('load', callback);
        th.appendChild(s);
    }

    function request(url) {
        var promise = new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();

            request.onreadystatechange = function () {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        resolve(this.responseText);
                    } else {
                        reject(this.status + '\n' + this.statusText);
                    }
                }
            };

            request.open('GET', url, true);

            request.setRequestHeader('accept', "application/json");
            request.setRequestHeader("content-type", "application/json;charset=UTF-8");

            request.send();
        });
        return promise;
    }

    var requires = [
        'https://cdn.jsdelivr.net/gh/SheetJS/js-xlsx/dist/xlsx.full.min.js',
        'https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/js/lodash/lodash.custom.min.js',
        chrome.runtime.id == 'ipcafcbnkhgdaiefpfnmogkcnikmfifa' ?
            'https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/js/remote.pm.contentscript.min.js' :
            chrome.runtime.getURL('/resources/js/remote.pm.contentscript.js')
    ];

    var inlineTemplate = document.createElement('script');
    inlineTemplate.setAttribute('type', 'text/ng-template');
    inlineTemplate.setAttribute('id', 'resourcesManager.html');
    
    var resourcesManagerTemplateUrl;
    if (chrome.runtime.id == 'ipcafcbnkhgdaiefpfnmogkcnikmfifa') {
        // For production mode //     
        resourcesManagerTemplateUrl = 'https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/html/ResourcesManager.html';
    } else {
        // For debugging mode //
        resourcesManagerTemplateUrl = chrome.runtime.getURL('/resources/html/ResourcesManager.html');
    }
    
    var resourcesManagerTemplateContentPromise = request(resourcesManagerTemplateUrl);

    function loadRequires(requireQueue) {
        var require = requireQueue.shift();
        get(require, function(requireCode) {
            // execute(requireCode);
            if (requireQueue && requireQueue.length > 0) {
                loadRequires(requireQueue);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.querySelector('html').removeAttribute('data-ng-app');

        resourcesManagerTemplateContentPromise.then((result) => {
            inlineTemplate.innerHTML = result;
            document.querySelector('head').appendChild(inlineTemplate);
        });
        loadRequires(requires);
    });
})(window, window.document, chrome);