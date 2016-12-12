(function (window, angular, $, chrome, undefined) {
    'use strict';

    var CONTROLLER_ID = 'ConfigController';
    
    angular.module('powellDevTools').controller(CONTROLLER_ID,
        ['$scope', '$element', '$q', '$sce', '$timeout', '$interval', 'datacontextUtility',
            configControllerModule]);
    
    function configControllerModule($scope, $element, $q, $sce, $timeout, $interval, datacontextUtility) {
        // Check background scripts freshness 
        chrome.runtime.sendMessage({ 'action': 'checkScriptFreshness', 'globalMD5': window.GLOBAL });
        
        return new ConfigController($scope, $element, $q, $sce, $timeout, $interval, datacontextUtility);
    }

    var ConfigController = function ($scope, $element, $q, $sce, $timeout, $interval, datacontextUtility) {
        var _this = this;
        
        /*****************
         * View variables
         *****************/

        var scripts = document.querySelectorAll('script');
        var script = scripts[scripts.length-1]
        if (script.src.indexOf('chrome-extension://') >= 0) {
            // For debugging mode //
            $scope.configTemplateUrl = '/resources/html/ConfigController.html'
        } else {
            // For production mode //     
            $scope.configTemplateUrl = 'https://rawgit.com/Expertime/powell-developer-tools/Powell-365-branding/resources/html/ConfigController.html';
        }
        
        $scope.config = {
            envID: datacontextUtility.get_envID(),
            themeID: datacontextUtility.get_themeID(),
            xhrOrigin : datacontextUtility.get_xhrOrigin()
        };
        
        $scope.enableCssEmulation = datacontextUtility.isEnabled('css');
        $scope.enableXhrEmulation = datacontextUtility.isEnabled('xhr');
        $scope.environments = datacontextUtility.ENVIRONMENTS;
        $scope.cdnModes = datacontextUtility.CDNMODES;
        
        $scope.$watchCollection('config', function(newValues) {
            for (var value in newValues) {
                datacontextUtility.setLocalStorageValue(value, newValues[value]);
            }
            $scope.emulationSources = {
                css: datacontextUtility.get_cssSourceUrl('*.css')
            };
        });
        
        $scope.isPaneActive = function (paneId) {
            return paneId == datacontextUtility.get_activePane() ? 'active' : '';
        };
        
        $scope.setActivePane = function (paneId) {
            datacontextUtility.set_activePane(paneId);
        };
        
        $scope.switchChanged = function (sourceKind) {
            var deferred = $q.defer();
            chrome.runtime.sendMessage({ 'action': 'setEnabled', 'enabled': !datacontextUtility.isEnabled(sourceKind), 'sourceKind': sourceKind }, 
                function(response){
                    if(!response && chrome.runtime.lastError) {
                        deferred.reject(chrome.runtime.lastError);
                    } else {
                        deferred.resolve(response);
                    }
                });
            deferred.promise.catch(function(response) {
                // Error while communicating with background scripts. Reloading plugin.
                // chrome.runtime.reload();
            });
        };
        
        $scope.clearLocalStorage = function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {method: "powDevTools.clearStorage"}, function(storageResponse) {
                    chrome.tabs.reload(tabs[0].id, {bypassCache: true}, function(refreshResponse) {
                        console.log(storageResponse, refreshResponse);
                        chrome.notifications.create(null, {
                            type: "basic",
                            iconUrl: "resources/img/icon128.png",
                            title: "Powell Dev Tools",
                            message: "Local storage, local session and browser cache cleared successfully"
                        });
                    });
                });
            });
        };
    };



})(window, window.angular, window.jQuery, window.chrome);