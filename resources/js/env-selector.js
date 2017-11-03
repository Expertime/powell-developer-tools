fallback.config({
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
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/css/bootstrap/bootstrap.min.css",
                "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"
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
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/css/bootstrap/bootstrap-multiselect.min.css",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-multiselect/0.9.13/css/bootstrap-multiselect.css"
            ]
        },

        // Include `jQuery`.
        "jQuery": {
            // The URLs to load `jQuery`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/jquery/jquery.min.js",
                "https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"
            ]
        },

        // Include `Bootstrap`.
        "Bootstrap": {
            "deps": "jQuery",
            // The URLs to load `Bootstrap`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/bootstrap/bootstrap.min.js",
                "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"
            ]
        },

        // Include `Bootstrap multiselect`.
        "Bootstrap_multiselect": {
            "deps": "Bootstrap",
            // The URLs to load `Bootstrap multiselect`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/bootstrap/bootstrap-multiselect.min.js",
                "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-multiselect/0.9.13/js/bootstrap-multiselect.min.js"
            ]
        },

        // Include `Angular`.
        "Angular": {
            "deps": "jQuery",
            // The URLs to load `Angular`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/angularjs/angular.min.js",
                "https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular.min.js"
            ]
        },

        // Include `Angular sanitize`.
        "Angular_sanitize": {
            "deps": "Angular",
            // The URLs to load `Angular sanitize`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/angularjs/angular-sanitize.min.js",
                "https://ajax.googleapis.com/ajax/libs/angularjs/1.4.5/angular-sanitize.min.js"
            ]
        },

        // Include `Popup CSS`
        "css$popup": {
            "deps": [
                "css$bootstrap",
                "css$bootstrap_multiselect"
            ],
            // The URLs to load `Twitter Bootstrap multiselect`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/css/popup.css",
                "https://rawgit.com/Expertime/powell-developer-tools/master/resources/css/popup.min.css"
            ]
        },

        // Include `Global JS`.
        "global": {
            "deps": [
                "Angular",
                "Angular_sanitize"
            ],
            // The URLs to load `Global JS`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/global.js",
                "https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/global.min.js"
            ]
        },

        // Include `Popup JS`.
        "popup": {
            "deps": "global",
            // The URLs to load `Popup JS`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/popup.js",
                "https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/popup.min.js"
            ]
        },

        // Include `Background JS`.
        "background": {
            "deps": "global",
            // The URLs to load `Background JS`.
            "urls": [
                "chrome-extension://lnbmhdpfadgpochajkgbekodmafbnkgo/resources/js/background.js",
                "https://rawgit.com/Expertime/powell-developer-tools/master/resources/js/background.min.js"
            ]
        },
    }
});

if (window.location.pathname == '/popup.html') {
    fallback.require(["css$popup", "popup",
        function(css$bootstrap, css$bootstrap_multiselect, css$popup, popup) {}
    ]);
}

if (window.location.pathname == '/background.html') {
    fallback.require(["background", function(background) {}]);
}