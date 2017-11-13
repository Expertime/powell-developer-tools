(function(window, $, undefined) {
    var powLang = [{
        id: '1033',
        code: 'en'
    }, {
        id: '2052',
        code: 'zh-CHS'
    }, {
        id: '1040',
        code: 'it'
    }, {
        id: '3082',
        code: 'es'
    }, {
        id: '1029',
        code: 'cs'
    }, {
        id: '1031',
        code: 'de'
    }, {
        id: '1043',
        code: 'nl'
    }, {
        id: '1046',
        code: 'pt'
    }, {
        id: '1049',
        code: 'ru'
    }, {
        id: '1053',
        code: 'sv'
    }, {
        id: '1055',
        code: 'tr'
    }, {
        id: '1045',
        code: 'pl'
    }];

    function encodeChars(string) {
        return string.replace(/[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝàáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽž]/g, function(m) {
            return (m === '"' || m === '\\') ? " " : "\\x" + m.charCodeAt(0).toString(16).toUpperCase();
        });
    }

    function translate(bingIframe, a, from, to) {
        var deferred = $.Deferred();
        var d = 'var timer = setInterval(function() { if(typeof Microsoft !== "undefined") { clearInterval(timer); Microsoft.Translator.Widget.Translate(\'' + from + '\', \'' + to + '\', null, null, function() { document.getElementById("_div_to_translate").setAttribute("translated", "true") } , null, 2000); } },50);',
            e = document.createElement("p");
        e.setAttribute("id", "_div_to_translate"), e.innerHTML = a;
        var f = document.createElement("script");
        f.setAttribute("id", "_script_to_translate"), f.text = d, bingIframe.body.appendChild(e), bingIframe.body.appendChild(f);
        var g = setInterval(function() {
            if ("true" === e.getAttribute("translated")) {
                var a = e.innerHTML;
                document.cookie = 'mstto=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                clearInterval(g), f.parentNode.removeChild(f), e.parentNode.removeChild(e), deferred.resolve(a)
            }
        }, 50);

        return deferred.promise();
    }

    function translateAll(event) {
        var sourceInput = $('#tbTranslateSrc');
        var source = sourceInput.val();

        var interval = 0
        var loader = setInterval(function() {
            interval++;
            event.target.innerText = 'Translating' + '.'.repeat(interval % 3);
        }, 500);


        //eval("source = " + source);
        source = { key: 'LabelToto', _1036: 'Pâte à modeler' };
        var a = source._1036;

        var translateInput = $('#tbTranslateDest');
        var translatePre = $('#resultPre');

        var iframePromise = $.Deferred();

        var iframeDocument = document.getElementById("_bing_iframe");

        if (!iframeDocument) {
            var ifr = document.createElement("iframe");
            ifr.setAttribute("id", "_bing_iframe");
            ifr.setAttribute("style", "display:none;");
            var sScript = document.createElement("script");
            sScript.src = "https://www.microsoftTranslator.com/ajax/v3/WidgetV3.ashx?siteData=ueOIGRSKkd965FeEGM5JtQ**";
            sScript.type = "text/javascript";
            document.body.appendChild(ifr);
            iframeDocument = document.getElementById("_bing_iframe").contentDocument || window.frames["_bing_iframe"].document;
            if (!iframeDocument.body) {
                iframeDocument.write('<body></body>');
            }
            var floaterProgress = document.createElement('div');
            floaterProgress.setAttribute('id', 'FloaterProgressBar');

            iframeDocument.body.appendChild(floaterProgress);
            iframeDocument.body.appendChild(sScript);

            iframePromise.resolve(iframeDocument);
        } else {
            iframePromise.resolve(iframeDocument.contentDocument);
        }

        iframePromise.promise().then(function(bingIframe) {
            function translateInternal(bingIframe, a, from, remainingLang) {
                if (remainingLang.length > 0) {
                    var lang = remainingLang.shift();
                    translate(bingIframe, a, from, lang.code).then(function(translation) {
                        source['_' + lang.id] = translation;
                        translateInternal(bingIframe, a, from, remainingLang)
                    });
                } else {
                    clearInterval(loader);
                    event.target.innerText = 'Translate';
                    var result = encodeChars(JSON.stringify(source, null, 1));
                    result = result.replace(/"(key|_\d+)"/g, '$1').replace(/(: )?"(,)?/g, "$1'$2");
                    translateInput.val(result);
                    translatePre.text(result);
                }
            }

            translateInternal(bingIframe, a, 'fr', powLang.slice())
        });
    }

    $('#btTranslate').on('click', translateAll);
})(window, window.jQuery);