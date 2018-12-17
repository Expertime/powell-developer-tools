(function (window, angular, chrome, localStorage, sessionStorage, document, undefined) {
    // chrome.runtime.onMessage.addListener(
    //     function (request, sender, sendResponse) {
    //         switch (request.method) {
    //             case "powDevTools.exportResources":
    //                 var name = request.data.name;
    //                 var key = request.data.key;
    //                 getResource(name, key).then((results) => {
    //                     sendResponse(results);
    //                 });
    //                 return true;
    //         }
    //     });

    angular.element(document).injector().invoke(function () {
        scope = angular.element("[ng-controller='scopeSelectorCtrl']").scope();

        const currentBearer = scope.selectedScope.Bearer;

        const ITEM_TYPES = {
            'FIELDS': {
                name: 'Fields',
                require: [],
                localizedParam: 'DisplayName',
                transferableParams: []
            },
            'CONTENT_TYPES': {
                name: 'ContentTypes',
                require: [],
                localizedParam: 'Name',
                transferableParams: [
                    'ContentTypeId',
                    'Description',
                    'DocumentTemplateBase64',
                    'DocumentTemplateId',
                    'DocumentTemplateInfoName',
                    'EnableNotification',
                    'Fields',
                    'FieldsOrder',
                    'HasDocumentTemplate',
                    'Id',
                    'Name',
                    'ParentContentTypeId',
                    'PublishingPage'
                ]
            },
            'LIST_TEMPLATES': {
                name: 'ListTemplates',
                require: [],
                localizedParam: 'Title',
                transferableParams: []
            },
            'SITE_TEMPLATES': {
                name: 'SiteTemplates',
                require: [],
                localizedParam: 'Title',
                transferableParams: []
            },
            'PAGES': {
                name: 'Pages',
                require: ['SITE_TEMPLATES'],
                localizedParam: 'Name',
                transferableParams: []
            },
            'WIDGETS': {
                name: 'Widgets',
                require: ['PAGES'],
                localizedParam: 'Title',
                transferableParams: []
            },
            'LISTS': {
                name: 'Lists',
                require: ['SITE_TEMPLATES'],
                localizedParam: 'Title',
                transferableParams: [
                    'Id', 
                    'Title', 
                    'EnableVersioning', 
                    'VersioningConfigTemp', 
                    'EnableMinorVersions', 
                    'EnableModeration', 
                    'EnableRating', 
                    'EnableFolderCreation', 
                    'ForceCheckout', 
                    'Hidden', 
                    'IsIndexable', 
                    'IsSearchable', 
                    'Description', 
                    'ListTemplateId', 
                    'TemplateTypeId', 
                    'SiteTemplateId', 
                    'IsSystemList', 
                    'IsStandard', 
                    'IsAddContent', 
                    'RemoveStandardViews', 
                    'ContentTypesAll'
                ]
            },
            'NAVIGATIONS': {
                name: 'Navigations',
                require: [],
                localizedParam: 'Title',
                transferableParams: []
            }
        };

        const ManagerBaseUrl = 'https://manager.powell-365.com/api/';

        function TransferableParamsMissingException(localizableItem, missingTransferableParams) {
            this.localizableItem = localizableItem;
            this.missingTransferableParams = missingTransferableParams;
            this.message = 'Transferable params missing: ' + Array.join(missingTransferableParams, ', ') + '\nin item\n' + JSON.stringify(localizableItem);
        }

        function localizableItemSetBody(localization, originalLocalizableItem, itemType) {
            var transferableParams = itemType.transferableParams;
            var localizedParam = itemType.localizedParam;
            var missingTransferableParams;
            if ((missingTransferableParams = transferableParams.filter(param => {
                    return !originalLocalizableItem.hasOwnProperty(param)
                })).length > 0) {
                throw new TransferableParamsMissingException(originalLocalizableItem, missingTransferableParams);
            }
            return transferableParams.map(function (param) {
                if (param === localizedParam) {
                    return localization;
                } else {
                    return originalList[param];
                }
            });
        }

        function request(url, method, bearer, body) {
            var promise = new Promise(function (resolve, reject) {
                var request = new XMLHttpRequest();

                request.onreadystatechange = function () {
                    if (this.readyState === XMLHttpRequest.DONE) {
                        if (this.status === 200) {
                            resolve(JSON.parse(this.responseText));
                        } else {
                            reject(this.status + '\n' + this.statusText);
                        }
                    }
                };

                request.open(method, url, true);

                request.setRequestHeader('accept', "application/json");
                request.setRequestHeader("content-type", "application/json;charset=UTF-8")
                request.setRequestHeader("x-pow-bearer", bearer);

                request.send(JSON.stringify(body));
            });
            return promise;
        }

        const Endpoints = {
            ResourceLanguages: {
                get: {
                    url: 'language/LoadAllForResourcing',
                    body: function () {
                        return null;
                    }
                }
            },
            Fields: {
                get: {
                    url: 'field/LoadByTenant',
                    body: function () {
                        return null;
                    }
                },
                set: {
                    url: '',
                    body: function (localization, originalField) {
                        return localizableItemSetBody(localization, originalField, ITEM_TYPES.FIELDS);
                    }
                }
            },
            ContentTypes: {
                get: {
                    url: 'contenttype/LoadContentTypesPaged',
                    body: function (pageSize) {
                        return {
                            ResultSource: 0,
                            Page: 0,
                            PageSize: pageSize
                        };
                    }
                },
                set: {
                    url: 'contenttype/create',
                    body: function (localization, originalContentType) {
                        return localizableItemSetBody(localization, originalContentType, ITEM_TYPES.CONTENT_TYPES);
                    }
                }
            },
            ListTemplates: {
                get: {
                    url: 'list/LoadListTemplatesPaged',
                    body: function (pageSize) {
                        return {
                            ResultSource: 0,
                            Page: 0,
                            PageSize: pageSize
                        };
                    }
                },
                set: {
                    url: '',
                    body: function (localization, originalListTemplate) {
                        return localizableItemSetBody(localization, originalListTemplate, ITEM_TYPES.LIST_TEMPLATES);
                    }
                }
            },
            SiteTemplates: {
                get: {
                    url: 'sitetemplates/LoadAll',
                    body: function () {
                        return null;
                    }
                },
                set: {
                    url: '',
                    body: function (localization, originalSiteTemplate) {
                        return localizableItemSetBody(localization, originalSiteTemplate, ITEM_TYPES.SITE_TEMPLATES);
                    }
                }
            },
            Pages: {
                get: {
                    url: 'page/LoadBySiteId',
                    body: function (id) {
                        return {
                            Id: id
                        };
                    }
                },
                set: {
                    url: '',
                    body: function (localization, originalPage) {
                        return localizableItemSetBody(localization, originalPage, ITEM_TYPES.PAGES);
                    }
                }
            },
            Widgets: {
                get: {
                    url: 'page/LoadById',
                    body: function (id) {
                        return {
                            Id: id
                        };
                    }
                },
                set: {
                    url: '',
                    body: function (localization, originalWidget) {
                        return localizableItemSetBody(localization, originalWidget, ITEM_TYPES.WIDGETS);
                    }
                }
            },
            Lists: {
                get: {
                    url: 'list/LoadListsBySiteId',
                    body: function (id) {
                        return {
                            Id: id
                        };
                    }
                },
                set: {
                    url: 'list/Create/',
                    body: function (localization, originalList) {
                        return localizableItemSetBody(localization, originalList, ITEM_TYPES.LISTS);
                    }
                }
            },
            Navigations: {
                get: {
                    url: 'navigation/LoadPaged',
                    body: function (pageSize) {
                        return {
                            ResultSource: 0,
                            Page: 0,
                            PageSize: pageSize
                        };
                    }
                },
                set: {
                    url: '',
                    body: function (localization, originalNavigation) {
                        return localizableItemSetBody(localization, originalNavigation, ITEM_TYPES.NAVIGATIONS);
                    }
                }
            }
        };

        var Models = {};

        var RESOURCES = function (itemTypes) {
            var _this = this;

            var resourcesPromises = [];

            _this.addNewResource = function (promise) {
                resourcesPromises.push(promise);
            };

            _this.allResourcesLoaded = function () {
                return new Promise(function (resolve, reject) {
                    Promise.all(resourcesPromises).then(function (values) {
                        resolve(_this);
                    });
                });
            }

            _this.AvailableLanguages = [];
            request(ManagerBaseUrl + Endpoints.ResourceLanguages.get.url, 'POST', currentBearer).then(function (response) {
                var languages = {
                    0: 'Default'
                };
                response.forEach(function (language) {
                    languages[language.Lcid] = language.Title;
                })
                _this.AvailableLanguages = languages;
            });

            if (Array.isArray(itemTypes)) {
                itemTypes.forEach(function (itemType) {
                    new Models.ResourceItem(itemType, _this);
                });
            } else {
                new Models.ResourceItem(itemTypes, _this);
            }
        };

        Models.ResourceItem = function (type, resourcesObject) {
            var _this = this;

            if (resourcesObject[type.name] !== undefined) {
                return;
            }

            _this.items = [];

            var itemLoadedResolve;
            _this.itemLoaded = new Promise(function (resolve, reject) {
                itemLoadedResolve = resolve;
            });

            resourcesObject[type.name] = _this;
            resourcesObject.addNewResource(_this.itemLoaded);

            var requiredPromises = [];

            if (type.require.length > 0) {
                type.require.forEach(function (type) {
                    var promise = new Promise(function (resolve, reject) {
                        new Models.ResourceItem(ITEM_TYPES[type], resourcesObject);
                        resourcesObject[ITEM_TYPES[type].name].itemLoaded.then(function (item) {
                            resolve(item);
                        });
                    });

                    requiredPromises.push(promise);
                });
            }

            var addNewResource = function (self, type, id, forEachablePromises, currentForEachablePromiseResolve) {
                var body = null;
                switch (type) {
                    case ITEM_TYPES.LIST_TEMPLATES:
                    case ITEM_TYPES.CONTENT_TYPES:
                    case ITEM_TYPES.NAVIGATIONS:
                        body = Endpoints[type.name].get.body(1000);
                        break;

                    case ITEM_TYPES.PAGES:
                    case ITEM_TYPES.LISTS:
                    case ITEM_TYPES.WIDGETS:
                        body = Endpoints[type.name].get.body(id);
                        break;

                    default:
                        break;
                }

                request(ManagerBaseUrl + Endpoints[type.name].get.url, 'POST', currentBearer, body).then(function (response) {
                    switch (type) {
                        case ITEM_TYPES.LIST_TEMPLATES:
                        case ITEM_TYPES.CONTENT_TYPES:
                        case ITEM_TYPES.LAYOUTS:
                        case ITEM_TYPES.NAVIGATIONS:
                            self.items = self.items.concat(response.Items)
                            break;

                        case ITEM_TYPES.SITE_TEMPLATES:
                            self.items = self.items.concat(response.filter(function (template) {
                                return template.CategoryName === "My site templates";
                            }));
                            break;

                        case ITEM_TYPES.LISTS:
                            self.items = self.items.concat(response.filter(function (list) {
                                return list.IsEditable;
                            }));
                            break;

                        case ITEM_TYPES.WIDGETS:
                            self.items = self.items.concat(response.WebParts.filter(function (webPart) {
                                return webPart.FrameType === 0 || webPart.FrameType === 2;
                            }));
                            break;

                        default:
                            self.items = self.items.concat(response);
                            break;
                    }
                    if (Array.isArray(forEachablePromises)) {
                        Promise.all(forEachablePromises).then(function () {
                            itemLoadedResolve(self);
                        });
                        currentForEachablePromiseResolve(self);
                    } else {
                        itemLoadedResolve(self);
                    }
                });
            }

            Promise.all(requiredPromises).then(function (values) {
                if (values.length > 0) {
                    values.forEach(function (value) {
                        var forEachablePromises = [];
                        value.items.forEach(function (item) {
                            forEachablePromises.push(new Promise(function (resolve, reject) {
                                addNewResource(_this, type, item.Id, forEachablePromises, resolve);
                            }));
                        });
                    });
                } else {
                    addNewResource(_this, type)
                }
            });
        }
        
        var selectedResources = [
            //             ITEM_TYPES.FIELDS,
            ITEM_TYPES.CONTENT_TYPES,
            //             ITEM_TYPES.LIST_TEMPLATES,
            //             ITEM_TYPES.SITE_TEMPLATES,
            //             ITEM_TYPES.PAGES,
            //             ITEM_TYPES.WIDGETS,
            //             ITEM_TYPES.LISTS
        ];


        var Resources = new RESOURCES(selectedResources);

        Resources.allResourcesLoaded().then(function (data) {
            console.log(data);
            var workbook = XLSX.utils.book_new();



            selectedResources.forEach(function (resource) {

                var worksheet = XLSX.utils.json_to_sheet(data[resource.name].items.map(function (item) {
                    var itemResources = JSON.parse(item[resource.localizedParam]);
                    itemResources.forEach(function (localization) {
                        itemResources[localization.LCID] = localization.Value;
                    })
                    var itemResourcesAsFlatObject = {};

                    Object.keys(data.AvailableLanguages).forEach(function (lcid) {
                        itemResourcesAsFlatObject[data.AvailableLanguages[lcid] + ' (' + lcid + ')'] = itemResources[lcid];
                    });

                    return itemResourcesAsFlatObject;
                }));

                XLSX.utils.book_append_sheet(workbook, worksheet, resource.name);
            });

            XLSX.writeFile(workbook, "sheetjs.xlsx");
        });
    });

})(window, window.angular, window.chrome, window.localStorage, window.sessionStorage, window.document);