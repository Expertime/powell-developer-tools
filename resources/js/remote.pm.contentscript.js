(function (window, angular, document, undefined) {
    var pmJsCoreLoaded = new Promise(resolve => {
        var _this = this;

        var pmJsCoreScript = document.querySelector('script[src*="/Content/js/site.min.js"]');
        if (!pmJsCoreScript) {
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (!mutation.addedNodes) return;

                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        // do things to your newly added nodes here
                        var node = mutation.addedNodes[i];
                        if (node.src && node.src.match(/Content\/js\/site.min.js/i)) {
                            // stop watching using:
                            observer.disconnect();
                            _this(resolve);
                        }
                    }
                });
            });

            observer.observe(document.head, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false,
            });
        } else if (!angular) {
            pmJsCoreScript.addEventListener('load', function () {
                resolve();
            });
        } else {
            resolve();
        }
    });

    pmJsCoreLoaded.then(() => {
        /***
            Copyright 2013 Teun Duynstee
            Licensed under the Apache License, Version 2.0 (the "License");
            you may not use this file except in compliance with the License.
            You may obtain a copy of the License at
                http://www.apache.org/licenses/LICENSE-2.0
            Unless required by applicable law or agreed to in writing, software
            distributed under the License is distributed on an "AS IS" BASIS,
            WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
            See the License for the specific language governing permissions and
            limitations under the License.
        */
        var firstBy = (function () {

            function identity(v) {
                return v;
            }

            function ignoreCase(v) {
                return typeof (v) === "string" ? v.toLowerCase() : v;
            }

            function makeCompareFunction(f, opt) {
                opt = typeof (opt) === "number" ? {
                    direction: opt
                } : opt || {};
                if (typeof (f) != "function") {
                    var prop = f;
                    // make unary function
                    f = function (v1) {
                        return !!v1[prop] ? v1[prop] : "";
                    };
                }
                if (f.length === 1) {
                    // f is a unary function mapping a single item to its sort score
                    var uf = f;
                    var preprocess = opt.ignoreCase ? ignoreCase : identity;
                    var cmp = opt.cmp || function (v1, v2) {
                        return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
                    };
                    f = function (v1, v2) {
                        return cmp(preprocess(uf(v1)), preprocess(uf(v2)));
                    };
                }
                if (opt.direction === -1) return function (v1, v2) {
                    return -f(v1, v2);
                };
                return f;
            }

            /* adds a secondary compare function to the target function (`this` context)
            which is applied in case the first one returns 0 (equal)
            returns a new compare function, which has a `thenBy` method as well */
            function tb(func, opt) {
                /* should get value false for the first call. This can be done by calling the 
                exported function, or the firstBy property on it (for es6 module compatibility)
                */
                var x = (typeof (this) == "function" && !this.firstBy) ? this : false;
                var y = makeCompareFunction(func, opt);
                var f = x ? function (a, b) {
                        return x(a, b) || y(a, b);
                    } :
                    y;
                f.thenBy = tb;
                return f;
            }
            tb.firstBy = tb;
            return tb;
        })();


        function resourcesManagerControllerModule($rootScope, $scope, apiService) {
            return new ResourcesManagerController($rootScope, $scope, apiService);
        }

        var ResourcesManagerController = function ($rootScope, $scope, apiService) {
            $rootScope.$on('import-export-status-change', (event, args) => {
                $rootScope.loading = args.loading;
            });

            var genericConsolidate = (items, itemType, itemCallback) => {
                return items.reduce((itemsAndAdditionalParams, item) => {
                    var itemToAdd = {
                        Id: item.Id,
                        _Property: itemType.localizedParam
                    };
                    itemToAdd[itemType.localizedParam] = item[itemType.localizedParam];
                    if (itemType.additionalInfo) {
                        itemType.additionalInfo.forEach(additionalInfo => {
                            itemToAdd[additionalInfo] = item[additionalInfo];
                        });
                    }
                    if (itemType.additionalLocalizedParams) {
                        itemType.additionalLocalizedParams.forEach(additionalLocalizedParam => {
                            itemToAdd[additionalLocalizedParam.param] = item[additionalLocalizedParam.param];
                        });
                    }
                    if (itemCallback && 'function' === typeof itemCallback) {
                        itemCallback(itemsAndAdditionalParams, itemToAdd, item);
                    } else {
                        itemsAndAdditionalParams.push(itemToAdd);
                    }
                    // manageAdditionalParams(itemType, item, itemsAndAdditionalParams);
                    return itemsAndAdditionalParams;
                }, []);
            };

            var genericFromSheetObject = (item, itemType, itemTypeCallback) => {
                var resourcedItem = {
                    Id: item.ID
                };
                resourcedItem[itemType.localizedParam] = Object.keys(item)
                    .filter(language => language.match(/\(\d{1}|\d{4,5}\)$/))
                    .map(language => {
                        var LCID = language.match(/\((\d{1}|\d{4,5})\)$/);
                        return {
                            LCID: LCID[1],
                            Value: item[language]
                        };
                    });
                if (itemType.additionalLocalizedParams) {
                    itemType.additionalLocalizedParams.forEach(additionalParam => {
                        if (resourcedItem[itemType.localizedParam][0] &&
                            resourcedItem[itemType.localizedParam][0].Value &&
                            resourcedItem[itemType.localizedParam][0].Value.indexOf(additionalParam.prefix) > -1) {
                            resourcedItem = _.cloneDeep(resourcedItem[itemType.localizedParam]);
                            resourcedItem[0].Value = resourcedItem[0].Value.split(additionalParam.prefix)[1];
                            resourcedItem._AdditionalParamName = additionalParam.param;
                        } else if (item[additionalParam.param]) {
                            resourcedItem[additionalParam.param] = Object.keys(item[additionalParam.param])
                                .filter(language => language.match(/\(\d{1}|\d{4,5}\)$/))
                                .map(language => {
                                    var LCID = language.match(/\((\d{1}|\d{4,5})\)$/);
                                    return {
                                        LCID: LCID[1],
                                        Value: item[additionalParam.param][language]
                                    };
                                });
                        }
                    });
                }

                return itemTypeCallback ? itemTypeCallback(resourcedItem, item, itemType) : resourcedItem;
            };
            var genericComparator = (managerItem, sheetItem) => managerItem.Id === sheetItem.Id;

            var ITEM_TYPES = {
                'FIELD': {
                    order: 1,
                    name: 'Fields',
                    sheetName: 'Fields',
                    require: ['CONTENT_TYPE'],
                    localizedParam: 'DisplayName',
                    additionalLocalizedParams: [{
                        param: 'Description',
                        prefix: 'DESCRIPTION: '
                    }],
                    additionalInfo: [
                        'ContentTypeName'
                    ],
                    createParams: [
                        'Id',
                        'Name',
                        'DisplayName',
                        'Description',
                        'ShowInDisplayForm',
                        'ShowInEditForm',
                        'ShowInNewForm',
                        'ShowInDefaultView',
                        'Required',
                        'Searchable',
                        'Order',
                        'Hidden',
                        'Config',
                        'FieldId',
                        'FieldTypeId',
                        'ContentTypeId',
                        'FieldsOrderJson',
                        'ClientSideComponentId'
                    ],
                    initFlatObject: field => ({
                        ID: field.Id,
                        CONTENT_TYPE: field.ContentTypeName,
                        FIELD_PROPERTY: field._Property
                    }),
                    consolidate: fields => genericConsolidate(fields, ITEM_TYPES.FIELD, (fieldsAndAdditionalParams, fieldToAdd, field) => {
                        var fieldAlreadyAdded = fieldsAndAdditionalParams.find(field => {
                            return field.Id === fieldToAdd.Id;
                        });
                        if (fieldAlreadyAdded) {
                            fieldAlreadyAdded.ContentTypeName += ', ' + field.ContentTypeName;
                        } else {
                            fieldsAndAdditionalParams.push(fieldToAdd);
                        }
                    }),
                    fromSheetObject: field => genericFromSheetObject(field, ITEM_TYPES.FIELD),
                    comparator: genericComparator
                },
                'CONTENT_TYPE': {
                    order: 2,
                    name: 'ContentTypes',
                    sheetName: 'Content types',
                    require: [],
                    waitBeforeGet: [
                        'FIELD'
                    ],
                    localizedParam: 'Name',
                    additionalLocalizedParams: [{
                        param: 'Description',
                        prefix: 'DESCRIPTION: '
                    }],
                    createParams: [
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
                    ],
                    initFlatObject: contentType => ({
                        ID: contentType.Id,
                        CONTENT_TYPE_PROPERTY: contentType._Property
                    }),
                    consolidate: contentTypes => genericConsolidate(contentTypes, ITEM_TYPES.CONTENT_TYPE),
                    fromSheetObject: contentType => genericFromSheetObject(contentType, ITEM_TYPES.CONTENT_TYPE),
                    comparator: genericComparator
                },
                'LIST_TEMPLATE': {
                    order: 3,
                    name: 'ListTemplates',
                    sheetName: 'List templates',
                    require: [],
                    waitBeforeGet: [
                        'CONTENT_TYPE'
                    ],
                    localizedParam: 'Title',
                    createParams: [
                        'ContentTypes',
                        'DataModeProvisioning',
                        'DataProvisioningJson',
                        'DataProvisioningXml',
                        'DataProvisioningZipBase64',
                        'DataProvisioningZipId',
                        'DataProvisioningZipInfoName=$ITEM_FROM_MANAGER.DataProvisioningZip.Name + "." + $ITEM_FROM_MANAGER.DataProvisioningZip.Extension',
                        'Description',
                        'EnableFolderCreation',
                        'EnableMinorVersions',
                        'EnableModeration',
                        'EnableRating',
                        'EnableVersioning',
                        'ForceCheckout',
                        'HasDataProvisioningZip=$ITEM_FROM_MANAGER.DataProvisioningZip !== null',
                        'Hidden',
                        'Id',
                        'IsAddContent',
                        'IsIndexable',
                        'IsSearchable',
                        'IsSystemList',
                        'IsTemplate',
                        'RemoveStandardViews',
                        'SiteTemplateId',
                        'TemplateTypeId',
                        'Title',
                        'Url',
                        'ValidationFormula',
                        'ValidationUserMessage',
                        'VersioningConfigTemp=$ITEM_FROM_MANAGER.VersioningConfigObject',
                        'ViewCollection'
                    ],
                    initFlatObject: listTemplate => ({
                        ID: listTemplate.Id
                    }),
                    consolidate: listTemplates => genericConsolidate(listTemplates, ITEM_TYPES.LIST_TEMPLATE),
                    fromSheetObject: listTemplate => genericFromSheetObject(listTemplate, ITEM_TYPES.LIST_TEMPLATE),
                    comparator: genericComparator
                },
                'SITE_TEMPLATE': {
                    order: 4,
                    name: 'SiteTemplates',
                    sheetName: 'Site templates',
                    require: [],
                    localizedParam: 'Title',
                    createParams: [
                        'AvailablePageTemplates',
                        'AvailableWidgets',
                        'Classification',
                        'DefaultPageLayoutId',
                        'DescriptionFunc',
                        'FrameworkId',
                        'GroupId',
                        'HasSaveAsTemplate',
                        'Id',
                        'IsOfficeGroup',
                        'IsPublic',
                        'NavigationIncludeTypeCurrentNavigationId',
                        'NavigationQuickLaunch',
                        'NavigationShowSiblings',
                        'NavigationSourceCurrentNavigationId',
                        'PageLayouts',
                        'PageLayoutsAll',
                        'PropertyBag',
                        'PropertyBagValue',
                        'SaveAsTemplateDescription',
                        'SaveAsTemplateName',
                        'Title',
                        'UploadedPictureBase64',
                        'UsePowellFeatures',
                        'WebPropertiesMetadata',
                        'WidgetFiles',
                        'WidgetThemeId'
                    ],
                    initFlatObject: siteTemplate => ({
                        ID: siteTemplate.Id
                    }),
                    consolidate: siteTemplates => genericConsolidate(siteTemplates, ITEM_TYPES.SITE_TEMPLATE),
                    fromSheetObject: siteTemplate => genericFromSheetObject(siteTemplate, ITEM_TYPES.SITE_TEMPLATE),
                    comparator: genericComparator
                },
                'PAGE': {
                    order: 5,
                    name: 'Pages',
                    sheetName: 'Pages',
                    require: ['SITE_TEMPLATE'],
                    skipCreateIfSelected: ['WIDGET'],
                    localizedParam: 'Name',
                    additionalInfo: [
                        'SiteTemplateName'
                    ],
                    createParams: [
                        'BannerFileInfo',
                        'BannerId',
                        'BannerType',
                        'Description',
                        'Id',
                        'IsArticlePage',
                        'IsBannerManaged',
                        'IsPageTemplate',
                        'IsPublic',
                        'ModernAssociatedPageContentTypeId',
                        'Name',
                        'PageHeader',
                        'PageLayoutId',
                        'PreviewFileInfo',
                        'RowVersionValue',
                        'ShowPageTitle',
                        'SiteTemplateId',
                        'SubWebId',
                        'TenantAuthenticationId',
                        'TitlePosition',
                        'Url',
                        'UsePowellFeatures',
                        'WebParts',
                        'WithCommentModule'
                    ],
                    initFlatObject: page => ({
                        ID: page.Id,
                        SITE_TEMPLATE: page.SiteTemplateName
                    }),
                    consolidate: pages => genericConsolidate(pages, ITEM_TYPES.PAGE),
                    fromSheetObject: page => genericFromSheetObject(page, ITEM_TYPES.PAGE),
                    comparator: genericComparator
                },
                'PAGE_TEMPLATE': {
                    order: 6,
                    name: 'PageTemplates',
                    sheetName: 'Page templates',
                    require: [],
                    skipCreateIfSelected: ['WIDGET'],
                    localizedParam: 'Name',
                    createParams: [
                        'BannerFileInfo',
                        'BannerId',
                        'BannerType',
                        'Description',
                        'Id',
                        'IsArticlePage',
                        'IsBannerManaged',
                        'IsPageTemplate',
                        'IsPublic',
                        'Name',
                        'PageLayoutId',
                        'PreviewFileInfo',
                        'RowVersionValue',
                        'ShowPageTitle',
                        'SiteTemplateId',
                        'SubWebId',
                        'TenantAuthenticationId',
                        'TitlePosition',
                        'Url',
                        'UsePowellFeatures',
                        'WebParts',
                        'WithCommentModule'
                    ],
                    initFlatObject: page => ({
                        ID: page.Id
                    }),
                    consolidate: pageTemplates => genericConsolidate(pageTemplates, ITEM_TYPES.PAGE_TEMPLATE),
                    fromSheetObject: pageTemplate => genericFromSheetObject(pageTemplate, ITEM_TYPES.PAGE_TEMPLATE),
                    comparator: genericComparator
                },
                'WIDGET': {
                    order: 7,
                    name: 'Widgets',
                    sheetName: 'Widgets',
                    require: ['PAGE', 'PAGE_TEMPLATE'],
                    consolidateBeforeSave: {
                        parentItemType: 'PAGE',
                        storeInto: 'WebParts'
                    },
                    localizedParam: 'Title',
                    createParams: [
                        'Code',
                        'Config',
                        'DescriptionTech',
                        'DisplayName',
                        'Form',
                        'FrameType',
                        'Id',
                        'IsClassicWebPart',
                        'IsModernWebPart',
                        'IsPowellComponent',
                        'JsonWidgetConfig',
                        'Schema',
                        'ThemeId',
                        'Title',
                        'TitleIconUrl',
                        'WebPartCode',
                        'WebPartId',
                        'WebPartOrder',
                        'WebPartZoneCode',
                        'WebPartZoneLabel',
                        'WidgetCode',
                        'WidgetFileDisplayTemplateId',
                        'WidgetFileId',
                        'WidgetGuid',
                        'WidgetId',
                        'WidgetType',
                        'WidgetTypeCode',
                        'WidgetTypeId'
                    ],
                    initFlatObject: widget => ({
                        ID: widget.Id,
                        PAGE_ID: widget.PageId,
                        WIDGET_TYPE: widget.WidgetName === 'powell-365-modern-component-client-side-solution.sppkg' ? 'Powell 365 Script Editor' : widget.WidgetName,
                        SITE_TEMPLATE: widget.SiteTemplateName,
                        PAGE_TEMPLATE: !widget.SiteTemplateName ? widget.PageName : null,
                        PAGE: widget.SiteTemplateName ? widget.PageName : null,
                        WIDGET_NAME: widget.LocalizedTitle,
                        WIDGET_PROPERTY: widget._Property
                    }),
                    consolidate: widgets => {
                        return widgets.reduce((widgetsProperties, widget) => {
                            widgetsProperties.push({
                                Id: widget.Id,
                                PageId: widget.PageId,
                                WidgetName: widget.Widget.Name,
                                SiteTemplateName: widget.SiteTemplateName,
                                PageName: widget.PageName,
                                Title: widget.Title,
                                LocalizedTitle: widget.LocalizedTitle.toUpperCase(),
                                _Property: 'Title',
                            });
                            if (WIDGET_TYPES[widget.Widget.Name]) {
                                widgetsProperties = widgetsProperties.concat(flattenWidgetConfig(widget));
                            }
                            return widgetsProperties;
                        }, []);
                    },
                    fromSheetObject: (widget, languages) => genericFromSheetObject(widget, ITEM_TYPES.WIDGET, resourcedWidget => {
                        resourcedWidget.PageId = widget.PAGE_ID;
                        resourcedWidget.IsFromPageTemplate = widget.PAGE_TEMPLATE !== undefined;
                        if (WIDGET_TYPES[widget.WIDGET_TYPE]) {
                            resourcedWidget.Config = {};
                            if (widget.Config) {
                                Object.keys(widget.Config).forEach(widgetProperty => {
                                    var widgetPropertyValue = genericFromSheetObject(widget.Config[widgetProperty], {
                                        localizedParam: widgetProperty
                                    }, resourcedWidgetProperty => resourcedWidgetProperty[widgetProperty]);
                                    widgetPropertyValue = widgetPropertyValue.map(localizedValue => {
                                        var language = _.find(languages, language => language.Lcid.toString() === localizedValue.LCID);
                                        localizedValue.LCID = parseInt(localizedValue.LCID, 10);
                                        localizedValue.Code = language.Code;
                                        if (language.Code !== null) {
                                            localizedValue.Label = language.Title;
                                        } else {
                                            localizedValue.LCID = 0;
                                        }
                                        return localizedValue;
                                    });
                                    var localizedParam = WIDGET_TYPES[widget.WIDGET_TYPE].localizedParams.find(param => widgetProperty.match(new RegExp('^' + param.title.replace('$param', '(.+)'))));
                                    localizedParam.param = localizedParam.param.split('|')[0];
                                    if (localizedParam.iterate) {
                                        var index = _.get(resourcedWidget.Config, localizedParam.param.split('[]')[0], []).length;
                                        _.set(resourcedWidget.Config, localizedParam.param.replace('[]', '[' + index + ']'), localizedParam.storeAsJson ? JSON.stringify(widgetPropertyValue) : widgetPropertyValue);
                                        if (localizedParam.updateAlso) {
                                            localizedParam.updateAlso.forEach(updateAlso => {
                                                if (updateAlso.defaultValueOnly) {
                                                    _.set(resourcedWidget.Config, updateAlso.param.replace('[]', '[' + index + ']'), widgetPropertyValue[0].Value);
                                                } else {
                                                    _.set(resourcedWidget.Config, updateAlso.param.replace('[]', '[' + index + ']'), updateAlso.storeAsJson ? JSON.stringify(widgetPropertyValue) : widgetPropertyValue);
                                                }
                                            });
                                        }
                                    } else {
                                        _.set(resourcedWidget.Config, localizedParam.param, localizedParam.storeAsJson ? JSON.stringify(widgetPropertyValue) : widgetPropertyValue);
                                        if (localizedParam.updateAlso) {
                                            localizedParam.updateAlso.forEach(updateAlso => {
                                                if (updateAlso.defaultValueOnly) {
                                                    _.set(resourcedWidget.Config, updateAlso.param, widgetPropertyValue[0].Value);
                                                } else {
                                                    _.set(resourcedWidget.Config, updateAlso.param, updateAlso.storeAsJson ? JSON.stringify(widgetPropertyValue) : widgetPropertyValue);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                        return resourcedWidget;
                    }),
                    comparator: genericComparator
                },
                'LIST': {
                    order: 8,
                    name: 'Lists',
                    sheetName: 'Lists',
                    require: ['SITE_TEMPLATE'],
                    localizedParam: 'Title',
                    additionalLocalizedParams: [{
                        param: 'Description',
                        prefix: 'DESCRIPTION: '
                    }],
                    additionalInfo: [
                        'SiteTemplateName'
                    ],
                    createParams: [
                        'Id',
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
                        'Title',
                        'SiteTemplateId',
                        'IsSystemList',
                        'IsStandard',
                        'IsAddContent',
                        'RemoveStandardViews',
                        'ContentTypesAll'
                    ],
                    initFlatObject: list => ({
                        ID: list.Id,
                        SITE_TEMPLATE: list.SiteTemplateName,
                        LIST_PROPERTY: list._Property
                    }),
                    consolidate: lists => genericConsolidate(lists, ITEM_TYPES.LIST),
                    fromSheetObject: list => genericFromSheetObject(list, ITEM_TYPES.LIST),
                    comparator: genericComparator
                },
                'NAVIGATION': {
                    order: 9,
                    name: 'Navigations',
                    sheetName: 'Navigations',
                    require: [],
                    localizedParam: 'Title',
                    additionalLocalizedParams: [{
                        param: 'SeeMoreLabel',
                        prefix: 'SEE MORE: '
                    }],
                    createParams: [
                        'BindingsJson',
                        'ChildrenNodes',
                        'CssClass',
                        'Description',
                        'HideTopLevelIfNoResults',
                        'Id',
                        'ImageSrc',
                        'IsAdvancedMode',
                        'IsEmptyTitle',
                        'IsHeader',
                        'IsQuery',
                        'IsStatic',
                        'KeepOriginalSize',
                        'LocalizationDescription',
                        'LocalizationSeeMore',
                        'LocalizationTitle',
                        'LocalizedTitle',
                        'OpenLinkInNewWindow',
                        'ParentNodeId',
                        'Query',
                        'RowLimit',
                        'Scope',
                        'SeeMoreLabel',
                        'ShowGroups',
                        'ShowHeaderInSimpleList',
                        'ShowHeaderWithImage',
                        'ShowInDropDown',
                        'ShowOnlyFavorites',
                        'ShowWebLogo',
                        'SortByDirection',
                        'SortByField',
                        'Template',
                        'TemplateId:',
                        'Title',
                        'URL'
                    ],
                    initFlatObject: navigationNode => ({
                        ID: navigationNode.Id,
                        NAVIGATION_ID: navigationNode.NavigationId,
                        NAVIGATION: navigationNode.NavigationName
                    }),
                    consolidate: navigations => {
                        return navigations.reduce((navigationNodes, navigation) => {
                            return navigationNodes.concat(flattenTree(navigation, ['Nodes', 'ChildrenNodes'], navigationNode => {
                                navigationNode.NavigationId = navigation.Id;
                                navigationNode.NavigationName = navigation.Title;
                            }, false, ITEM_TYPES.NAVIGATION));
                        }, []);
                    },
                    fromSheetObject: navigation => {
                        var indexedNodes = [];
                        navigation.Nodes.forEach(navigationNode => {
                            indexedNodes[navigationNode.ID] = genericFromSheetObject(navigationNode, ITEM_TYPES.NAVIGATION, resourcedNavigationNode => {
                                if (resourcedNavigationNode._AdditionalParamName) {
                                    ITEM_TYPES.NAVIGATION.additionalLocalizedParams.forEach(additionalParam => {
                                        if (resourcedNavigationNode._AdditionalParamName === additionalParam.param) {
                                            indexedNodes[navigationNode.ID][additionalParam.param] = resourcedNavigationNode;
                                        }
                                    });
                                    return indexedNodes[navigationNode.ID];
                                } else {
                                    resourcedNavigationNode.NavigationId = navigationNode.NAVIGATION_ID;
                                    if (resourcedNavigationNode[ITEM_TYPES.NAVIGATION.localizedParam][0]) {
                                        resourcedNavigationNode[ITEM_TYPES.NAVIGATION.localizedParam][0].Value =
                                            resourcedNavigationNode[ITEM_TYPES.NAVIGATION.localizedParam][0].Value.replace(/((\||└| )[─ ]{3})+ /, '');
                                    }
                                    return resourcedNavigationNode;
                                }
                            });
                        });
                        navigation.Nodes = indexedNodes;
                        return navigation;
                    },
                    comparator: (managerItem, sheetItem) => managerItem.Id === sheetItem.Id && (sheetItem.NavigationId ? managerItem.NavigationId === sheetItem.NavigationId : true)
                },
                'SITE_COLLECTION': {
                    order: 10,
                    name: 'SiteCollections',
                    require: [],
                    localizedParam: null,
                    createParams: [
                        'AllowFileSharingForGuestUsers',
                        'AlternateLanguagesAll=$ITEM_FROM_MANAGER.AlternateLanguages',
                        'Description',
                        'EnableDeploymentStatus',
                        'EnvironmentDevProjectConfig',
                        'EnvironmentDevProjectConfigId',
                        'EnvironmentId=$scope.$eval("EnvironmentId")',
                        'EnvironmentRecetteProjectConfig',
                        'EnvironmentRecetteProjectConfigId',
                        'HasAppCatalog',
                        'HasVariations',
                        'Id',
                        'ImportTerms',
                        'IsLocalTerms',
                        'IsTemplate',
                        'LabelsJson',
                        'LanguagesAll=$ITEM_FROM_MANAGER.Languages',
                        'LocalPathForBranding',
                        'ModelSiteCollectionId',
                        'Owner',
                        'PreviewFileInfo',
                        'PreviewId',
                        'PrincipalLanguageId',
                        'ProjectConfig',
                        'ProjectConfigId',
                        'RootSiteTemplateId',
                        'SiteScriptsToUpdate',
                        'StorageMaximumLevel',
                        'TenantAuthentificationId',
                        'TimeZoneId',
                        'Title',
                        'UrlEnvironmentDev=$ITEM_FROM_MANAGER.UrlEnvironmentDev.match(/:\\/\\/[^/]+(\\/[^/]+\\/.+)/)[1]',
                        'UrlEnvironmentRecette=$ITEM_FROM_MANAGER.UrlEnvironmentRecette.match(/:\\/\\/[^/]+(\\/[^/]+\\/.+)/)[1]',
                        'UrlEnvironmentProd=$ITEM_FROM_MANAGER.UrlEnvironmentProd.match(/:\\/\\/[^/]+(\\/[^/]+\\/.+)/)[1]',
                        'UseSiteScripts',
                        'UseSiteTemplate',
                        'UserCodeMaximumLevel',
                        'WebTemplateId',
                        'WebTemplateType',
                        'Webs'
                    ],
                    initFlatObject: site => ({
                        ID: site.Id,
                        SITE_COLLECTION_ID: site.SiteCollectionId,
                        SITE_COLLECTION: site.SiteCollectionName
                    }),
                    consolidate: siteCollections => {
                        return siteCollections.reduce((sites, siteWithChildren) => {
                            return sites.concat(flattenTree(siteWithChildren, 'ChildrenWebs', site => {
                                site.SiteCollectionName = siteWithChildren.SiteCollectionName;
                                site.SiteCollectionId = siteWithChildren.SiteCollectionId;
                            }, true, ITEM_TYPES.SITE_COLLECTION));
                        }, []);
                    },
                    fromSheetObject: siteCollection => {
                        var indexedNodes = [];
                        siteCollection.Webs.forEach(site => {
                            indexedNodes[site.ID] = genericFromSheetObject(site, ITEM_TYPES.SITE, resourcedSite => {
                                resourcedSite.SiteCollectionId = site.SITE_COLLECTION_ID;
                                if (resourcedSite[ITEM_TYPES.SITE.localizedParam][0]) {
                                    resourcedSite[ITEM_TYPES.SITE.localizedParam][0].Value =
                                        resourcedSite[ITEM_TYPES.SITE.localizedParam][0].Value.replace(/((\||└| )[─ ]{3})+ /, '');
                                }
                                return resourcedSite;
                            });
                        });
                        siteCollection.Webs = indexedNodes;
                        return siteCollection;
                    },
                    comparator: genericComparator
                },
                'SITE': {
                    order: 11,
                    name: 'Sites',
                    sheetName: 'Sites',
                    require: ['SITE_COLLECTION'],
                    consolidateBeforeSave: {
                        parentItemType: 'SITE_COLLECTION',
                        storeInto: 'Webs'
                    },
                    localizedParam: 'Title',
                    createParams: [
                        'ChildrenWebs',
                        'Description',
                        'EditionStatus="edit"',
                        'HasBrokenRightsInheritance',
                        'HasCustomizedQuickLaunchNavigation',
                        'HasSiteLogo',
                        'Id',
                        'IsRoot',
                        'IsRootWeb=!$ITEM_FROM_MANAGER.ParentWebId',
                        'Level=$ITEM_FROM_MANAGER.ParentWebId && (parentWeb = $PARENT_ITEM_FROM_MANAGER.Webs.find(web => web.Id === $ITEM_FROM_MANAGER.ParentWebId)) && parentWeb.Level + 1 || 0',
                        'Lists',
                        'LocalizationTitle',
                        'LocalizedTitle',
                        'ManageSiteLogo',
                        'MasterPageBoId',
                        'MasterPageId',
                        'NavigationIncludeTypeCurrentNavigation',
                        'NavigationIncludeTypeCurrentNavigationId',
                        'NavigationIncludeTypeGlobalNavigationId',
                        'NavigationQuickLaunch',
                        'NavigationShowSiblings',
                        'NavigationSourceCurrentNavigationId',
                        'NavigationSourceGlobalNavigationId',
                        'Pages',
                        'ParentWebId',
                        'PrincipalLanguageId',
                        'PrincipalLanguageName',
                        'SearchNavigation',
                        'ServerRelativeUrl',
                        'SiteLogo',
                        'SiteLogoBase64',
                        'SiteTemplate',
                        'SiteTemplateId',
                        'TimeZoneId',
                        'Title',
                        'Url',
                        'WebPropertiesMetadata',
                        'WebTempGuid',
                        'WebTemplate',
                        'WebTemplateId',
                        'firstLoad',
                        'loaded',
                        'modified',
                        'parent'
                    ],
                    initFlatObject: site => ({
                        ID: site.Id,
                        SITE_COLLECTION_ID: site.SiteCollectionId,
                        SITE_COLLECTION: site.SiteCollectionName
                    }),
                    consolidate: sites => {
                        return sites.reduce((sitesFlat, siteWithChildren) => {
                            return sitesFlat.concat(flattenTree(siteWithChildren, 'ChildrenWebs', site => {
                                site.SiteCollectionName = siteWithChildren.SiteCollectionName;
                                site.SiteCollectionId = siteWithChildren.SiteCollectionId;
                            }, true, ITEM_TYPES.SITE));
                        }, []);
                    },
                    fromSheetObject: site => genericFromSheetObject(site, ITEM_TYPES.SITE, resourcedSite => {
                        resourcedSite.SiteCollectionId = site.SITE_COLLECTION_ID;
                        if (resourcedSite[ITEM_TYPES.SITE.localizedParam][0]) {
                            resourcedSite[ITEM_TYPES.SITE.localizedParam][0].Value =
                                resourcedSite[ITEM_TYPES.SITE.localizedParam][0].Value.replace(/((\||└| )[─ ]{3})+ /, '');
                        }
                        return resourcedSite;
                    }),
                    comparator: (managerItem, sheetItem) => managerItem.SiteCollectionId === sheetItem.Id
                },
                fromSheetName: sheetName => Object.values(ITEM_TYPES).find(itemType => itemType.sheetName === sheetName),
                toSheetName: itemType => Object.keys(ITEM_TYPES).find(itemTypeKey => ITEM_TYPES[itemTypeKey] === itemType)
            };

            var WIDGET_TYPES = {
                /*"Application without categories": {
                    "localizedParams": []
                },
                "BingMapWebPart": {
                    "localizedParams": []
                },
                "BoxEmbedded": {
                    "localizedParams": []
                },
                "Calendar": {
                    "localizedParams": []
                },
                "Clocks": {
                    "localizedParams": []
                },
                "ContentEmbedWebPart": {
                    "localizedParams": []
                },
                "ContentRollupWebPart": {
                    "localizedParams": []
                },
                "Delve": {
                    "localizedParams": []
                },
                "Discussion": {
                    "localizedParams": []
                },
                "DividerWebPart": {
                    "localizedParams": []
                },
                "DocumentEmbedWebPart": {
                    "localizedParams": []
                },
                "DocumentLibraryWebPart": {
                    "localizedParams": []
                },
                "DynamicCrm": {
                    "localizedParams": []
                },
                "EmbeddedVideoWebPart": {
                    "localizedParams": []
                },
                "EventOutlook": {
                    "localizedParams": []
                },
                "EventsWebPart": {
                    "localizedParams": []
                },
                "Excel Services": {
                    "localizedParams": []
                },
                "FacebookEmbedded": {
                    "localizedParams": []
                },
                "Favorites": {
                    "localizedParams": []
                },
                "Graph List View": {
                    "localizedParams": []
                },
                "GroupCalendarWebPart": {
                    "localizedParams": []
                },
                "GroupConversation": {
                    "localizedParams": []
                },
                "Groups": {
                    "localizedParams": []
                },
                "HeroWebPart": {
                    "localizedParams": []
                },
                "ImageGalleryWebPart": {
                    "localizedParams": []
                },
                "ImageWebPart": {
                    "localizedParams": []
                },
                "Instagram": {
                    "localizedParams": []
                },
                "LinkedInEmbedded": {
                    "localizedParams": []
                },
                "LinkPreviewWebPart": {
                    "localizedParams": []
                },
                "ListWebPart": {
                    "localizedParams": []
                },
                "Mails": {
                    "localizedParams": []
                },
                "MapsEmbedded": {
                    "localizedParams": []
                },
                "Members": {
                    "localizedParams": []
                },
                "Meteo": {
                    "localizedParams": []
                },
                "MicrosoftFormsWebPart": {
                    "localizedParams": []
                },
                "My Profile": {
                    "localizedParams": []
                },
                "NewsreelWebPart": {
                    "localizedParams": []
                },
                "PeopleWebPart": {
                    "localizedParams": []
                },
                "PinterestEmbedded": {
                    "localizedParams": []
                },
                "Planner": {
                    "localizedParams": []
                },
                "PlannerWebPart": {
                    "localizedParams": []
                },
                "Powell 365 Script Editor": {
                    "localizedParams": []
                },
                "PowerBI": {
                    "localizedParams": []
                },
                "PowerBIReportEmbedWebPart": {
                    "localizedParams": []
                },
                "QuickChartWebPart": {
                    "localizedParams": []
                },
                "QuickLinksWebPart": {
                    "localizedParams": []
                },
                "RSS": {
                    "localizedParams": []
                },
                "RssWebPart": {
                    "localizedParams": []
                },
                "ScriptEditor": {
                    "localizedParams": []
                },
                "SiteActivityWebPart": {
                    "localizedParams": []
                },
                "SitesWebPart": {
                    "localizedParams": []
                },
                "SpacerWebPart": {
                    "localizedParams": []
                },
                "Stock": {
                    "localizedParams": []
                },
                "StreamWebPart": {
                    "localizedParams": []
                },
                "Survey": {
                    "localizedParams": []
                },
                "TasksOutlook": {
                    "localizedParams": []
                },
                "TextEditorWebPart": {
                    "localizedParams": []
                },
                "TwitterEmbedded": {
                    "localizedParams": []
                },
                "TwitterWebPart": {
                    "localizedParams": []
                },
                "Video": {
                    "localizedParams": []
                },
                "Vimeo": {
                    "localizedParams": []
                },
                "WeatherWebPart": {
                    "localizedParams": []
                },
                "Yammer": {
                    "localizedParams": []
                },
                "YammerEmbedWebPart": {
                    "localizedParams": []
                },
                "Youtube": {
                    "localizedParams": []
                },*/
                "ContentSearch": {
                    "localizedParams": [{
                            title: '"No results" message',
                            param: 'messageIfNoResultsList',
                            updateAlso: [{
                                param: 'messageIfNoResults',
                                defaultValueOnly: true,
                            }],
                            includeIf: '{{ifNoResults}} === "message"',
                            storeAsJson: true
                        },
                        {
                            title: 'User filter: $param',
                            param: 'refiners[].displayNames|managedPropertyDisplayName|managedProperty',
                            iterate: true,
                            includeIf: '{{userCustomFilter}}',
                            storeAsJson: true
                        }
                    ]
                },
                "RefinementPanel": {
                    "localizedParams": [{
                        title: 'Refiner: $param',
                        param: 'refiners[].displayNames|managedPropertyDisplayName|managedProperty',
                        iterate: true,
                        updateAlso: [{
                            param: 'refiners[].defaultLabel',
                            defaultValueOnly: true,
                        }],
                        includeIf: '{{refiners.length}} > 0'
                    }]
                },
                "SearchBox": {
                    "localizedParams": [{
                        title: 'Search tab: $param',
                        param: 'customTabs[].Title',
                        iterate: true,
                        updateAlso: [{
                            param: 'customTabs[].LocalizationTitles',
                        }],
                        includeIf: '{{customTabs.length}} > 0',
                        storeAsJson: true
                    }]
                }
            };

            var Endpoints = {
                ResourceLanguages: {
                    get: {
                        url: '/api/language/LoadAllForResourcing',
                        body: () => null
                    }
                },
                Fields: {
                    get: {
                        url: '/api/contenttype/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/field/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/field/create',
                        body: (localization, originalField, languages) => localizableItemSetBody(localization, originalField, languages, ITEM_TYPES.FIELD)
                    }
                },
                ContentTypes: {
                    get: {
                        url: '/api/contenttype/LoadAllAvailableByTenant',
                        body: () => null
                    },
                    getBySheetItem: {
                        url: '/api/contenttype/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/contenttype/create',
                        body: (localization, originalContentType, languages) => localizableItemSetBody(localization, originalContentType, languages, ITEM_TYPES.CONTENT_TYPE)
                    }
                },
                ListTemplates: {
                    get: {
                        url: '/api/list/LoadListTemplatesPaged',
                        body: pageSize => ({
                            ResultSource: 0,
                            Page: 0,
                            PageSize: pageSize
                        })
                    },
                    getBySheetItem: {
                        url: '/api/list/LoadListTemplateById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/list/createListTemplate',
                        body: (localization, originalListTemplate, languages) => localizableItemSetBody(localization, originalListTemplate, languages, ITEM_TYPES.LIST_TEMPLATE)
                    }
                },
                SiteTemplates: {
                    get: {
                        url: '/api/sitetemplates/LoadAll',
                        body: () => null
                    },
                    getBySheetItem: {
                        url: '/api/sitetemplates/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/sitetemplates/create',
                        body: (localization, originalSiteTemplate, languages) => localizableItemSetBody(localization, originalSiteTemplate, languages, ITEM_TYPES.SITE_TEMPLATE)
                    }
                },
                Pages: {
                    get: {
                        url: '/api/page/LoadBySiteId',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/page/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/page/create',
                        body: (localization, originalPage, languages) => localizableItemSetBody(localization, originalPage, languages, ITEM_TYPES.PAGE)
                    }
                },
                PageTemplates: {
                    get: {
                        url: '/api/page/LoadPageTemplateByTenantId',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/page/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/page/create',
                        body: (localization, originalPage, languages) => localizableItemSetBody(localization, originalPage, languages, ITEM_TYPES.PAGE_TEMPLATE)
                    }
                },
                Widgets: {
                    get: {
                        url: '/api/page/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/page/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        body: (localization, originalWidget, languages) => localizableItemSetBody(localization, originalWidget, languages, ITEM_TYPES.WIDGET)
                    }
                },
                WidgetsInPageTemplates: {
                    get: {
                        url: '/api/page/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/page/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        body: (localization, originalWidget, languages) => localizableItemSetBody(localization, originalWidget, languages, ITEM_TYPES.WIDGET_IN_PAGE_TEMPLATE)
                    }
                },
                Lists: {
                    get: {
                        url: '/api/list/LoadListsBySiteId',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/list/LoadById',
                        body: id => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/list/Create',
                        body: (localization, originalList, languages) => localizableItemSetBody(localization, originalList, languages, ITEM_TYPES.LIST)
                    }
                },
                Navigations: {
                    get: {
                        url: '/api/navigation/LoadAll',
                        body: () => null
                    },
                    set: {
                        url: '/api/navigation/Create',
                        body: (localization, originalNavigation, languages) => localizableItemSetBody(localization, originalNavigation, languages, ITEM_TYPES.NAVIGATION)
                    }
                },
                SiteCollections: {
                    get: {
                        url: '/api/sitecollection/LoadByTenantPaged',
                        body: pageSize => ({
                            ResultSource: 0,
                            Page: 0,
                            PageSize: pageSize
                        })
                    },
                    getBySheetItem: {
                        url: '/api/sitecollection/LoadById',
                        body: (id) => ({
                            Id: id
                        })
                    },
                    set: {
                        url: '/api/sitecollection/Create',
                        body: (localization, originalSiteCollection, languages) => localizableItemSetBody(localization, originalSiteCollection, languages, ITEM_TYPES.SITE_COLLECTION)
                    }
                },
                Sites: {
                    get: {
                        url: '/api/subweb/LoadBySiteCollection',
                        body: id => ({
                            Id: id
                        })
                    },
                    getBySheetItem: {
                        url: '/api/subweb/LoadById',
                        body: (id, siteCollectionId) => ({
                            Id: id,
                            SiteCollectionId: siteCollectionId
                        })
                    },
                    set: {
                        body: (localization, originalSite, languages) => localizableItemSetBody(localization, originalSite, languages, ITEM_TYPES.SITE)
                    }
                },
            };

            var ManagerBaseUrl = 'https://manager.powell-365.com/api/';

            var findOwnProperty = function (properties, object) {
                return Array.isArray(properties) ? properties.filter(property => object.hasOwnProperty(property)) : properties;
            };

            var tryParseResource = function (item, localizedParam) {
                try {
                    var resources = {};
                    JSON.parse(item[localizedParam]).forEach(resource => resources[resource.LCID] = resource);
                    return resources;
                } catch (exception) {
                    return { 0: {
                        Code: null,
                        LCID: 0,
                        Value: item[localizedParam]
                    }};
                }
            };

            var localizableItemSetBody = function (localization, originalLocalizableItem, languages, itemType) {
                var bodyForCreate = {};

                var generateBody = (itemType, localization, languages, originalLocalizableItem) => {
                    var createParams = itemType.createParams;
                    var localizedParam = itemType.localizedParam;
                    var originalItem = originalLocalizableItem.itemFromManager;
                    var originalItemParent = originalLocalizableItem.parentItem;
                    return createParams.reduce((body, param) => {
                        if (localization && param === localizedParam ||
                            itemType.additionalLocalizedParams && itemType.additionalLocalizedParams.find(additionalParam => additionalParam.param === param) && localization[param]) {
                            body[param] = JSON.stringify(localization[param].map(localizedValue => {
                                var language = _.find(languages, language => language.Lcid.toString() === localizedValue.LCID);
                                localizedValue.Code = language.Code;
                                if (language.Code !== null) {
                                    localizedValue.Label = language.Title;
                                } else {
                                    localizedValue.LCID = 0;
                                }
                                return localizedValue;
                            }));
                        } else {
                            if (param.indexOf('=') > -1) {
                                var expression = param.match(/([^=]+)=(.+)/);
                                if (originalItem.hasOwnProperty(expression[1])) {
                                    var expressionToEval = expression[2].replace(/\$ITEM_FROM_MANAGER/gi, 'originalItem').replace(/\$PARENT_ITEM_FROM_MANAGER/gi, 'originalItemParent');
                                    try {
                                        body[expression[1]] = eval(expressionToEval);
                                    } catch (ex) {
                                        body[expression[1]] = null;
                                    }
                                }
                            } else {
                                if (originalItem.hasOwnProperty(param)) {
                                    body[param] = originalItem[param];
                                }
                            }
                        }
                        return body;
                    }, {});
                };

                switch (itemType) {
                    case ITEM_TYPES.NAVIGATION:
                        bodyForCreate = runThroughTree(originalLocalizableItem.itemFromManager, ['Nodes', 'ChildrenNodes'], item => {
                            return generateBody(itemType, localization.Nodes[item.Id], languages, {itemFromManager: item});
                        }, false);
                        break;

                    case ITEM_TYPES.WIDGET:
                    case ITEM_TYPES.WIDGET_IN_PAGE_TEMPLATE:
                        bodyForCreate = generateBody(itemType, localization, languages, originalLocalizableItem);
                        if (originalLocalizableItem.itemFromManager.Config && localization.Config) {
                            bodyForCreate.Config = JSON.stringify(_.merge(JSON.parse(originalLocalizableItem.itemFromManager.Config), localization.Config));
                        }
                        break;
                    default:
                        bodyForCreate = generateBody(itemType, localization, languages, originalLocalizableItem);
                        break;
                }
                return bodyForCreate;
            };

            var manageAdditionalParams = function (itemType, currentItem, items, childrenProperties) {
                if (itemType.additionalLocalizedParams) {
                    itemType.additionalLocalizedParams.forEach((additionalLocalizedParam, index) => {
                        if (currentItem[additionalLocalizedParam.param]) {
                            var currentItemProperty = _.cloneDeep(currentItem);
                            currentItemProperty._Parent = currentItem;
                            currentItemProperty._IsProperty = true;
                            if (index === itemType.additionalLocalizedParams.length - 1 &&
                                (!currentItem[findOwnProperty(childrenProperties, currentItem)] ||
                                    currentItem[findOwnProperty(childrenProperties, currentItem)].length === 0)) {
                                currentItemProperty._LastChild = true;
                            }
                            currentItemProperty._Property = additionalLocalizedParam.param;
                            currentItemProperty._PropertyRenderPrefix = additionalLocalizedParam.prefix;
                            currentItemProperty[itemType.localizedParam] = currentItem[additionalLocalizedParam.param];
                            items.push(currentItemProperty);
                        }
                    });
                }
            };

            var flattenWidgetConfig = function (widget) {
                var flattenProperties = [];
                var config = JSON.parse(widget.Config);
                var localizedParams = WIDGET_TYPES[widget.Widget.Name].localizedParams;
                localizedParams.forEach(localizedParam => {
                    var includeIfPreficate = localizedParam.includeIf.replace(/\{\{([^}]+)\}\}/i, (toReplace, key) => {
                        return '_.get(config, "' + key + '")';
                    });

                    if (includeIfPreficate) {
                        includeIfPreficate = eval(includeIfPreficate);
                        if (!includeIfPreficate) {
                            return;
                        }
                    }

                    var pushFlattenProperty = (config, param, widget, localizedParam) => {
                        var resourcesForParam;
                        if (param.indexOf('|')) {
                            params = param.split('|');
                            resourcesForParam = params.reduce((value, currentKey) => {
                                return value = value || _.get(config, currentKey);
                            }, '');
                        } else {
                            resourcesForParam = _.get(config, param);
                        }
                        if (!resourcesForParam) {
                            return false;
                        }
                        if (typeof resourcesForParam === 'object') {
                            resourcesForParam = JSON.stringify(resourcesForParam);
                        }

                        var optionalParamTitle;
                        try {
                            optionalParamTitle = JSON.parse(resourcesForParam).find(resource => resource.LCID === '0' || resource.LCID === 0).Value;
                        } catch (ex) {
                            optionalParamTitle = resourcesForParam;
                        }

                        var propertyAsObject = {
                            Id: widget.Id,
                            PageId: widget.PageId,
                            WidgetName: widget.Widget.Name,
                            SiteTemplateName: widget.SiteTemplateName,
                            PageName: widget.PageName,
                            _Property: localizedParam.title.replace('$param', optionalParamTitle),
                            Title: resourcesForParam,
                            LocalizedTitle: widget.LocalizedTitle.toUpperCase()
                        };
                        flattenProperties.push(propertyAsObject);
                    };

                    if (localizedParam.iterate) {
                        var flattenIterableParam = (object, key) => {
                            var paramPaths = key.match(/\.?([^[]+(?:\[\])?)(.+|$)/i);
                            key = paramPaths[1];
                            if (key.indexOf('[]') < 0) {
                                pushFlattenProperty(object, key, widget, localizedParam);
                                return true;
                            } else {
                                key = key.slice(0, -2);
                                var keyTail = paramPaths[2];
                                var toIterate = _.get(object, key, []);
                                toIterate.forEach(iterable => {
                                    flattenIterableParam(iterable, keyTail);
                                });
                            }
                        };

                        flattenIterableParam(config, localizedParam.param);
                    } else {
                        pushFlattenProperty(config, localizedParam.param, widget, localizedParam);
                    }
                });
                return flattenProperties;
            };

            var runThroughTree = function (item, childrenProperties, itemCallback, includeRoot, rootItem) {
                rootItem = rootItem || item;
                var passParentItemToCallback = item !== rootItem || includeRoot;
                if (includeRoot && item === rootItem) {
                    var rootCallbackResult = itemCallback(item, true, null, item);
                    if (rootCallbackResult) {
                        item = rootCallbackResult;
                    }
                }
                var childrenArray = item[findOwnProperty(childrenProperties, item)];
                if (childrenArray) {
                    childrenArray.forEach((childItem, index, children) => {
                        var isLastChild = false;
                        if (index === children.length - 1) {
                            isLastChild = true;
                        }
                        var callbackResult = itemCallback(childItem, isLastChild, passParentItemToCallback ? item : null, rootItem);
                        if (callbackResult) {
                            children[index] = childItem = callbackResult;
                        }
                        runThroughTree(childItem, childrenProperties, itemCallback, includeRoot, rootItem);
                    });
                }
                return item;
            };

            var flattenTree = function (rootItem, childrenProperties, itemCallback, includeRoot, itemType) {
                var flattenItems = [];
                var rootItemClone = _.cloneDeep(rootItem);
                runThroughTree(rootItemClone, childrenProperties, (currentItem, isLastChild, parentItem, rootItem) => {
                    if (isLastChild) {
                        currentItem._LastChild = true;
                    }
                    if (parentItem) {
                        currentItem._Parent = parentItem;
                    }
                    itemCallback(currentItem, parentItem, rootItem);
                    flattenItems.push(currentItem);
                }, includeRoot);

                return flattenItems;
            };

            var renderAsTree = function (currentItem, itemResources, propertyToRender) {
                var treeIntersection = currentItem._LastChild ? '└' : '|';

                var buildTreeIndent = (item, indentString) => {
                    indentString = indentString || '';
                    var parent = item._Parent;
                    if (parent) {
                        indentString = (parent._LastChild ? '    ' : '|   ') + indentString;
                        return buildTreeIndent(parent, indentString);
                    } else {
                        return indentString;
                    }
                };

                _.set(itemResources, propertyToRender, buildTreeIndent(currentItem) + treeIntersection + (currentItem._IsProperty ? '   ' + currentItem._PropertyRenderPrefix : '─── ') + _.get(itemResources, propertyToRender));
            };

            var buildRequireChain = function (itemType) {
                var requireChain = [];
                switch(itemType) {
                    case ITEM_TYPES.CONTENT_TYPE :
                    case ITEM_TYPES.FIELD :
                    case ITEM_TYPES.LIST_TEMPLATE :
                    case ITEM_TYPES.PAGE_TEMPLATE :
                    case ITEM_TYPES.SITE_TEMPLATE :
                    case ITEM_TYPES.PAGE :
                        requireChain.push('Default (0)');
                    break;
                    
                    case ITEM_TYPES.LIST :
                    case ITEM_TYPES.WIDGET :
                    case ITEM_TYPES.NAVIGATION :
                    case ITEM_TYPES.SITE :

                        break;
                }
                var internalBuildFunction = requires => {
                    var popableRequires = Array().concat(requires);
                    if (popableRequires.length === 0) {
                        return;
                    } else {
                        requireChain.unshift(popableRequires.pop());
                        if (ITEM_TYPES[requireChain[0]].require.length > 0) {
                            internalBuildFunction(ITEM_TYPES[requireChain[0]].require);
                        }
                        internalBuildFunction(popableRequires);
                    }
                };
                internalBuildFunction(itemType.require);
                return requireChain;
            };

            var renderResource = function (resources, itemType) {
                var sortCallback = () => 0;
                var requireChain = buildRequireChain(itemType);
                if (requireChain.length === 1) {
                    sortCallback = firstBy(requireChain[0]);
                } else if (requireChain.length > 1) {
                    sortCallback = requireChain.reduce((sortChain, currentSort) => {
                        if (typeof sortChain === 'string') {
                            return firstBy(sortChain).thenBy(currentSort);
                        }
                        return sortChain.thenBy(currentSort);
                    });
                }

                var resourceItems = itemType.consolidate(resources[itemType.name].items)
                    .sort(sortCallback)
                    .reduce((resourceItemsAndAdditionalParams, item) => {
                        resourceItemsAndAdditionalParams.push(item);
                        manageAdditionalParams(itemType, item, resourceItemsAndAdditionalParams);
                        return resourceItemsAndAdditionalParams;
                    }, []);
                return resourceItems.map(item => {
                    var itemResources = tryParseResource(item, itemType.localizedParam);
                    if (itemType === ITEM_TYPES.NAVIGATION || itemType === ITEM_TYPES.SITE) {
                        renderAsTree(item, itemResources, [0, 'Value']);
                    }
                    Object.keys(itemResources).forEach(lcid => {
                        itemResources[lcid] = itemResources[lcid].Value;
                    });
                    if (!itemResources[0] || typeof itemResources[0] !== 'string') {
                        itemResources = [item.LocalizationTitle || item.LocalizationName].concat(itemResources);
                    }
                    var itemResourcesAsFlatObject = itemType.initFlatObject(item);

                    resources.availableLanguages.forEach(language => {
                        itemResourcesAsFlatObject[language.Title + ' (' + language.Lcid + ')'] = itemResources[language.Lcid];
                    });
                    return itemResourcesAsFlatObject;
                });
            };

            var importResource = function (worksheet, resources, itemType) {
                return new Promise(resolve => {
                    var itemsFromSheet;
                    switch (itemType) {
                        case ITEM_TYPES.NAVIGATION:
                            itemsFromSheet = Object.values(worksheet.reduce((navigations, navigationNode) => {
                                (navigations[navigationNode.NAVIGATION_ID] = navigations[navigationNode.NAVIGATION_ID] || {
                                    Id: navigationNode.NAVIGATION_ID,
                                    Nodes: []
                                }).Nodes.push(navigationNode);
                                return navigations;
                            }, {}));
                            break;
    
                        case ITEM_TYPES.WIDGET:
                        case ITEM_TYPES.WIDGET_IN_PAGE_TEMPLATE:
                            itemsFromSheet = Object.values(worksheet.reduce((widgets, widget) => {
                                widgets[widget.ID] = widgets[widget.ID] || widget;
                                widgets[widget.ID].Config = widgets[widget.ID].Config || {};
                                if (widget.WIDGET_PROPERTY !== itemType.localizedParam) {
                                    widgets[widget.ID].Config[widget.WIDGET_PROPERTY] = widget;
                                }
                                return widgets;
                            }, {}));
                            break;
                        
                        default:
                            itemsFromSheet = Object.values(worksheet.reduce((items, item) => {
                                items[item.ID] = items[item.ID] || item;
                                if (itemType.additionalLocalizedParams) {
                                    itemType.additionalLocalizedParams.forEach(additionalLocalizedParam => {
                                        if (item[ITEM_TYPES.toSheetName(itemType) + '_PROPERTY'] === additionalLocalizedParam.param) {
                                            items[item.ID][item[ITEM_TYPES.toSheetName(itemType) + '_PROPERTY']] = item;
                                        }
                                    });
                                }
                                return items;
                            }, {}));
                            break;
                    }
    
                    var resourceItems = new Models.ResourceItemsCollection(itemType, resources);
    
                    itemsFromSheet.forEach((item, index) => {
                        resourceItems.itemsUpdated.push(new Promise(resourceUpdatedResolve => {
                            var itemFromSheet = itemType.fromSheetObject(item, resources.availableLanguages);
    
                            resources.getCorrespondingManagerItem(itemType, itemFromSheet).then(result => {
                                try {
                                    var createItemBody;
                                    if (itemType.consolidateBeforeSave) {
                                        createItemBody = Endpoints[itemType.name].set.body(itemFromSheet, result, resources.availableLanguages);
    
                                        var parentItem = result.parentItem;
                                        var parentItemChildren = parentItem[itemType.consolidateBeforeSave.storeInto] || (parentItem[itemType.consolidateBeforeSave.storeInto] = []);
                                        var childItemIndex = _.findIndex(parentItemChildren, childItem => childItem.Id === result.itemFromManager.Id);
                                        if (parentItemChildren.length === 0 || childItemIndex === -1) {
                                            parentItemChildren.push(createItemBody);
                                        } else {
                                            parentItemChildren[childItemIndex] = createItemBody;
                                        }
    
                                        resourceUpdatedResolve(parentItem);
                                    } else {
                                        if (itemType.skipCreateIfSelected && itemType.skipCreateIfSelected.filter(skipCreateIfSelected => resources.selectedResources[skipCreateIfSelected] !== undefined)) {
                                            /*************************************************
                                             * Do nothing, children will trigger the set call
                                             *************************************************/
                                            resourceUpdatedResolve({
                                                itemFromSheet: itemFromSheet,
                                                itemFromManager: result.itemFromManager
                                            });
    
                                        } else {
                                            if (Endpoints[itemType.name].set) {
                                                createItemBody = Endpoints[itemType.name].set.body(itemFromSheet, result, resources.availableLanguages);
                                                apiService.post(Endpoints[itemType.name].set.url, createItemBody, () => {
                                                    
                                                    // console.log(Endpoints[itemType.name].set.url, createItemBody);
                                                
                                                    resourceUpdatedResolve({
                                                        itemFromSheet: itemFromSheet,
                                                        itemFromManager: result.itemFromManager
                                                    });
                                                });
                                            }
                                        }
                                    }
                                } catch (ex) {
                                    console.log(ex.message, ex.stack);
                                }
                            });
                        }));
                    });
                    Promise.all(resourceItems.itemsUpdated).then(updatedResources => {
                        var promiseForGet = resources.resourcesToWaitBeforeGet[itemType.name];
                        if (promiseForGet) {
                            promiseForGet.resolve(updatedResources);
                        }
    
                        if (itemType.consolidateBeforeSave) {
                            var parentItemType = ITEM_TYPES[itemType.consolidateBeforeSave.parentItemType];
                            var parentItemsUpdated = [];
                            Promise.all(Object.values(resources[parentItemType.name].sheetItemsLoaded)).then(items => {
                                items.forEach(item => {
                                    parentItemsUpdated.push(new Promise(parentItemUpdatedResolve => {
                                        var createItemBody;
                                        if (resources.selectedResources.find(selectedResource => selectedResource === parentItemType)) {
                                            createItemBody = Endpoints[parentItemType.name].set.body(item.itemFromSheet, item, resources.availableLanguages);
                                        } else {
                                            createItemBody = Endpoints[parentItemType.name].set.body(null, item, resources.availableLanguages);
                                        }
                                        apiService.post(Endpoints[parentItemType.name].set.url, createItemBody, () => {
                                            
                                            // console.log(Endpoints[parentItemType.name].set.url, createItemBody);
                                        
                                            parentItemUpdatedResolve();
                                        });
                                    }));
                                });
                                Promise.all(parentItemsUpdated).then(resolve);
                            });
                        } else {
                            resolve();
                        }
                    });
                });
            };

            var Models = {};

            Models.ResourceToWait = function () {
                var _this = this;
                _this.promise = new Promise(resolve => {
                    _this.resolve = resolve;
                });
            };

            Models.Resources = function (selectedResources, generateFileReadEndPromise) {
                var _this = this;

                var resourcesPromises = [];
                _this.resourcesToWaitBeforeGet = {};

                _this.selectedResources = Array().concat(selectedResources);

                _this.addNewResource = promise => {
                    resourcesPromises.push(promise);
                };

                _this.allResourcesLoaded = () => {
                    return new Promise(resolve => {
                        Promise.all(resourcesPromises).then(values => {
                            resolve(_this);
                        });
                    });
                };

                if (generateFileReadEndPromise) {
                    _this.fileReadEnd = new Promise(resolve => {
                        _this.fileReadEndResolve = resolve;
                    });
                }

                _this.availableLanguages = [];
                _this.languagesLoaded = new Promise(resolve => {
                    apiService.post(Endpoints.ResourceLanguages.get.url, null, response => {
                        var languages = response.data;
                        languages.unshift({
                            Code: null,
                            Title: 'Default',
                            Lcid: 0
                        });
                        _this.availableLanguages = languages;
                        resolve(languages);
                    });
                });
                _this.addNewResource(_this.languagesLoaded);

                _this.parseFromManager = () => {
                    _this.selectedResources.forEach(itemType => {
                        var resourceItems = new Models.ResourceItemsCollection(itemType, _this);
                        resourceItems.getAllItems();
                    });
                };

                _this.getCorrespondingManagerItem = (itemType, sheetItem) => {
                    var itemFromManager, itemFromManagerPromise;
                    if (_this[itemType.name] && _this[itemType.name].items) {
                        itemFromManager = _this[itemType.name].items.find(item => itemType.comparator(item, sheetItem));
                        if (itemFromManager) {
                            itemFromManagerPromise = new Promise(resolve => resolve({
                                itemFromManager: itemFromManager
                            }));
                        }
                    }
                    if (!itemFromManager) {
                        var resourcesToWait = [];
                        if (itemType.waitBeforeGet) {
                            resourcesToWait = _.intersection(_this.selectedResources, itemType.waitBeforeGet.map(waitResource => ITEM_TYPES[waitResource]));

                            resourcesToWait.forEach(resourceToWait => {
                                _this.resourcesToWaitBeforeGet[resourceToWait.name] = _this.resourcesToWaitBeforeGet[resourceToWait.name] || new Models.ResourceToWait();
                            });
                        }

                        itemFromManagerPromise = new Promise(resolve => {
                            Promise.all(resourcesToWait.map(resourceToWait => _this.resourcesToWaitBeforeGet[resourceToWait.name].promise)).then(() => {
                                var resourceItems = new Models.ResourceItemsCollection(itemType, _this);
                                switch (itemType) {
                                    case ITEM_TYPES.NAVIGATION:
                                        resourceItems.getAllItems();
                                        resourceItems.itemsLoaded.then(() => {
                                            resolve(_this.getCorrespondingManagerItem(itemType, sheetItem));
                                        });
                                        break;

                                    case ITEM_TYPES.WIDGET:
                                    case ITEM_TYPES.WIDGET_IN_PAGE_TEMPLATE:
                                        var parentItemType = sheetItem.IsFromPageTemplate ? ITEM_TYPES.PAGE_TEMPLATE : ITEM_TYPES.PAGE;
                                        var parentResourceItems = new Models.ResourceItemsCollection(parentItemType, _this);
                                        parentResourceItems.addBySheetItem(sheetItem, 'PageId').then(parentPage => {
                                            resourceItems.addBySheetItem(sheetItem, 'Id', 'PageId').then(widget => {
                                                resolve({
                                                    itemFromManager: widget.itemFromManager,
                                                    parentItem: parentPage.itemFromManager
                                                });
                                            });
                                        });

                                        break;

                                    case ITEM_TYPES.SITE:
                                        var parentResourceItems = new Models.ResourceItemsCollection(ITEM_TYPES.SITE_COLLECTION, _this);
                                        parentResourceItems.addBySheetItem(sheetItem, 'SiteCollectionId').then(parentSiteCollection => {
                                            resourceItems.addBySheetItem(sheetItem, 'Id', 'SiteCollectionId').then(site => {
                                                resolve({
                                                    itemFromManager: site.itemFromManager,
                                                    parentItem: parentSiteCollection.itemFromManager
                                                });
                                            });
                                        });

                                        break;

                                    default:
                                        resourceItems.addBySheetItem(sheetItem).then(itemFromManager => {
                                            resolve(itemFromManager);
                                        });
                                        break;
                                }
                            });
                        });
                    }
                    return itemFromManagerPromise;
                };
            };

            Models.ResourceItemsCollection = function (itemType, resourcesObject) {
                var _this = this;
                var alreadyInitialized = false;

                _this.itemType = itemType;

                if (resourcesObject[_this.itemType.name] !== undefined) {
                    return resourcesObject[_this.itemType.name];
                }

                _this.items = [];
                _this.sheetItemsLoaded = {};
                _this.itemsUpdated = [];

                var itemsLoadedResolve;
                _this.itemsLoaded = new Promise(resolve => {
                    itemsLoadedResolve = resolve;
                });

                resourcesObject[_this.itemType.name] = _this;
                resourcesObject.addNewResource(_this.itemsLoaded);

                _this.addBySheetItem = (sheetItem, idPropertyOverride, parentIdProperty) => {
                    _this.sheetItemsLoaded[sheetItem[idPropertyOverride || 'Id']] = _this.sheetItemsLoaded[sheetItem[idPropertyOverride || 'Id']] || new Promise(resolve => {
                        var body = null;
                        switch (_this.itemType) {
                            case ITEM_TYPES.WIDGET:
                                var parentItemType = sheetItem.IsFromPageTemplate ? ITEM_TYPES.PAGE_TEMPLATE : ITEM_TYPES.PAGE;
                                resourcesObject[parentItemType.name].sheetItemsLoaded[sheetItem[parentIdProperty]].then(parentPage => {
                                    var itemFromManager = parentPage.itemFromManager.WebParts.find(webPart => webPart.Id === sheetItem.Id);
                                    _this.items.push(itemFromManager);
                                    resolve({
                                        itemFromSheet: sheetItem,
                                        itemFromManager: itemFromManager
                                    });
                                });
                                return;

                            default:
                                body = Endpoints[_this.itemType.name].getBySheetItem.body(sheetItem[idPropertyOverride || 'Id'], sheetItem[parentIdProperty]);
                                break;
                        }

                        apiService.post(Endpoints[_this.itemType.name].getBySheetItem.url, body, response => {
                            var itemFromManager = response.data;
                            _this.items.push(itemFromManager);

                            resolve({
                                itemFromSheet: sheetItem,
                                itemFromManager: itemFromManager
                            });
                        });
                    });
                    return _this.sheetItemsLoaded[sheetItem[idPropertyOverride || 'Id']];
                };

                _this.getResourcesForItemType = (requiredParentItem) => {
                    return new Promise(resolve => {
                        var body = null;
                        switch (_this.itemType) {
                            case ITEM_TYPES.LIST_TEMPLATE:
                            case ITEM_TYPES.CONTENT_TYPE:
                            case ITEM_TYPES.NAVIGATION:
                            case ITEM_TYPES.SITE_COLLECTION:
                                body = Endpoints[_this.itemType.name].get.body(1000);
                                break;

                            case ITEM_TYPES.PAGE:
                            case ITEM_TYPES.LIST:
                            case ITEM_TYPES.WIDGET:
                            case ITEM_TYPES.WIDGET_IN_PAGE_TEMPLATE:
                            case ITEM_TYPES.FIELD:
                            case ITEM_TYPES.SITE:
                                body = Endpoints[_this.itemType.name].get.body(requiredParentItem.Id);
                                break;

                            default:
                                break;
                        }

                        apiService.post(Endpoints[_this.itemType.name].get.url, body, response => {
                            switch (_this.itemType) {
                                case ITEM_TYPES.LIST_TEMPLATE:
                                case ITEM_TYPES.LAYOUTS:
                                case ITEM_TYPES.SITE_COLLECTION:
                                    _this.items = _this.items.concat(response.data.Items);
                                    break;

                                case ITEM_TYPES.CONTENT_TYPE:
                                    _this.items = _this.items.concat(response.data.filter(contentType =>
                                        contentType.CategoryName === $rootScope.Resources.dbRes('Title_ContentTypes_Section')
                                    ));
                                    break;

                                case ITEM_TYPES.FIELD:
                                    _this.items = _this.items.concat(response.data.Fields.filter(field => {
                                        field.ContentTypeId = response.data.ContentTypeId;
                                        field.ContentTypeName = response.data.LocalizationName;
                                        return !(field.IsInheritedFromClonedParent || field.IsStandard || field.IsInherited);
                                    }));
                                    break;

                                case ITEM_TYPES.SITE_TEMPLATE:
                                    _this.items = _this.items.concat(response.data.filter(siteTemplate =>
                                        siteTemplate.CategoryName === $rootScope.Resources.dbRes('Title_SiteTemplates_Custom_Section')
                                    ));
                                    break;

                                case ITEM_TYPES.LIST:
                                    _this.items = _this.items.concat(response.data.filter(list => {
                                        list.SiteTemplateName = requiredParentItem.LocalizationTitle;
                                        return list.IsEditable;
                                    }));
                                    break;

                                case ITEM_TYPES.PAGE:
                                    _this.items = _this.items.concat(response.data.map(page => {
                                        page.SiteTemplateName = requiredParentItem.LocalizationTitle;
                                        return page;
                                    }));
                                    break;

                                case ITEM_TYPES.PAGE_TEMPLATE:
                                    _this.items = _this.items.concat(response.data.filter(pageTemplate => pageTemplate.PageTemplateIsFromCurrentTenant));
                                    break;

                                case ITEM_TYPES.WIDGET:
                                case ITEM_TYPES.WIDGET_IN_PAGE_TEMPLATE:
                                    _this.items = _this.items.concat(response.data.WebParts.map(webPart => {
                                        if (requiredParentItem.SiteTemplateName) {
                                            webPart.SiteTemplateName = requiredParentItem.SiteTemplateName;
                                        }
                                        webPart.PageName = requiredParentItem.LocalizationTitle;
                                        return webPart;
                                    }));
                                    break;

                                case ITEM_TYPES.SITE:
                                    _this.items = _this.items.concat(response.data/*.filter(site => !site.IsRoot)*/.map(site => {
                                        site.SiteCollectionName = requiredParentItem.Title;
                                        site.SiteCollectionId = requiredParentItem.Id;
                                        return site;
                                    }));
                                    break;

                                default:
                                    _this.items = _this.items.concat(response.data);
                                    break;
                            }
                            resolve(_this);
                        });
                    });
                };

                _this.getAllItems = () => {
                    if (alreadyInitialized) {
                        return;
                    } else {
                        alreadyInitialized = true;
                    }
                    var requiredItemTypesPromises = [];

                    if (_this.itemType.require.length > 0) {
                        _this.itemType.require.forEach(requiredItemType => {
                            var requiredItemTypePromise = new Promise(resolve => {
                                var requiredItems = new Models.ResourceItemsCollection(ITEM_TYPES[requiredItemType], resourcesObject);
                                resourcesObject[ITEM_TYPES[requiredItemType].name].itemsLoaded.then(resourceItems => {
                                    resolve(resourceItems);
                                });
                                requiredItems.getAllItems();
                            });

                            requiredItemTypesPromises.push(requiredItemTypePromise);
                        });
                    }

                    Promise.all(requiredItemTypesPromises).then(requiredItemTypes => {

                        var forEachablePromises = [];
                        if (requiredItemTypes.length > 0) {
                            requiredItemTypes.forEach(requiredItemType => {
                                requiredItemType.items.forEach(requiredItem => {
                                    forEachablePromises.push(_this.getResourcesForItemType(requiredItem));
                                });
                            });
                        } else {
                            forEachablePromises.push(_this.getResourcesForItemType());
                        }
                        Promise.all(forEachablePromises).then(() => {
                            itemsLoadedResolve(_this);
                        });
                    });
                };
            };

            $scope.exportResources = function () {
                $rootScope.$broadcast('import-export-status-change', {
                    loading: true
                });
                var selectedResources = Object.values(ITEM_TYPES).filter(itemType => itemType.hasOwnProperty('sheetName'));

                var Resources = new Models.Resources(selectedResources);
                Resources.parseFromManager();

                Resources.allResourcesLoaded().then(resources => {
                    var workbook = XLSX.utils.book_new();

                    selectedResources.forEach(itemType => {
                        var worksheet = XLSX.utils.json_to_sheet(renderResource(resources, itemType));
                        if (Object.keys(worksheet).length > 1) {
                            XLSX.utils.book_append_sheet(workbook, worksheet, itemType.sheetName);
                        }
                    });

                    $rootScope.$broadcast('import-export-status-change', {
                        loading: false
                    });
                    XLSX.writeFile(workbook, $rootScope.PartnerName + ' - ' + $rootScope.currentTenant.Text + '.xlsx');
                });
            };

            $scope.getFile = function (file) {
                $rootScope.$broadcast('import-export-status-change', {
                    loading: true
                });
                var reader = new FileReader();
                reader.addEventListener('load', () => {
                    var workbook = XLSX.read(reader.result, {
                        type: 'binary'
                    });

                    if (workbook.Sheets && workbook.SheetNames && Array.isArray(workbook.SheetNames)) {
                        var selectedResources = workbook.SheetNames.map(sheetName => {
                            return ITEM_TYPES.fromSheetName(sheetName);
                        }).sort(firstBy('order'));

                        var Resources = new Models.Resources(selectedResources, true);

                        Resources.languagesLoaded.then(languages => {
                            var resourcesImported = []
                            selectedResources.forEach(itemType => {
                                if (itemType) {
                                    resourcesImported.push(importResource(XLSX.utils.sheet_to_json(workbook.Sheets[itemType.sheetName]), Resources, itemType));
                                }
                            });
                            Resources.fileReadEndResolve();
                            Promise.all(resourcesImported).then(() => {
                                $rootScope.$broadcast('import-export-status-change', {
                                    loading: false
                                });
                            });
                        });
                    }

                    var resourceFileImportInput = angular.element("#resourceFileImport");
                    resourceFileImportInput.val('');
                });

                reader.readAsBinaryString(file);
            };

            $scope.importResources = function () {
                var resourceFileImportInput = angular.element("#resourceFileImport");
                resourceFileImportInput.click();
                return true;
            };
        };

        var CONTROLLER_ID = 'resourcesManagerCtrl';

        angular.module('powellManager').controller(CONTROLLER_ID, resourcesManagerControllerModule);
        resourcesManagerControllerModule.$inject = ['$rootScope', '$scope', 'apiService'];

        angular.module('powellManager')
            .config(['$routeProvider', '$provide', function ($routeProvider, $provide) {
                $routeProvider
                    .when("/resources", {
                        templateUrl: 'resourcesManager.html',
                        controller: CONTROLLER_ID,
                        params: {
                            bc: '#/resources|Resources management'
                        },
                        regexp: /\/resources\/?/i
                    });

                $provide.decorator('sideBarDirective', [
                    '$delegate',
                    function sideBarDecorator($delegate) {
                        var originalLinkFn = $delegate[0].link;
                        $delegate[0].compile = function (tElem, tAttr) {
                            var topnav = tElem.find('.main-menu .group-first-level:last-child .group-list-container');
                            angular.element('head').append('<style>.sidebar .first-level.active .btn-resources {' +
                                'border-bottom-color: #5842a7;' +
                                '} .sidebar .btn-resources:before {' +
                                'content: "";' +
                                'background: #039be6;' +
                                'font-family: "icomoonManager";' +
                                'font-style: normal;' +
                                'font-variant: normal;' +
                                'font-weight: normal;' +
                                'text-transform: none;' +
                                'text-decoration: none;' +
                                'speak: none;' +
                                '-webkit-font-smoothing: antialiased;' +
                                '-moz-osx-font-smoothing: grayscale;' +
                                'display: inline-block;' +
                                'vertical-align: top;' +
                                'width: 3.2rem;' +
                                'height: 3.2rem;' +
                                'line-height: 32px;' +
                                'color: #fff;' +
                                'border-radius: 50%;' +
                                '}</style>');
                            var resourcesNode = angular.element('<li class="first-level"><a href="#/resources" data-ng-click="nodeNavActive($event, \'resources\')" class="btn-nav btn-resources" title="Resources"><span>Resources</span></a></li>');
                            topnav.append(resourcesNode);
                            return originalLinkFn;
                        };

                        // get rid of the old link function since we return a link function in compile
                        delete $delegate[0].link;

                        // return the $delegate
                        return $delegate;
                    }
                ]);
            }]);


        angular.bootstrap(document, ['powellManager']);
    });
})(window, window.angular, window.document);