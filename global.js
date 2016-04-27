(function (window, angular, localStorage, undefined) {
    'use strict';

    var powellDevTools = angular.module('powellDevTools', [
        'ngSanitize'   // Fixes HTML issues in data binding
    ]);

    var SERVICE_ID = 'datacontextUtility';
    angular.module('powellDevTools').factory(SERVICE_ID, ['$q',
        datacontextUtilityFactory]);
    
    function datacontextUtilityFactory($q) {
        return new DatacontextUtility($q);
    }
     
    var DatacontextUtility = function ($q) {
        var _this = this;
        DatacontextUtility.$q = $q;
        _this.CDN_BASE_URL = 'https://[CDNMODE].powell-365.com/';
        _this.DEFAULT_TENANT = 'Default';
        _this.ENVIRONMENTS = {
            'PROD' : '1',
            'REC' : '2',
            'DEV': '3'
        };
        _this.SOURCEMODES = {
            'PROD' : '',
            'DEBUG' : '/debug'
        };
        _this.CDNMODES = {
            'PROD' : 'cdn',
            'REC' : 'r7-cdn'
        };
    };
    
    var _getLocalStorageValue = function (key) {
        return localStorage['PowellDevTools_' + key];
    };
    
    var _setLocalStorageValue = function (key, value) {
        localStorage['PowellDevTools_' + key] = value;
    };
    
    DatacontextUtility.prototype.get_repoJsURL = function () {
        return _getLocalStorageValue('repoJsURL') || '';
    };
    
    DatacontextUtility.prototype.set_repoJsURL = function (url) {
        _setLocalStorageValue('repoJsURL', url);
    };
    
    DatacontextUtility.prototype.get_defaultJsRepoState = function () {
        return _getLocalStorageValue('defaultJsRepoState') === "true";
    };
    
    DatacontextUtility.prototype.set_defaultJsRepoState = function (useDefault) {
        _setLocalStorageValue('defaultJsRepoState', useDefault);
    };
    
    DatacontextUtility.prototype.get_repoCssURL = function() {
        return _getLocalStorageValue('repoCssURL') || '';
    };
       
    DatacontextUtility.prototype.set_repoCssURL = function (url) {
        _setLocalStorageValue('repoCssURL', url);
    };
    
    DatacontextUtility.prototype.get_defaultCssRepoState = function () {
        return _getLocalStorageValue('defaultCssRepoState') === "true";
    };
    
    DatacontextUtility.prototype.set_defaultCssRepoState = function (useDefault) {
        _setLocalStorageValue('defaultCssRepoState', useDefault);
    };
/*    
    DatacontextUtility.prototype.get_devJsID = function() {
        return _getLocalStorageValue('devJsID') || '';
    }
    
    DatacontextUtility.prototype.set_devJsID = function (id) {
        _setLocalStorageValue('devJsID', id);
    }
*/
    DatacontextUtility.prototype.get_devCssID = function() {
        return _getLocalStorageValue('devCssID') || '';
    };
    
    DatacontextUtility.prototype.set_devCssID = function (id) {
        _setLocalStorageValue('devCssID', id);
    };
/*    
    DatacontextUtility.prototype.get_tenantJsID = function() {
        return _getLocalStorageValue('tenantJsID') || '';
    }
    
    DatacontextUtility.prototype.set_tenantJsID = function (id) {
        _setLocalStorageValue('tenantJsID', id);
    }
*/    
    DatacontextUtility.prototype.get_defaultJsTenantState = function () {
        return _getLocalStorageValue('defaultJsTenantState') === "true";
    };
    
    DatacontextUtility.prototype.set_defaultJsTenantState = function (useDefault) {
        _setLocalStorageValue('defaultJsTenantState', useDefault);
    };
        
    DatacontextUtility.prototype.get_tenantCssID = function() {
        return _getLocalStorageValue('tenantCssID') || '';
    };
    
    DatacontextUtility.prototype.set_tenantCssID = function (id) {
        _setLocalStorageValue('tenantCssID', id);
    };
    
    DatacontextUtility.prototype.get_defaultCssTenantState = function () {
        return _getLocalStorageValue('defaultCssTenantState') === "true";
    };
    
    DatacontextUtility.prototype.set_defaultCssTenantState = function (useDefault) {
        _setLocalStorageValue('defaultCssTenantState', useDefault);
    };
    
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
    
    DatacontextUtility.prototype.get_sourceMode = function () {
        return _getLocalStorageValue('sourceMode') || '';
    };
    
    DatacontextUtility.prototype.set_sourceMode = function (id) {
        _setLocalStorageValue('sourceMode', id);
    };
    
    DatacontextUtility.prototype.get_cdnJsMode = function () {
        return _getLocalStorageValue('cdnJsMode') || 'cdn';
    };
    
    DatacontextUtility.prototype.set_cdnJsMode = function (id) {
        _setLocalStorageValue('cdnJsMode', id);
    };
    
    DatacontextUtility.prototype.get_cdnCssMode = function () {
        return _getLocalStorageValue('cdnCssMode') || 'cdn';
    };
    
    DatacontextUtility.prototype.set_cdnCssMode = function (id) {
        _setLocalStorageValue('cdnCssMode', id);
    };
    
    DatacontextUtility.prototype.get_useThemeState = function () {
        return _getLocalStorageValue('useThemeState') === "true";
    };
    
    DatacontextUtility.prototype.set_useThemeState = function (useTheme) {
        _setLocalStorageValue('useThemeState', useTheme);
    };
    
    DatacontextUtility.prototype.isEnabled = function (sourceKind) {
        return _getLocalStorageValue(sourceKind + '_enabled') === "true";
    };
    
    DatacontextUtility.prototype.set_isEnabled = function (sourceKind, enabled) {
        _setLocalStorageValue(sourceKind + '_enabled', enabled);
    };

    DatacontextUtility.prototype.shouldShowEnabled = function () {
        var _this = this;
        return _this.isEnabled('script') || _this.isEnabled('stylesheet');
    };

    DatacontextUtility.prototype.enabledFourState = function () {
        var _this = this;
        return _this.isEnabled('stylesheet') && _this.isEnabled('script') 
            ? 'all' 
            : _this.isEnabled('stylesheet') 
                ? 'stylesheet' 
                : _this.isEnabled('script') 
                    ? 'script' 
                    : 'none';
    };
    
    DatacontextUtility.prototype.get_activePane = function () {
        return _getLocalStorageValue('activePane') || 'js';
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
    
    DatacontextUtility.prototype.get_jsSourceUrl = function () {
        var _this = this;       
        var debugJsUrl = [];
        if(_this.get_defaultJsRepoState()) {
            debugJsUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnJsMode()));
            debugJsUrl.push('scripts');
            debugJsUrl.push('powell' + _this.get_sourceMode());
            debugJsUrl = debugJsUrl.join('/');
        } else {
            debugJsUrl = _this.get_repoJsURL();
        }
        
        return debugJsUrl.replace(/([^:]\/)\/+/g, "$1");
    };
    
    DatacontextUtility.prototype.get_cssSourceUrl = function (cssFileName) {
        var _this = this;
        var debugCssUrl = [];
        if (_this.get_defaultCssRepoState()) {
            debugCssUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnCssMode()));
        } else {
            debugCssUrl.push(_this.get_repoCssURL());
        }
        
        debugCssUrl.push('styles');
        
        if(_this.get_defaultCssTenantState()) {
            debugCssUrl.push(_this.DEFAULT_TENANT);
        } else {
            debugCssUrl.push(_this.get_tenantCssID());
        }
        
        var userUrl = _this.get_devCssID();
        
        if(userUrl) {
            debugCssUrl.push('user');
            debugCssUrl.push(userUrl);
        }
        
        debugCssUrl.push(cssFileName);
        debugCssUrl = debugCssUrl.join('/');
        
        var envID = _this.get_envID();
        var useTheme = _this.get_useThemeState();
        
        if (envID) {
            if (useTheme) {
                debugCssUrl += '?themeId=' + _this.get_themeID() + '&env=' + _this.get_envID();            
            }
            else {
                debugCssUrl += '?environmentId=' + _this.get_envID();
            }
        }
        
        return debugCssUrl.replace(/([^:]\/)\/+/g, "$1");
    };
    
})(window, window.angular, window.localStorage);

