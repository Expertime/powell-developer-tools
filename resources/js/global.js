(function PDT_GLOBAL(window, angular, localStorage, undefined) {
    'use strict';

    var powellDevTools = angular.module('powellDevTools', [
        'ngSanitize', // Fixes HTML issues in data binding
        'ngResource'
    ]).config(['$sceDelegateProvider', function($sceDelegateProvider) {
        // Add some trusted resource origins
        $sceDelegateProvider.resourceUrlWhitelist([
            // Allow same origin resource loads.
            'self',
            // Allow loading from our assets domain.  Notice the difference between * and **.
            'https://cdn.jsdelivr.net/**'
        ]);
    }]);
    /*.factory('$exceptionHandler', function() {
            return function (exception, cause) {
                chrome.runtime.reload()
            }
        });*/

    var SERVICE_ID = 'datacontextUtility';
    angular.module('powellDevTools').factory(SERVICE_ID, ['$q', '$resource',
        datacontextUtilityFactory
    ]);

    function datacontextUtilityFactory($q, $resource) {
        return new DatacontextUtility($q, $resource);
    }

    var DatacontextUtility = function($q, $resource) {
        var _this = this;
        DatacontextUtility.$q = $q;
        DatacontextUtility.$resource = $resource;

        _this.CDN_BASE_URL = 'https://[CDNMODE][CDNPREMMODE]';
        _this.DEFAULT_TENANT = 'Default';
        _this.ENVIRONMENTS = {
            'PROD': '1',
            'REC': '2',
            'DEV': '3'
        };
        _this.SOURCEMODES = {
            'PROD': '',
            'DEBUG': '/debug'
        };
        _this.CDNMODES = {
            'PROD': '',
            'REC': 'r7-',
        };
        _this.CDNPREMMODE = {
            'BASIC': 'cdn.powell-365.com',
            'PREM': 'powell365-cdn.azureedge.net'
        };
        _this.ENABLEDSTATES = [
            'js',
            'css',
            'cdn',
            'html',
            'xhr'
        ];
    };

    var _getLocalStorageValue = function(key) {
        return localStorage['PowellDevTools_' + key];
    };

    var _setLocalStorageValue = function(key, value) {
        localStorage['PowellDevTools_' + key] = value;
    };

    /* JS Panel */
    DatacontextUtility.prototype.get_repoJsURL = function() {
        return _getLocalStorageValue('repoJsURL') || '';
    };

    DatacontextUtility.prototype.set_repoJsURL = function(url) {
        _setLocalStorageValue('repoJsURL', url);
    };

    DatacontextUtility.prototype.get_defaultJsRepoState = function() {
        return _getLocalStorageValue('defaultJsRepoState') === "true";
    };

    DatacontextUtility.prototype.set_defaultJsRepoState = function(useDefault) {
        _setLocalStorageValue('defaultJsRepoState', useDefault);
    };

    DatacontextUtility.prototype.get_defaultLocalJsRepoState = function() {
        return _getLocalStorageValue('defaultLocalJsRepoState') === "true";
    };

    DatacontextUtility.prototype.set_defaultLocalJsRepoState = function(useDefault) {
        _setLocalStorageValue('defaultLocalJsRepoState', useDefault);
    };

    DatacontextUtility.prototype.get_defaultJsTenantState = function() {
        return _getLocalStorageValue('defaultJsTenantState') === "true";
    };

    DatacontextUtility.prototype.set_defaultJsTenantState = function(useDefault) {
        _setLocalStorageValue('defaultJsTenantState', useDefault);
    };

    DatacontextUtility.prototype.get_sourceMode = function() {
        return _getLocalStorageValue('sourceMode') || '';
    };

    DatacontextUtility.prototype.set_sourceMode = function(id) {
        _setLocalStorageValue('sourceMode', id);
    };

    DatacontextUtility.prototype.get_cdnJsMode = function() {
        return _getLocalStorageValue('cdnJsMode') || '';
    };

    DatacontextUtility.prototype.set_cdnJsMode = function(id) {
        _setLocalStorageValue('cdnJsMode', id);
    };

    /* CSS Panel */
    DatacontextUtility.prototype.get_repoCssURL = function() {
        return _getLocalStorageValue('repoCssURL') || '';
    };

    DatacontextUtility.prototype.set_repoCssURL = function(url) {
        _setLocalStorageValue('repoCssURL', url);
    };

    DatacontextUtility.prototype.get_defaultCssRepoState = function() {
        return _getLocalStorageValue('defaultCssRepoState') === "true";
    };

    DatacontextUtility.prototype.set_defaultCssRepoState = function(useDefault) {
        _setLocalStorageValue('defaultCssRepoState', useDefault);
    };

    DatacontextUtility.prototype.get_defautCssOnCdnState = function() {
        return _getLocalStorageValue('defautCssOnCdnState') === "true";
    };

    DatacontextUtility.prototype.set_defautCssOnCdnState = function(defaultCssOnCdn) {
        _setLocalStorageValue('defautCssOnCdnState', defaultCssOnCdn);
    };

    DatacontextUtility.prototype.get_defaultCssURL = function() {
        return _getLocalStorageValue('defaultCssURL') || '';
    };

    DatacontextUtility.prototype.set_defaultCssURL = function(url) {
        _setLocalStorageValue('defaultCssURL', url);
    };

    DatacontextUtility.prototype.get_devCssID = function() {
        return _getLocalStorageValue('devCssID') || '';
    };

    DatacontextUtility.prototype.set_devCssID = function(id) {
        _setLocalStorageValue('devCssID', id);
    };
    DatacontextUtility.prototype.get_tenantCssID = function() {
        return _getLocalStorageValue('tenantCssID') || '';
    };

    DatacontextUtility.prototype.set_tenantCssID = function(id) {
        _setLocalStorageValue('tenantCssID', id);
    };

    DatacontextUtility.prototype.get_defaultCssTenantState = function() {
        return _getLocalStorageValue('defaultCssTenantState') === "true";
    };

    DatacontextUtility.prototype.set_defaultCssTenantState = function(useDefault) {
        _setLocalStorageValue('defaultCssTenantState', useDefault);
    };

    DatacontextUtility.prototype.get_envID = function() {
        return _getLocalStorageValue('envID') || '';
    };

    DatacontextUtility.prototype.set_envID = function(id) {
        _setLocalStorageValue('envID', id);
    };

    DatacontextUtility.prototype.get_themeID = function() {
        return parseInt(_getLocalStorageValue('themeID'), 10) || 0;
    };

    DatacontextUtility.prototype.set_themeID = function(id) {
        _setLocalStorageValue('themeID', id);
    };

    DatacontextUtility.prototype.get_headerID = function() {
        return parseInt(_getLocalStorageValue('headerID'), 10) || 0;
    };

    DatacontextUtility.prototype.set_headerID = function(id) {
        _setLocalStorageValue('headerID', id);
    };

    DatacontextUtility.prototype.get_footerID = function() {
        return parseInt(_getLocalStorageValue('footerID'), 10) || 0;
    };

    DatacontextUtility.prototype.set_footerID = function(id) {
        _setLocalStorageValue('footerID', id);
    };

    DatacontextUtility.prototype.get_cdnCssMode = function() {
        return _getLocalStorageValue('cdnCssMode') || '';
    };

    DatacontextUtility.prototype.set_cdnCssMode = function(id) {
        _setLocalStorageValue('cdnCssMode', id);
    };

    DatacontextUtility.prototype.get_useThemeState = function() {
        return _getLocalStorageValue('useThemeState') === "true";
    };

    DatacontextUtility.prototype.set_useThemeState = function(useTheme) {
        _setLocalStorageValue('useThemeState', useTheme);
    };

    DatacontextUtility.prototype.get_useHeaderState = function() {
        return _getLocalStorageValue('useHeaderState') === "true";
    };

    DatacontextUtility.prototype.set_useHeaderState = function(useHeader) {
        _setLocalStorageValue('useHeaderState', useHeader);
    };

    DatacontextUtility.prototype.get_useFooterState = function() {
        return _getLocalStorageValue('useFooterState') === "true";
    };

    DatacontextUtility.prototype.set_useFooterState = function(useFooter) {
        _setLocalStorageValue('useFooterState', useFooter);
    };

    /* CDN Panel */
    DatacontextUtility.prototype.get_cdnURL = function() {
        return _getLocalStorageValue('cdnURL') || '';
    };

    DatacontextUtility.prototype.set_cdnURL = function(url) {
        _setLocalStorageValue('cdnURL', url);
    };

    DatacontextUtility.prototype.get_cdnState = function() {
        return _getLocalStorageValue('cdnState') || 'customCdnURL';
    };

    DatacontextUtility.prototype.set_cdnState = function(useDefault) {
        _setLocalStorageValue('cdnState', useDefault);
    };

    /* HTML Panel */
    DatacontextUtility.prototype.get_repoHtmlURL = function() {
        return _getLocalStorageValue('repoHtmlURL') || '';
    };

    DatacontextUtility.prototype.set_repoHtmlURL = function(url) {
        _setLocalStorageValue('repoHtmlURL', url);
    };

    DatacontextUtility.prototype.get_defaultHtmlRepoState = function() {
        return _getLocalStorageValue('defaultHtmlRepoState') === "true";
    };

    DatacontextUtility.prototype.set_defaultHtmlRepoState = function(useDefault) {
        _setLocalStorageValue('defaultHtmlRepoState', useDefault);
    };

    DatacontextUtility.prototype.get_htmlVersion = function() {
        return parseInt(_getLocalStorageValue('htmlVersion'), 10) || 0;
    };

    DatacontextUtility.prototype.set_htmlVersion = function(id) {
        _setLocalStorageValue('htmlVersion', id);
    };

    DatacontextUtility.prototype.get_cdnHtmlMode = function() {
        return _getLocalStorageValue('cdnHtmlMode') || '';
    };

    DatacontextUtility.prototype.set_cdnHtmlMode = function(id) {
        _setLocalStorageValue('cdnHtmlMode', id);
    };

    DatacontextUtility.prototype.get_htmlTemplates = function() {
        return JSON.parse(_getLocalStorageValue('htmlTemplate') || '{}');
    }

    DatacontextUtility.prototype.get_htmlTemplate = function(fileName) {
        var htmlTemplates = JSON.parse(_getLocalStorageValue('htmlTemplate') || '{}');
        if (htmlTemplates[fileName] == null) {
            htmlTemplates[fileName] = {
                isOverriden: false,
                fileName: fileName
            };
            _setLocalStorageValue('htmlTemplate', JSON.stringify(htmlTemplates));
        }
        return htmlTemplates[fileName];
    }

    DatacontextUtility.prototype.set_htmlTemplate = function(fileName, isOverriden) {
        var htmlTemplates = JSON.parse(_getLocalStorageValue('htmlTemplate') || '{}');
        if (htmlTemplates[fileName] == null) {
            htmlTemplates[fileName] = {
                isOverriden: isOverriden,
                fileName: fileName
            };
        } else {
            htmlTemplates[fileName].isOverriden = isOverriden;
        }
        _setLocalStorageValue('htmlTemplate', JSON.stringify(htmlTemplates));
    }

    /* XHR Panel*/
    DatacontextUtility.prototype.get_xhrOrigin = function() {
        return _getLocalStorageValue('xhrOrigin') || '';
    };

    DatacontextUtility.prototype.set_xhrOrigin = function(xhrOrigin) {
        _setLocalStorageValue('xhrOrigin', xhrOrigin);
    };

    /* Translate Panel */
    DatacontextUtility.prototype.get_encodeBingTranslation = function() {
        return _getLocalStorageValue('encodeBingTranslation') === "true";
    };

    DatacontextUtility.prototype.set_encodeBingTranslation = function(useDefault) {
        _setLocalStorageValue('encodeBingTranslation', useDefault);
    };

    /* Common */
    DatacontextUtility.prototype.isEnabled = function(sourceKind) {
        return _getLocalStorageValue(sourceKind + '_enabled') === "true";
    };

    DatacontextUtility.prototype.set_isEnabled = function(sourceKind, enabled) {
        _setLocalStorageValue(sourceKind + '_enabled', enabled);
    };

    DatacontextUtility.prototype.shouldShowEnabled = function() {
        var _this = this;
        return _this.isEnabled('js') || _this.isEnabled('css') || _this.isEnabled('xhr');
    };

    DatacontextUtility.prototype.enabledState = function() {
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

        if (enabledState.length == 0) {
            return 'none';
        }

        if (enabledState.length == 1) {
            return enabledState[0].kind;
        } else {
            return enabledState.map(function(state) {
                return state.kind.substr(0, 1);
            }).join('');
        }
    };

    DatacontextUtility.prototype.get_activePane = function() {
        return _getLocalStorageValue('activePane') || 'js';
    };

    DatacontextUtility.prototype.set_activePane = function(paneId) {
        _setLocalStorageValue('activePane', paneId);
    };

    DatacontextUtility.prototype.getLocalStorageValue = function(key) {
        var _this = this;
        return _this["get_" + key]();
    };

    DatacontextUtility.prototype.setLocalStorageValue = function(key, value) {
        var _this = this;
        _this["set_" + key](value);
    };

    DatacontextUtility.prototype.get_cdnPremMode = function(isPremium) {
        var _this = this;
        return _this.CDNPREMMODE[isPremium ? 'PREM' : 'BASIC'];
    };

    DatacontextUtility.prototype.get_jsSourceUrl = function(isPremium) {
        var _this = this;
        var debugJsUrl = [];
        if (_this.get_defaultJsRepoState()) {
            debugJsUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnJsMode()).replace('[CDNPREMMODE]', _this.get_cdnPremMode(false)));
            debugJsUrl.push('scripts');
            debugJsUrl.push('powell' + _this.get_sourceMode());
            debugJsUrl = debugJsUrl.join('/');
        } else if (_this.get_defaultLocalJsRepoState()) {
            debugJsUrl = 'https://localhost:55555/javascripts/powell.js';
        } else {
            debugJsUrl = _this.get_repoJsURL();
        }

        return debugJsUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    DatacontextUtility.prototype.get_cdnSourceUrl = function(path) {
        var _this = this;
        var cdnUrl = [];
        switch (_this.get_cdnState()) {
            case 'customCdnURL':
                cdnUrl.push(_this.get_cdnURL());
                break;
            case 'defaultLocalCdnURL':
                cdnUrl.push('https://localhost:44300');
                break;
            case 'classicCdnURL' :
                cdnUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', '').replace('[CDNPREMMODE]', _this.get_cdnPremMode(false)));
                break;
            case 'premiumCdnURL':
                cdnUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', '').replace('[CDNPREMMODE]', _this.get_cdnPremMode(true)));
                break;
        }
        cdnUrl.push(path);
        cdnUrl = cdnUrl.join('/');
        
        return cdnUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    DatacontextUtility.prototype.get_cssSourceUrl = function(cssFileName, isPremium) {
        var _this = this;
        var debugCssUrl = [];
        if (_this.get_defaultCssRepoState()) {
            debugCssUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnCssMode()).replace('[CDNPREMMODE]', _this.get_cdnPremMode(false)));
        } else {
            debugCssUrl.push(_this.get_repoCssURL());
        }

        debugCssUrl.push('styles');

        if (_this.get_defaultCssTenantState()) {
            debugCssUrl.push(_this.DEFAULT_TENANT);
        } else {
            debugCssUrl.push(_this.get_tenantCssID());
        }

        var userUrl = _this.get_devCssID();

        if (userUrl) {
            debugCssUrl.push('user');
            debugCssUrl.push(userUrl);
        }

        debugCssUrl.push(cssFileName);
        debugCssUrl = debugCssUrl.join('/');

        var envID = _this.get_envID();
        var useTheme = _this.get_useThemeState();
        var useHeader = _this.get_useHeaderState();
        var useFooter = _this.get_useFooterState();

        if (envID) {
            debugCssUrl += '?env=' + _this.get_envID();
            if (useTheme) {
                debugCssUrl += '&themeId=' + _this.get_themeID();
            }
            if (useHeader) {
                debugCssUrl += '&headerId=' + _this.get_headerID();
            }
            if (useFooter) {
                debugCssUrl += '&footerId=' + _this.get_footerID();
            }
        }

        return debugCssUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    DatacontextUtility.prototype.get_headerFooterHtmlTemplateUrl = function(originalHtmlTemplateUrl, isHeaderRequest) {
        var _this = this;
        var useHeader = _this.get_useHeaderState();
        var useFooter = _this.get_useFooterState();
        var regHtmlTemplateId = /htmltemplates\/\d+$/i;
        var htmlTemplateId = originalHtmlTemplateUrl.match(regHtmlTemplateId)[0];
        var cdnUrl = originalHtmlTemplateUrl.match(/.*cdn.powell-365.com/)[0];

        if (useHeader || useFooter) {
            originalHtmlTemplateUrl = originalHtmlTemplateUrl.replace(cdnUrl, _this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnCssMode()).replace('[CDNPREMMODE]', _this.get_cdnPremMode(false)));
        }

        if (useHeader && isHeaderRequest) {
            originalHtmlTemplateUrl = originalHtmlTemplateUrl.replace(htmlTemplateId, 'SergeTemplates/' + _this.get_headerID());
        }

        if (useFooter && !isHeaderRequest) {
            originalHtmlTemplateUrl = originalHtmlTemplateUrl.replace(htmlTemplateId, 'SergeTemplates/' + _this.get_footerID());
        }

        return originalHtmlTemplateUrl;
    }

    DatacontextUtility.prototype.get_htmlSourceUrl = function(htmlFileName, htmlFileType) {
        var _this = this;
        var debugHtmlUrl = [];
        if (_this.get_defaultHtmlRepoState()) {
            debugHtmlUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnHtmlMode()));
            debugHtmlUrl.push('Common');
            /* Comprendre les URLs des Layouts & Templates
            Config.RESOURCE_FOLDER */
        } else {
            debugHtmlUrl.push(_this.get_repoHtmlURL());
        }

        //debugHtmlUrl.push(htmlFileType);

        debugHtmlUrl.push(htmlFileName);
        debugHtmlUrl = debugHtmlUrl.join('/');

        return debugHtmlUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    DatacontextUtility.prototype.get_logoSourceUrl = function(logoFileName, isPremium) {
        var _this = this;
        var debugLogoUrl = [];
        if (_this.get_defaultCssRepoState()) {
            debugLogoUrl.push(_this.CDN_BASE_URL.replace('[CDNMODE]', _this.get_cdnCssMode()).replace('[CDNPREMMODE]', _this.get_cdnPremMode(false)));
        } else {
            debugLogoUrl.push(_this.get_repoCssURL());
        }

        debugLogoUrl.push('styles');
        debugLogoUrl.push(_this.DEFAULT_TENANT);
        debugLogoUrl.push('images');
        debugLogoUrl.push(logoFileName);
        debugLogoUrl = debugLogoUrl.join('/');

        var envID = _this.get_envID();
        var useTheme = _this.get_useThemeState();

        if (envID) {
            debugLogoUrl += '?env=' + _this.get_envID();
            if (useTheme) {
                debugLogoUrl += '&themeId=' + _this.get_themeID();
            }
        }

        return debugLogoUrl.replace(/([^:]\/)\/+/g, "$1");
    };

    DatacontextUtility.prototype.get_bingTranslationResource = function() {
        return DatacontextUtility.$resource('https://r7-cdn.powell-365.com/translate', {}, {
            post: {
                method: 'POST',
                params: {},
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    "content-type": "application/json;odata=verbose",
                    'X-Powell-Phone': 1081,
                }
            }
        });
    };

    var _hashCodeFor = function(string) {
        var hash = 0,
            i, chr, len;
        if (string.length === 0) return hash;
        for (i = 0, len = string.length; i < len; i++) {
            chr = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    };

    window.PDT_GLOBAL = _hashCodeFor(PDT_GLOBAL.toString());

})(window, window.angular, window.localStorage);