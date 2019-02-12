var currentId = chrome.runtime.id;
if (currentId === 'ipcafcbnkhgdaiefpfnmogkcnikmfifa') {
    currentId = 'fakeID';
}

fallback.config({
    "debug": true,
    // The list of libraries that we want use for our project.
    "libs": {
        // Include `Twitter Bootstrap`.
        // We explicity prefix `css to the beginning of our key so Fallback JS
        // knows to load this library as a Cascading Stylesheet (CSS).
        "css$bootstrap": {
            // Fallback JS will check to see if this style currently exists on the
            // page. If it does exist, the library will not attempt to load the file
            // as it will assume it's already been loaded on the page.
            "exports": ".col-xs-12",
            "deps": "Bootstrap",
            // The URLs to load `Twitter Bootstrap`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/css/bootstrap/bootstrap.min",
                "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min"
            ]
        },

        "css$bootstrap_multiselect": {
            // Fallback JS will check to see if this style currently exists on the
            // page. If it does exist, the library will not attempt to load the file
            // as it will assume it's already been loaded on the page.
            "exports": ".multiselect-container",
            "deps": "Bootstrap_multiselect",
            // The URLs to load `Twitter Bootstrap multiselect`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/css/bootstrap/bootstrap-multiselect.min",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-multiselect/0.9.13/css/bootstrap-multiselect"
            ]
        },

        // Include `jQuery`.
        "jQuery": {
            // The URLs to load `jQuery`.
            "exports": ["jQuery", "$"],
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/jquery/jquery.min",
                "https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min"
            ]
        },

        // Include `Bootstrap`.
        "Bootstrap": {
            "deps": "jQuery",
            // The URLs to load `Bootstrap`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/bootstrap/bootstrap.min",
                "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min"
            ]
        },

        // Include `Bootstrap multiselect`.
        "Bootstrap_multiselect": {
            "deps": "Bootstrap",
            // The URLs to load `Bootstrap multiselect`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/bootstrap/bootstrap-multiselect.min",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-multiselect/0.9.13/js/bootstrap-multiselect.min"
            ]
        },

        // Include `Angular`.
        "Angular": {
            "deps": "jQuery",
            "exports": ["angular"],
            // The URLs to load `Angular`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/angularjs/angular.min",
                "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular.min"
            ]
        },

        // Include `Angular resource`.
        "Angular_resource": {
            "deps": "Angular",
            "check": () => {
                try {
                    angular.module("ngResource"); 
                } catch (err) {
                    return false;
                }
                return true;
            },
            // The URLs to load `Angular resource`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/angularjs/angular-resource.min",
                "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular-resource.min"
            ]
        },

        // Include `Angular sanitize`.
        "Angular_sanitize": {
            "deps": "Angular",
            "check": () => {
                try {
                    angular.module("ngSanitize"); 
                } catch (err) {
                    return false;
                }
                return true;
            },
            // The URLs to load `Angular sanitize`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/angularjs/angular-sanitize.min",
                "https://ajax.googleapis.com/ajax/libs/angularjs/1.6.2/angular-sanitize.min"
            ]
        },

        // Include `Popup CSS`
        "css$popup": {
            "exports": ".app-vers",
            "deps": [
                "css$bootstrap",
                "css$bootstrap_multiselect"
            ],
            // The URLs to load `Twitter Bootstrap multiselect`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/css/popup",
                "https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/css/popup.min",
                "https://gitcdn.link/repo/Expertime/powell-developer-tools/master/resources/css/popup.min"
            ]
        },

        // Include `Global JS`.
        "global": {
            "deps": [
                "Angular",
                "Angular_sanitize",
                "Angular_resource"
            ],
            "exports": ["PDT_GLOBAL"],
            // The URLs to load `Global JS`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/global",
                "https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/js/global.min",
                "https://gitcdn.link/repo/Expertime/powell-developer-tools/master/resources/js/global.min"
            ]
        },

        // Include `Popup JS`.
        "popup": {
            "deps": "global",
            "check": () => 
                angular.module('powellDevTools')._invokeQueue.some((invokedElement) => {
                    return invokedElement[1] === 'register' && invokedElement[2][0] === 'ConfigController';
                }),
            // The URLs to load `Popup JS`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/popup",
                "https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/js/popup.min",
                "https://gitcdn.link/repo/Expertime/powell-developer-tools/master/resources/js/popup.min"
            ]
        },

        // Include `Background JS`.
        "background": {
            "deps": "global",
            "check": () => 
                angular.module('powellDevTools')._invokeQueue.some((invokedElement) => {
                    return invokedElement[1] === 'factory' && invokedElement[2][0] === 'datacontextConfig';
                }),
            // The URLs to load `Background JS`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/background",
                "https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/js/background.min",
                "https://gitcdn.link/repo/Expertime/powell-developer-tools/master/resources/js/background.min"
            ]
        },

        // Include `BingTranslate JS`.
        "BingTranslate": {
            "deps": [
                "jQuery",
                "css$popup"
            ],
            // The URLs to load `BingTranslate JS`.
            "urls": [
                "chrome-extension://" + currentId + "/resources/js/bingtranslate/bing",
                "https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/js/bingtranslate/bing.min",
                "https://gitcdn.link/repo/Expertime/powell-developer-tools/master/resources/js/bingtranslate/bing.min"
            ]
        },
    }
});

if (window.location.pathname == '/popup.html') {
    fallback.require(["css$popup", "popup"],
        function(css$bootstrap, css$bootstrap_multiselect, css$popup, popup) {
            console.log(arguments);
        },
        function(err) {
            console.log(arguments);
        }
    );
}

if (window.location.pathname == '/background.html') {
    fallback.require(["background"], function(background) {
        console.log('OK', background);
    }, function(err) {
        console.log(arguments);
    });
}

if (window.location.pathname.indexOf('BingTranslate.html') > -1) {
    fallback.require(["BingTranslate"], function(BingTranslate) {
        console.log('OK', BingTranslate);
    }, function(err) {
        console.log(arguments);
    });
}