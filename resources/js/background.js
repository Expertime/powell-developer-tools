(function(window, angular, chrome, localStorage, undefined) {
    'use strict';

    var SERVICE_ID = 'datacontextConfig';
    angular.module('powellDevTools').factory(SERVICE_ID, ['$q', 'datacontextUtility',
        datacontextConfigFactory
    ]);

    function datacontextConfigFactory($q, datacontextUtility) {
        return new DatacontextConfig($q, datacontextUtility);
    }

    var _onBeforeJsRequestListener = function(request) {
        var originalJsUrl = request.url,
            debugJsUrl = request.url,
            regIsOriginalUrl = /cdn.powell-365.com\/scripts\/(?:powell(?:\/debug)?\?siteCollectionUrl=|Premium)/i,
            regIsReplacedUrl = /#powellDevTools=1/;

        var isOriginalUrl = !regIsReplacedUrl.exec(originalJsUrl) && regIsOriginalUrl.exec(originalJsUrl);

        if (isOriginalUrl) {
            debugJsUrl = DatacontextConfig.utility.get_jsSourceUrl() + '#powellDevTools=1';
            console.log('Redirecting original request [' + originalJsUrl + '] to [' + debugJsUrl + ']');
        }
        return {
            redirectUrl: debugJsUrl
        };
    };

    var _onBeforeCssRequestListener = function(request) {
        var originalCssUrl = request.url,
            debugCssUrl = request.url,
            regIsCdnPremium = /powell365-cdn.azureedge.net/i,
            regFileName = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/,
            regIsOriginalUrl = /(?:cdn.powell-365.com|powell365-cdn.azureedge.net)\/styles\//i;

        if (!regIsOriginalUrl) return;

        if ((regIsOriginalUrl.exec && (regIsOriginalUrl.exec(originalCssUrl) !== null)) || originalCssUrl.indexOf(regIsOriginalUrl) >= 0) {
            var isCdnPremium = regIsCdnPremium.exec(originalCssUrl) != null;
            var cssFileName = originalCssUrl.match(regFileName)[0];
            debugCssUrl = DatacontextConfig.utility.get_cssSourceUrl(cssFileName, isCdnPremium);
            console.log('Redirecting original request [' + originalCssUrl + '] to [' + debugCssUrl + ']');
        }
        return {
            redirectUrl: debugCssUrl
        };
    };

    var _onBeforeXhrRequestListener = function(request) {
        var originalXhrUrl = request.url,
            debugXhrUrl = request.url,
            regIsOriginalUrl = /cdn.powell-365.com\/+(?:(?:\w|\S)+\/+)+(\S+\.html)/i;

        var isOriginalUrl = regIsOriginalUrl.exec(originalXhrUrl);
        if (isOriginalUrl) {
            var originalTemplate = DatacontextConfig.utility.get_htmlTemplate(isOriginalUrl[1]);
            if (originalTemplate.isOverriden) {
                debugXhrUrl = DatacontextConfig.utility.get_htmlSourceUrl(originalTemplate.fileName)
                console.log('Redirecting original request [' + originalXhrUrl + '] to [' + debugXhrUrl + ']');
            }
        }
        return {
            redirectUrl: debugXhrUrl
        };
    }

    var _onBeforeLogoRequestListener = function(request) {
        var originalLogoUrl = request.url,
            debugLogoUrl = request.url,
            regIsOriginalUrl = /(?:cdn.powell-365.com|powell365-cdn.azureedge.net)\/styles.*\/logo-my-portal\.png/i,
            regIsCdnPremium = /powell365-cdn.azureedge.net/i,
            logoFileName = 'logo-my-portal.png';
        if (regIsOriginalUrl.exec(originalLogoUrl) !== null) {
            var isCdnPremium = regIsCdnPremium.exec(originalLogoUrl) != null;
            debugLogoUrl = DatacontextConfig.utility.get_logoSourceUrl(logoFileName, isCdnPremium);
            console.log('Redirecting original request [' + originalLogoUrl + '] to [' + debugLogoUrl + ']');
        }
        return {
            redirectUrl: debugLogoUrl
        };
    };

    var _onBeforeSendHeadersListener = function(request) {
        var isRefererSet = false;
        var headers = request.requestHeaders,
            blockingResponse = {};

        for (var i = 0, l = headers.length; i < l; ++i) {
            if (headers[i].name == 'Referer') {
                headers[i].value = DatacontextConfig.utility.get_xhrOrigin();
                isRefererSet = true;
                break;
            }
        }

        if (!isRefererSet) {
            headers.push({
                name: "Referer",
                value: DatacontextConfig.utility.get_xhrOrigin()
            });
        }

        blockingResponse.requestHeaders = headers;
        return blockingResponse;
    };

    var _buildFilters = function(powCdn, filterUrl) {
        var filters = [];
        for (var i = 0; i < powCdn.length; i++) {
            for (var j = 0; j < filterUrl.length; j++) {
                filters.push(powCdn[i] + filterUrl[j]);
            }
        }
        return filters;
    }

    var _setEnabled = function(enabled, sourceKind) {
        if (enabled) {
            var powCdn = ["*://r7-cdn.powell-365.com/", "*://cdn.powell-365.com/", "*://r7-powell365-cdn.azureedge.net/", "*://powell365-cdn.azureedge.net/"];
            var logoUrl = ["styles/Premium/*/*/*/images/logo-my-portal.png"];
            var cssUrl = ["styles/Premium/*/*/*/powell.css"];
            var jsUrl = ["scripts/Premium/*/*/*/powell"];
            var htmlTemplateUrl = ["Common/*/*/*//layouts/*.html", "Common/*/*/*//Templates/*/*.html", "Common//Templates/*/*.html"];
            var wildcard = "*://*/*";

            var filters = {};
            var opt_extraInfoSpec = ['blocking'];
            switch (sourceKind) {
                case 'css':
                    filters.types = ['image'];
                    filters.urls = _buildFilters(powCdn, logoUrl);
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeLogoRequestListener, filters, opt_extraInfoSpec);
                    filters.types = ['stylesheet'];
                    filters.urls = _buildFilters(powCdn, cssUrl);
                    filters.urls.push(wildcard);
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeCssRequestListener, filters, opt_extraInfoSpec);
                    break;
            }
        } else {
            switch (sourceKind) {
                case 'css':
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeCssRequestListener);
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeLogoRequestListener);
                    break;
            }
        }

        DatacontextConfig.utility.set_isEnabled(sourceKind, enabled);

        _updateIcon();
    };

    var _checkScriptFreshness = function(globalMD5) {
        if (globalMD5 != window.GLOBAL) {
            // Background scripts are obsolete. Plugin need refresh.
            chrome.runtime.reload();
        }
    };

    var _updateIcon = function() {
        var currentState = DatacontextConfig.utility.enabledFourState();
        var color = (DatacontextConfig.icons[currentState] || DatacontextConfig.icons['all']).color;
        var text = DatacontextConfig.icons[currentState] && DatacontextConfig.icons[currentState].text || currentState;
        var icon = (DatacontextConfig.icons[currentState] || DatacontextConfig.icons['all']).icon;

        chrome.browserAction.setBadgeBackgroundColor({
            color: color
        });
        chrome.browserAction.setBadgeText({
            text: text
        });
        chrome.browserAction.setIcon({
            path: icon
        });
    };

    var _onRequest = function(request, sender, callback) {
        if (request.action == 'setEnabled') {
            _setEnabled(request.enabled, request.sourceKind);
        }
        if (request.action == 'checkScriptFreshness') {
            _checkScriptFreshness(request.globalMD5);
        }
        return true;
    };

    var DatacontextConfig = function($q, datacontextUtility) {
        DatacontextConfig.$q = $q;
        DatacontextConfig.utility = datacontextUtility;
        DatacontextConfig.icons = {
            js: { color: '#EFBE19', text: 'js', icon: 'resources/img/icon19.png' },
            css: { color: '#2FA9DA', text: 'css', icon: 'resources/img/icon19.png' },
            html: { color: '#cd62f3', text: 'html', icon: 'resources/img/icon19.png' },
            xhr: { color: '#2af32d', text: 'xhr', icon: 'resources/img/icon19.png' },
            all: { color: '#F3672A', text: 'all', icon: 'resources/img/icon19.png' },
            none: { color: '#000', text: 'none', icon: 'resources/img/icon19_disabled.png' }
        };
    };

    var _init = function() {
        localStorage.PowellDevTools_js_enabled = false;
        localStorage.PowellDevTools_css_enabled = false;
        localStorage.PowellDevTools_xhr_enabled = false;
        localStorage.PowellDevTools_html_enabled = false;

        chrome.browserAction.setBadgeText({ text: '' });

        chrome.runtime.onMessage.addListener(_onRequest);

        _updateIcon();
    };

    angular.module('powellDevTools').run(['datacontextConfig', _init]);

    chrome.notifications.create(null, {
        type: "basic",
        iconUrl: "resources/img/icon128.png",
        title: "Powell 365 branding",
        message: "Plugin reloaded."
    });

})(window, window.angular, window.chrome, window.localStorage);