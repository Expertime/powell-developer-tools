(function (window, angular, $, chrome, undefined) {
    'use strict';

    var CONTROLLER_ID = 'ConfigController';

    angular.module('powellDevTools').controller(CONTROLLER_ID, ['$scope', '$element', '$q', '$sce', '$timeout', '$interval', 'datacontextUtility',
        configControllerModule
    ]);

    function configControllerModule($scope, $element, $q, $sce, $timeout, $interval, datacontextUtility) {
        // Check background scripts freshness 
        chrome.runtime.sendMessage({
            'action': 'powDevTools.checkScriptFreshness',
            'globalMD5': window.PDT_GLOBAL
        });
        return new ConfigController($scope, $element, $q, $sce, $timeout, $interval, datacontextUtility);
    }

    var ConfigController = function ($scope, $element, $q, $sce, $timeout, $interval, datacontextUtility) {
        var _this = this;

        /**************
         * App version
         **************/
        $scope.appVers = "6.4.1";

        /*****************
         * View variables
         *****************/

        var scripts = document.querySelectorAll('script');
        var script = scripts[scripts.length - 1]
        if (script.src.indexOf('chrome-extension://') >= 0) {
            // For debugging mode //
            $scope.configTemplateUrl = '/resources/html/ConfigController.html';
        } else {
            // For production mode //     
            $scope.configTemplateUrl = 'https://cdn.jsdelivr.net/gh/Expertime/powell-developer-tools/resources/html/ConfigController.html';
        }

        $scope.config = {
            repoJsURL: datacontextUtility.get_repoJsURL(),
            defaultJsRepoState: datacontextUtility.get_defaultJsRepoState(),
            repoCssURL: datacontextUtility.get_repoCssURL(),
            defaultCssRepoState: datacontextUtility.get_defaultCssRepoState(),
            defautCssOnCdnState: datacontextUtility.get_defautCssOnCdnState(),
            defaultCssURL: datacontextUtility.get_defaultCssURL(),
            devCssID: datacontextUtility.get_devCssID(),
            defaultJsTenantState: datacontextUtility.get_defaultJsTenantState(),
            tenantCssID: datacontextUtility.get_tenantCssID(),
            defaultCssTenantState: datacontextUtility.get_defaultCssTenantState(),
            envID: datacontextUtility.get_envID(),
            themeID: datacontextUtility.get_themeID(),
            headerID: datacontextUtility.get_headerID(),
            footerID: datacontextUtility.get_footerID(),
            useThemeState: datacontextUtility.get_useThemeState(),
            useHeaderState: datacontextUtility.get_useHeaderState(),
            useFooterState: datacontextUtility.get_useFooterState(),
            repoHtmlURL: datacontextUtility.get_repoHtmlURL(),
            defaultHtmlRepoState: datacontextUtility.get_defaultHtmlRepoState(),
            htmlVersion: datacontextUtility.get_htmlVersion(),
            sourceMode: datacontextUtility.get_sourceMode(),
            cdnJsMode: datacontextUtility.get_cdnJsMode(),
            cdnCssMode: datacontextUtility.get_cdnCssMode(),
            cdnHtmlMode: datacontextUtility.get_cdnHtmlMode(),
            xhrOrigin: datacontextUtility.get_xhrOrigin()
        };

        $scope.enableJsEmulation = datacontextUtility.isEnabled('js');
        $scope.enableCssEmulation = datacontextUtility.isEnabled('css');
        $scope.enableHtmlEmulation = datacontextUtility.isEnabled('html');
        $scope.enableXhrEmulation = datacontextUtility.isEnabled('xhr');
        $scope.environments = datacontextUtility.ENVIRONMENTS;
        $scope.sourceModes = datacontextUtility.SOURCEMODES;
        $scope.cdnModes = datacontextUtility.CDNMODES;

        $scope.$watchCollection('config', function (newValues) {
            for (var value in newValues) {
                datacontextUtility.setLocalStorageValue(value, newValues[value]);
                if (value == 'headerID' || value == 'footerID') {
                    var action = "powDevTools.valueUpdated";
                    var data = {
                        name: value,
                        value: newValues[value]
                    };
                    chrome.runtime.sendMessage({
                        'action': action,
                        'data': data
                    });
                }
            }
            $scope.emulationSources = {
                css: datacontextUtility.get_cssSourceUrl('*.css', false),
                js: datacontextUtility.get_jsSourceUrl(),
                html: datacontextUtility.get_htmlSourceUrl('[layouts|templates]/*.html')
            };
        });

        $scope.isPaneActive = function (paneId) {
            return datacontextUtility.get_activePane().match(new RegExp(paneId)) ? 'active' : '';
        };

        $scope.setActivePane = function (paneId) {
            datacontextUtility.set_activePane(paneId);
        };

        $scope.switchChanged = function (sourceKind) {
            var deferred = $q.defer();
            chrome.runtime.sendMessage({
                    'action': 'powDevTools.setEnabled',
                    'enabled': !datacontextUtility.isEnabled(sourceKind),
                    'sourceKind': sourceKind
                },
                function (response) {
                    if (!response && chrome.runtime.lastError) {
                        deferred.reject(chrome.runtime.lastError);
                    } else {
                        deferred.resolve(response);
                    }
                });
            deferred.promise.catch(function (response) {
                // Error while communicating with background scripts. Reloading plugin.
                // chrome.runtime.reload();
            });
        };

        $scope.clearLocalStorage = function (onlyClearSearchCache) {
            var message = onlyClearSearchCache ? "powDevTools.clearSearchStorage" : "powDevTools.clearStorage";
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    method: message
                }, function (storageResponse) {
                    chrome.tabs.reload(tabs[0].id, {
                        bypassCache: true
                    }, function (refreshResponse) {
                        // chrome.notifications.create(null, {
                        //     type: "basic",
                        //     iconUrl: "resources/img/icon128.png",
                        //     title: "Powell Dev Tools",
                        //     message: "Local storage, local session and browser cache cleared successfully"
                        // });
                    });
                });
            });
        };

        $scope.Sp = {
            Res: {
                Name: '',
                Key: '',
                resourceValues: '',
                getResourceValuesIndicator: '',
                btnGetResourceValues: 'Get resources',
                getResourceValues: function () {

                    var interval = 0
                    var loader = $interval(function () {
                        interval++;
                        $scope.Sp.Res.getResourceValuesIndicator = '.'.repeat(interval % 3 + 1);
                    }, 500);

                    var message = "powDevTools.getResourceValues";
                    var data = {
                        'name': $scope.Sp.Res.Name,
                        'key': $scope.Sp.Res.Key
                    };
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    }, function (tabs) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            method: message,
                            data: data
                        }, function (resourceValues) {
                            $interval.cancel(loader);
                            $scope.Sp.Res.getResourceValuesIndicator = '';
                            $scope.Sp.Res.resourceValues = resourceValues;
                        });
                    });
                }
            }
        };

        var powLang = {
            'fr': '1036',
            'en': '1033',
            'it': '1040',
            'es': '3082',
            'cs': '1029',
            'de': '1031',
            'nl': '1043',
            'pl': '1045',
            'pt': [
                '1046',
                '2070'
            ],
            'ru': '1049',
            'sv': '1053',
            'tr': '1055',
            'zh-CHS': '2052',
            'lt': '1063'
        };

        function encodeChars(string) {
            return string.replace(/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽž]/g, function (m) {
                return (m === '"' || m === '\\') ? " " : "\\x" + m.charCodeAt(0).toString(16).toUpperCase();
            });
        }

        $scope.Bing = {
            bingSource: '',
            bingDestination: '',
            bingTranslatingIndicator: '',
            btnTranslateTitle: 'Traduire',
            translateBing: function () {
                $scope.Bing.btnTranslateTitle = 'Traduction';
                var interval = 0
                var loader = $interval(function () {
                    interval++;
                    $scope.Bing.bingTranslatingIndicator = '.'.repeat(interval % 3 + 1);
                }, 500);

                var bingQuery = {
                    Input: $scope.Bing.bingSourcePhrase,
                    Languages: Object.keys(powLang)
                };

                var resource = datacontextUtility.get_bingTranslationResource();
                resource.post(bingQuery, function (response) {
                    $interval.cancel(loader);
                    $scope.Bing.bingTranslatingIndicator = '';
                    $scope.Bing.btnTranslateTitle = 'Traduire';

                    var result = {
                        key: $scope.Bing.bingSourceKey
                    };

                    Object.keys(response.Data).forEach(function (key) {
                        if (Array.isArray(powLang[key])) {
                            powLang[key].forEach(function (lcid) {
                                result['_' + lcid] = response.Data[key];
                            });
                        } else {
                            result['_' + powLang[key]] = response.Data[key];
                        }
                    });

                    result = encodeChars(JSON.stringify(result, null, 1));
                    result = result.replace(/"(key|_\d+)"/g, '$1').replace(/\'/g, "\\'").replace(/(: )?"(,)?/g, "$1'$2");
                    $scope.Bing.bingDestination = result;
                });
            }
        };
    }
})(window, window.angular, window.jQuery, window.chrome);