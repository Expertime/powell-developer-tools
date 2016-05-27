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
    
    var _setEnabled = function (enabled, sourceKind) {
        if (enabled) {
            var powR7Cdn = "*://r7-cdn.powell-365.com/*";
            var powCdn = "*://cdn.powell-365.com/*";
            var filters = {
                urls: [powR7Cdn, powCdn],
                types: [sourceKind]
            };
            var opt_extraInfoSpec = ['blocking'];
            switch (sourceKind) {
                case 'script':
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeJsRequestListener, filters, opt_extraInfoSpec);
                    break;
                case 'stylesheet':
                    chrome.webRequest.onBeforeRequest.addListener(_onBeforeCssRequestListener, filters, opt_extraInfoSpec);
                    break;
            }
        } else {
            switch (sourceKind) {
                case 'script':
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeJsRequestListener);
                    break;
                case 'stylesheet':
                    chrome.webRequest.onBeforeRequest.removeListener(_onBeforeCssRequestListener);
                    break;
            }
        }

        DatacontextConfig.utility.set_isEnabled(sourceKind, enabled);

        _updateIcon();
    };
    
    var _updateIcon = function () {
        chrome.browserAction.setBadgeBackgroundColor({
            color: DatacontextConfig.icons[DatacontextConfig.utility.enabledFourState()].color 
        });
        chrome.browserAction.setBadgeText({
            text: DatacontextConfig.icons[DatacontextConfig.utility.enabledFourState()].text 
        });
        chrome.browserAction.setIcon({
            path: DatacontextConfig.icons[DatacontextConfig.utility.enabledFourState()].icon
        });
    };
    
    var _onRequest = function (request, sender, callback) {
        if (request.action == 'setEnabled') {
            _setEnabled(request.enabled, request.sourceKind);
        }
    };
    
    var DatacontextConfig = function ($q, datacontextUtility) {
        DatacontextConfig.$q = $q;
        DatacontextConfig.utility = datacontextUtility;
        DatacontextConfig.icons = {
            script: { color: '#EFBE19', text: 'js', icon: 'resources/img/icon19.png'},
            stylesheet: { color: '#2FA9DA', text: 'css', icon: 'resources/img/icon19.png'},
            all: { color: '#F3672A', text: 'all', icon: 'resources/img/icon19.png' },
            none: { color: '#000', text:'', icon: 'resources/img/icon19_disabled.png'}
        };
    };
    
    var _init = function () {
        localStorage.PowellDevTools_script_enabled = false;
        localStorage.PowellDevTools_stylesheet_enabled = false;

        chrome.browserAction.setBadgeText({ text: '' });

        chrome.extension.onRequest.addListener(_onRequest);
        
        _updateIcon();
    };
    
    angular.module('powellDevTools').run(['datacontextConfig', _init]);

})(window, window.angular, window.chrome, window.localStorage);

/* Commented since CDN does not allow requests from other origins than the original Tenant
function sendRequest(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, false); // `false` makes the request synchronous
	request.send(null);
	
	if (request.status === 200) {
		console.info('\tJS Debug file ' + url + ' does exist');
	} else {
		console.warn('\tJS Debug file ' + url + ' does not exist');
	}
	return request.status === 200;
}
function checkDebugSourceExists(url) {
    console.log('\tChecking if ' + url + ' exists');
    return sendRequest(url);
}
*/