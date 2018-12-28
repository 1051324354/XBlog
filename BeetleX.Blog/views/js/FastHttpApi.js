﻿var __id = 0;
var __receive;
var __connect;
var __disconnect;
function FastHttpApiWebSocket() {
    if (window.location.protocol == "https:") {
        this.wsUri = "wss://" + window.location.host;
    }
    else {
        this.wsUri = "ws://" + window.location.host;
    }
    this.websocket;
    this.status = false;
    this.messagHandlers = new Object();
    this.timeout = 2000;
}

FastHttpApiWebSocket.prototype.send = function (url, params, callback) {
    if (this.status == false) {
        if (callback != null) {
            callback({ Url: url, Code: 505, Error: 'disconnect' })
        }
    }
    this.messagHandlers[params._requestid] = callback;
    var data = { url: url, params: params };
    this.websocket.send(JSON.stringify(data));
}

FastHttpApiWebSocket.prototype.onOpen = function (evt) {
    this.status = true;
    if (__connect)
        __connect(this);
}

FastHttpApiWebSocket.prototype.onClose = function (evt) {
    this.status = false;
    var _this = this;
    if (__disconnect)
        __disconnect(this);
    if (evt.code == 1006) {
        setTimeout(function () {
            _this.Connect();
        }, _this.timeout);
        _this.timeout += 1000;
    }

}

FastHttpApiWebSocket.prototype.onMessage = function (evt) {
    var msg = JSON.parse(evt.data);
    var callback = this.messagHandlers[msg.ID];
    if (callback)
        callback(msg);
    else
        if (__receive)
            __receive(msg);
}
FastHttpApiWebSocket.prototype.onError = function (evt) {

}

FastHttpApiWebSocket.prototype.Connect = function () {
    this.websocket = new WebSocket(this.wsUri);
    _this = this;
    this.websocket.onopen = function (evt) { _this.onOpen(evt) };
    this.websocket.onclose = function (evt) { _this.onClose(evt) };
    this.websocket.onmessage = function (evt) { _this.onMessage(evt) };
    this.websocket.onerror = function (evt) { _this.onError(evt) };
}


function FastHttpApi(url, params, http, post) {
    if (http == true)
        this.http = true;
    else
        this.http = false;
    this.url = url;
    this.post = false;
    if (post == true)
        this.post = true;
    this.params = params;
    if (!this.params)
        this.params = new Object();

}

FastHttpApi.prototype.sync = function () {
    var _this = this;
    return new Promise(resolve => {
        _this.execute(function (result) {
            resolve(result);
        });
    });
}
FastHttpApi.prototype.httpRequest = function () {
    this.http = true;
    return this.sync();
}

FastHttpApi.prototype.execute = function (callback, http) {
    if (http == true)
        this.http = true;
    var id = ++__id;
    if (__id > 1024)
        __id = 0;
    var httpurl;
    var keys;
    var index;
    this.params['_requestid'] = id;
    var _this = this;
    if (this.http || __websocket.status == false) {
        if (this.post) {
            httpurl = this.url;
            $.ajax({
                type: "POST",
                contentType: "application/json; charset=utf-8",
                url: httpurl,
                data: JSON.stringify(_this.params),
                dataType: "json",
                success: function (result) {
                    if (callback)
                        callback(result);
                }
            });
        }
        else {
            httpurl = this.url;
            keys = Object.keys(this.params);
            index = 0;
            for (i = 0; i < keys.length; i++) {
                if (this.params[keys[i]]) {
                    if (index == 0) {
                        httpurl += "?";
                    }
                    else {
                        httpurl += "&";
                    }
                    httpurl += keys[i] + '=' + encodeURIComponent(this.params[keys[i]]);
                    index++;
                }
            }
            $.get(httpurl, function (result) {
                if (callback)
                    callback(result);
            });
        }
    }
    else {
        __websocket.send(this.url, this.params, callback);
    }

}


function api_connect(callback) {
    __connect = callback;
}

function api_disconnect(callback) {
    __disconnect = callback;
}

function api(url, params, http, post) {
    return new FastHttpApi(url, params, http, post);
}

function api_receive(callback) {
    __receive = callback;
}

async function execute_api(promise, callback) {
    var result = await promise;
    if (result.Code != 200) {
        if (callback)
            callback(result);
        else
            alert(result.Error);
    }
    return result.Code;
}

async function bindVue(control, promise, binder) {
    var result = await promise;
    if (result.Code == 200) {
        if (binder) {
            binder(control, result);
        }
        else {
            control.Data = result.Data;
        }
    }
    else {
        if (result.Code == 403) {
            window.location.href = result.Data;
        }
        else {
            alert(result.Error + "(" + result.Code + ")");
        }
    }
    return result;
}

var __websocket = new FastHttpApiWebSocket();
__websocket.Connect();
//url helper
function UrlHelper() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0].toLowerCase()] = hash[1];
    }
    this.queryString = vars;
    this.ssl = window.location.protocol == "https:"
    var url = document.location.pathname;
    this.folder = url.substring(url.indexOf('/'), url.lastIndexOf('/'));
    url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
    url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));
    url = url.substring(url.lastIndexOf("/") + 1, url.length);
    if (url) {
        this.fileName = decodeURIComponent(url);
        this.ext = this.fileName.substring(this.fileName.lastIndexOf(".") + 1, this.fileName.length)
        this.fileNameWithOutExt = this.fileName.substring(0, this.fileName.lastIndexOf(".") == -1 ? this.fileName.length : this.fileName.lastIndexOf("."));
    }
}
var _url = new UrlHelper();
//pagination
function pagination(index, pages) {
    if (pages <= 1)
        return;
    $('#pagination').empty();
    if (pages < 10) {
        for (i = 0; i < pages; i++) {
            var item = '<li><a  class="btn-xs" page="' + i + '" href="javascript:void(0)" onclick="pageChange(' + i + ')">' + (i + 1) + '</a></li>'
            $('#pagination').append(item);
        }
    }
    else {
        var item = '<li><a  class="btn-xs" page="' + 0 + '" href="javascript:void(0)" onclick="pageChange(0)">1</a></li>'
        $('#pagination').append(item);


        for (i = index - 5; i < index + 1; i++) {
            if (i > 0 && i < pages - 1) {
                var item = '<li><a  class="btn-xs" page="' + i + '" href="javascript:void(0)" onclick="pageChange(' + i + ')">' + (i + 1) + '</a></li>'
                $('#pagination').append(item);
            }
        }


        for (i = index + 1; i < index + 5; i++) {
            if (i < (pages - 1)) {
                var item = '<li><a  class="btn-xs" page="' + i + '" href="javascript:void(0)" onclick="pageChange(' + i + ')">' + (i + 1) + '</a></li>'
                $('#pagination').append(item);
            }
        }
        if (pages > 1) {
            var item = '<li><a class="btn-xs" page="' + (pages - 1) + '" href="javascript:void(0)" onclick="pageChange(' + (pages - 1) + ')">' + (pages) + '</a></li>'
            $('#pagination').append(item);
        }
    }
    $('a').each(function () {
        if ($(this).attr('page') == index) {
            $(this).html('<span class="badge">' + (index + 1) + '</span>')
        }
    })
}
