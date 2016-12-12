(function GLOBAL (window, angular, localStorage, undefined) {
    'use strict';

    var powellDevTools = angular.module('powellDevTools', [
        'ngSanitize'   // Fixes HTML issues in data binding
    ]).config(['$sceDelegateProvider', function($sceDelegateProvider) {
      // Add some trusted resource origins
      $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain.  Notice the difference between * and **.
        'https://rawgit.com/**',
        'https://cdn.rawgit.com/**'
      ]);
    }]);/*.factory('$exceptionHandler', function() {
        return function (exception, cause) {
            chrome.runtime.reload()
        }
    });*/

    var SERVICE_ID = 'datacontextUtility';
    angular.module('powellDevTools').factory(SERVICE_ID, ['$q',
        datacontextUtilityFactory]);
    
    function datacontextUtilityFactory($q) {
        return new DatacontextUtility($q);
    }
     
    var DatacontextUtility = function ($q) {
        var _this = this;
        DatacontextUtility.$q = $q;
        _this.CDN_BASE_URL = 'https://cdn.powell-365.com';
        _this.DEFAULT_TENANT = 'Default';
        _this.ENVIRONMENTS = {
            'PROD' : '1',
            'REC' : '2',
            'DEV': '3'
        };
        _this.ENABLEDSTATES = [
            'css',
            'xhr'
        ];
    };
    
    var _getLocalStorageValue = function (key) {
        return localStorage['PowellDevTools_' + key];
    };
    
    var _setLocalStorageValue = function (key, value) {
        localStorage['PowellDevTools_' + key] = value;
    };
    
    /* CSS Panel */
    DatacontextUtility.prototype.get_envID = function () {
        return _getLocalStorageValue('envID') || '';
    };
    
    DatacontextUtility.prototype.set_envID = function (id) {
        _setLocalStorageValue('envID', id);
    };
            
    DatacontextUtility.prototype.get_themeID = function () {
        return parseInt(_getLocalStorageValue('themeID'), 10) || 0;
    };
    
    DatacontextUtility.prototype.set_themeID = function (id) {
        _setLocalStorageValue('themeID', id);
    };

    /* XHR Panel*/
    DatacontextUtility.prototype.get_xhrOrigin = function () {
        return _getLocalStorageValue('xhrOrigin') || '';
    };

    DatacontextUtility.prototype.set_xhrOrigin = function (xhrOrigin) {
        _setLocalStorageValue('xhrOrigin', xhrOrigin);
    };
    
    /* Common */
    DatacontextUtility.prototype.isEnabled = function (sourceKind) {
        return _getLocalStorageValue(sourceKind + '_enabled') === "true";
    };
    
    DatacontextUtility.prototype.set_isEnabled = function (sourceKind, enabled) {
        _setLocalStorageValue(sourceKind + '_enabled', enabled);
    };

    DatacontextUtility.prototype.shouldShowEnabled = function () {
        var _this = this;
        return _this.isEnabled('css') || _this.isEnabled('xhr');
    };

    DatacontextUtility.prototype.enabledFourState = function () {
        var _this = this;
        var enabledState = _this.ENABLEDSTATES.map(function(state) {
            return {
                    kind: state,
                    enabled: _this.isEnabled(state)  
                };
        });

        enabledState = enabledState.filter(function(state) {
            return state.enabled;
        });

        if(enabledState.length == 0) {
            return 'none';
        }
        
        if(enabledState.length == 1) {
            return enabledState[0].kind;
        } else {
            return enabledState.map(function(state) {
                return state.kind.substr(0,1);
            }).join('');
        }
    };
    
    DatacontextUtility.prototype.get_activePane = function () {
        return _getLocalStorageValue('activePane') || 'css';
    };
    
    DatacontextUtility.prototype.set_activePane = function (paneId) {
        _setLocalStorageValue('activePane', paneId);
    };
    
    DatacontextUtility.prototype.getLocalStorageValue = function (key) {
        var _this = this;
        return _this["get_" + key](); 
    };
    
    DatacontextUtility.prototype.setLocalStorageValue = function (key, value) {
        var _this = this;
        _this["set_" + key](value);
    };
    
    DatacontextUtility.prototype.get_cssSourceUrl = function (cssFileName) {
        var _this = this;
        var debugCssUrl = [];
        debugCssUrl.push(_this.CDN_BASE_URL);
        
        debugCssUrl.push('styles');
        debugCssUrl.push(_this.DEFAULT_TENANT);
        
        debugCssUrl.push(cssFileName);
        debugCssUrl = debugCssUrl.join('/');
               
        //debugCssUrl += '?env=' + _this.get_envID();
        debugCssUrl += '?themeId=' + _this.get_themeID();
                
        return debugCssUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    DatacontextUtility.prototype.get_logoSourceUrl = function (logoFileName) {
        var _this = this;
        var debugLogoUrl = [];
        debugLogoUrl.push(_this.CDN_BASE_URL);
        
        debugLogoUrl.push('styles');
        debugLogoUrl.push(_this.DEFAULT_TENANT);
        debugLogoUrl.push('images');
        debugLogoUrl.push(logoFileName);
        debugLogoUrl = debugLogoUrl.join('/');
        
        debugLogoUrl += '?env=' + _this.get_envID();
        debugLogoUrl += '&themeId=' + _this.get_themeID();
        
        return debugLogoUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    var _hashCodeFor = function(string) {
        var hash = 0, i, chr, len;
        if (string.length === 0) return hash;
        for (i = 0, len = string.length; i < len; i++) {
            chr   = string.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    window.GLOBAL = _hashCodeFor(GLOBAL.toString());

})(window, window.angular, window.localStorage);

