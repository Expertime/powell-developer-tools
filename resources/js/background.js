(function (window, angular, chrome, localStorage, undefined) {
    'use strict';

    var SERVICE_ID = 'datacontextConfig';
    angular.module('powellDevTools').factory(SERVICE_ID, ['$q', 'datacontextUtility',
        datacontextConfigFactory]);
    
    function datacontextConfigFactory($q, datacontextUtility) {
        return new DatacontextConfig($q, datacontextUtility);
    }
    
    var _onBeforeJsRequestListener = function (request) {
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
    
    var _onBeforeCssRequestListener = function (request) {
        var originalCssUrl = request.url,
            debugCssUrl = request.url,
            regIsOriginalUrl = /cdn.powell-365.com\/styles\//i,
            regFileName = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/;
        if (regIsOriginalUrl.exec(originalCssUrl) !== null) {
            var cssFileName = originalCssUrl.match(regFileName)[0];
            debugCssUrl = DatacontextConfig.utility.get_cssSourceUrl(cssFileName);
            console.log('Redirecting original request [' + originalCssUrl + '] to [' + debugCssUrl + ']');
        }
        return {
            redirectUrl: debugCssUrl
        };
    };

    var _onBeforeLogoRequestListener = function (request) {
        var originalLogoUrl = request.url,
            debugLogoUrl = request.url,
            regIsOriginalUrl = /cdn.powell-365.com\/styles.*\/logo-my-portal\.png/i,
            logoFileName = 'logo-my-portal.png';
        if (regIsOriginalUrl.exec(originalLogoUrl) !== null) {
            debugLogoUrl = DatacontextConfig.utility.get_logoSourceUrl(logoFileName);
            console.log('Redirecting original request [' + originalLogoUrl + '] to [' + debugLogoUrl + ']');
        }
        return {
            redirectUrl: debugLogoUrl
        };
    };

    var _onBeforeSendHeadersListener = function (request) {
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
    
    var _setEnabled = function (enabled, sourceKind) {
        if (enabled) {
            var powR7Cdn = "*://r7-cdn.powell-365.com/*";
            var powCdn = "*://cdn.powell-365.com/*";
            var logoUrl = "*://cdn.powell-365.com/styles/Premium/*/*/*/images/logo-my-portal.png";
            var filters = {
                urls: [powR7Cdn, powCdn, logoUrl]
            };
            var opt_extraInfoSpec = ['blocking'];
            switch (sourceKind) {
                case 'js':
                    filters.types = ['script'];
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeJsRequestListener, filters, opt_extraInfoSpec);
                    break;
                case 'css':
                    filters.types = ['stylesheet'];
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeCssRequestListener, filters, opt_extraInfoSpec);
                    filters.types = ['image'];
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeLogoRequestListener, filters, opt_extraInfoSpec);
                    break;
                case 'xhr':
                    filters.types = ['xmlhttprequest'];
                    opt_extraInfoSpec.push('requestHeaders');
                    chrome.webRequest.onBeforeSendHeaders.addListener(_onBeforeSendHeadersListener, filters, opt_extraInfoSpec);
                    break;
            }
        } else {
            switch (sourceKind) {
                case 'js':
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeJsRequestListener);
                    break;
                case 'css':
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeCssRequestListener);
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeLogoRequestListener);
                    break;
                case 'xhr':
                    chrome.webRequest.onBeforeSendHeaders.removeListener(_onBeforeSendHeadersListener);
                    break;
            }
        }

        DatacontextConfig.utility.set_isEnabled(sourceKind, enabled);

        _updateIcon();
    };
    
    var _checkScriptFreshness = function (globalMD5) {
        if (globalMD5 != window.GLOBAL) {
            // Background scripts are obsolete. Plugin need refresh.
            chrome.runtime.reload();         
        }
    };

    var _updateIcon = function () {
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
    
    var _onRequest = function (request, sender, callback) {
        if (request.action == 'setEnabled') {
            _setEnabled(request.enabled, request.sourceKind);
        }
        if (request.action == 'checkScriptFreshness') {
            _checkScriptFreshness(request.globalMD5);
        }
        return true;
    };
    
    var DatacontextConfig = function ($q, datacontextUtility) {
        DatacontextConfig.$q = $q;
        DatacontextConfig.utility = datacontextUtility;
        DatacontextConfig.icons = {
            js: { color: '#EFBE19', text: 'js', icon: 'resources/img/icon19.png'},
            css: { color: '#2FA9DA', text: 'css', icon: 'resources/img/icon19.png'},
            xhr: { color: '#2af32d', text: 'xhr', icon: 'resources/img/icon19.png'},
            all: { color: '#F3672A', text: 'all', icon: 'resources/img/icon19.png' },
            none: { color: '#000', text:'none', icon: 'resources/img/icon19_disabled.png'}
        };
    };
    
    var _init = function () {
        localStorage.PowellDevTools_js_enabled = false;
        localStorage.PowellDevTools_css_enabled = false;
        localStorage.PowellDevTools_xhr_enabled = false;

        chrome.browserAction.setBadgeText({ text: '' });

        chrome.runtime.onMessage.addListener(_onRequest);
        
        _updateIcon();
    };
    
    angular.module('powellDevTools').run(['datacontextConfig', _init]);

    chrome.notifications.create(null, {
        type: "basic",
        iconUrl: "resources/img/icon128.png",
        title: "Powell Dev Tools",
        message: "The plugin has been reloaded to ensure JavaScript freshness."
    });

})(window, window.angular, window.chrome, window.localStorage);