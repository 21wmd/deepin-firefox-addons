(function() {

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;
Components.utils['import']('resource://ntab/utils.jsm');

var DEBUG = false;
function log() {
		return (DEBUG ? Application.console.log.apply(Application.console, arguments):true);
}
function isFirefoxLowerThan4() {
	return typeof Application.getExtensions == "undefined";
}
if(!isFirefoxLowerThan4()){
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
}
if (!window.opener) {
    window.addEventListener('unload', function(evt) {
        if (evt.originalTarget == document) {
      try {
        var pbs = Cc["@mozilla.org/privatebrowsing;1"].
            getService(Ci.nsIPrivateBrowsingService);
        var inPrivateBrowsingMode = pbs.privateBrowsingEnabled;
        if (inPrivateBrowsingMode != null && inPrivateBrowsingMode == false){
          last.save();
        }
      } catch (e){
        //this means it's in a earlier version of firefox.
        last.save();
      }
        }
        return true;
    }, true);
}


var addonlistener = {
	onUninstalling: function (addon) {
		cancelAboutProtocol(addon);
	},

	onDisabling: function (addon) {
		cancelAboutProtocol(addon);
	},

	onOperationCancelled: function() {
		if(addon.id == "cehomepage@mozillaonline.com") {
			var homepage = prefs.get("browser.startup.homepage","");
			var urls = homepage.split("|");
			var url;
			for (var i = 0; i < urls.length; i++){
				urls[i] = urls[i].trim().replace(/^(http:\/\/)?start\.linuxdeepin\.com\/?$/ig, "about:cehome");
			}
			homepage = urls.join("|");
			prefs.set("browser.startup.homepage",homepage);
		}
	}
};

function cancelAboutProtocol(addon) {
	if(addon.id == "cehomepage@mozillaonline.com") {
		var homepage = prefs.get("browser.startup.homepage","");
		homepage = homepage.replace(/about:cehome/ig, "http://start.linuxdeepin.com/");
		prefs.set("browser.startup.homepage",homepage);
		for (let j = 0; j < gBrowser.tabs.length; j++) {
			if (gBrowser.getBrowserAtIndex(j).contentWindow.document.location == "about:cehome") {
				gBrowser.getBrowserAtIndex(j).contentWindow.document.location = "http://start.linuxdeepin.com/";
			}
		}
	}
}
function cehomepage_setHomepageToProfile() {
  try {
	//in china edition, pref "browser.startup.homepage" is a locale string, has mimo type,
	//so must use  getLocale() other than get()
	//see in distribution.ini
    var homepage = prefs.getLocale("browser.startup.homepage","");
	var urls = homepage.split("|");
	var url;
	for (var i = 0; i < urls.length; i++){
		urls[i] = urls[i].trim().replace(/^(http:\/\/)?start\.linuxdeepin\.com\/?$/ig, "about:cehome");
		urls[i]	= urls[i].replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com");
	}
	homepage = urls.join("|");
    prefs.set("browser.startup.homepage",homepage);
  } catch (e){
    //maybe pref is already set by user, do nothing
  }
}

function cehomepage_autoSetHomepage() {
  var homepage = prefs.get("extensions.cehomepage.homepage","");
  prefs.set("browser.startup.homepage",homepage);
}

function replaceBlankToCEHome() {
	var homepage = prefs.get("browser.startup.homepage","");
	if (homepage != "about:blank") {
		prefs.set("extensions.cehomepage.restoreHomepageFor360", true);
		return;
	} else {
		var lastNotificationTime = prefs.get("extensions.cehomepage.lastNotificationTime", 0);
		var today = Math.floor(new Date().getTime() / (86400 * 1000));
		if((today - lastNotificationTime) >= 5) {
			var strbundle = document.getElementById("CEHPHistoryStrings");
			var buttons = [
				{
					label: strbundle.getString("cehomepage.notification.yes"),
					accessKey: "Y",
					popup: null,
					callback: function(){
						prefs.set("browser.startup.homepage", "about:cehome");
						prefs.set("extensions.cehomepage.restoreHomepageFor360", true);
						gBrowser.getNotificationBox().removeCurrentNotification();
					}
				},
				{
					label: strbundle.getString("cehomepage.notification.no"),
					accessKey: "N",
					popup: null,
					callback: function(){
						prefs.set("extensions.cehomepage.restoreHomepageFor360", true);
						gBrowser.getNotificationBox().removeCurrentNotification();
					}
				},
				{
					label: strbundle.getString("cehomepage.notification.later"),
					accessKey: "R",
					popup: null,
					callback: function(){
						gBrowser.getNotificationBox().removeCurrentNotification();
					}
				}
			];
			var notificationBox = gBrowser.getNotificationBox();
			var priority = notificationBox.PRIORITY_INFO_MEDIUM;
			var newBar = notificationBox.appendNotification(strbundle.getString("cehomepage.notification.message"),
															"cehp-upgrade-homepage", "chrome://ntab/skin/logo/logo32x32_cn.png", priority, buttons);
			newBar.addEventListener("DOMNodeRemoved", function(){
				prefs.set("extensions.cehomepage.lastNotificationTime", today);
			}, true);
			newBar.persistence+=3;
		}
	}
}

window.addEventListener('load', function(evt) {
	var latestVersion = prefs.get("extensions.cehomepage.latestVersion", "");
	if(latestVersion == "0.8.5") {
		prefs.set("extensions.cehomepage.restoreHomepageFor360", false);
	}else if (latestVersion == "") {
		cehomepage_setHomepageToProfile();
	}
	prefs.set("extensions.cehomepage.latestVersion", "0.8.6");
	// if former version is 0.8.4 pref get true, do not notify
	if(!prefs.get("extensions.cehomepage.restoreHomepageFor360", true)) {
		window.setTimeout(replaceBlankToCEHome, 10000);
	}

 	//the following lines added for z.g-fox.cn, on first install of the addon, set z.g-fox.cn to homepage
	var autoSetHomepage = prefs.get("extensions.cehomepage.autoSetHomepage", false);
	if (autoSetHomepage) {
		if (Application.extensions && Application.extensions.get("cehomepage@mozillaonline.com").firstRun){
  			cehomepage_autoSetHomepage();
		} else if (Application.getExtensions) {
			// Application.extensions is obsolete in Gecko 2.0
			Application.getExtensions(function(exts) {
				if (exts.get("cehomepage@mozillaonline.com").firstRun) {
					cehomepage_autoSetHomepage();
				}
			});
		}
	}
	if(!isFirefoxLowerThan4()) {
		AddonManager.addAddonListener(addonlistener);
	}
}, false);
window.addEventListener("DOMContentLoaded", function(evt) {
	if (!evt.originalTarget instanceof HTMLDocument) {
		return;
	}
	try {
		var view = evt.originalTarget.defaultView;
		if (view.top == view || view.top == view.parent) {
        	log(['inject', view.location.host.toLowerCase()]);
	        inject(view.location.host.toLowerCase(), view);
		}
	} catch(e) {
		log('Error occurs when injecting.');
	}
}, false);
window.addEventListener('unload', function(evt) {
	if(!isFirefoxLowerThan4()) {
		AddonManager.removeAddonListener(addonlistener);
	}
}, false);

function inject(host, win) {
    var cwin = win.wrappedJSObject;
    if (cwin['cehomepage']) {
        log(['injected']);
        return;
    }
    var hosts = prefs.get('extensions.cehomepage.allowed_domains', '').split(',');
    var length = host.length;
    while (true) {
        if (hosts.length == 0) {
            log(['cehomepage deny', host]);
            return;
        }
        var ahost = hosts.shift().trim().toLowerCase();
        if (host.lastIndexOf(ahost) == length - ahost.length) {
            break;
        }
    }
    log(['cehomepage inject', host]);
    cwin['cehomepage'] = {};
    homepage.init(cwin.cehomepage);
    frequent.init(cwin.cehomepage);
    last.init(cwin.cehomepage);
    if (cwin['do_history']) {
        cwin.do_history.call(cwin);
    }
  try {
    var pbs = Cc["@mozilla.org/privatebrowsing;1"].
        getService(Ci.nsIPrivateBrowsingService);
    var inPrivateBrowsingMode = pbs.privateBrowsingEnabled;
    if (inPrivateBrowsingMode != null && inPrivateBrowsingMode == false){
      cwin.cehomepage['inPrivateMode'] = true;
    }
  } catch (e){
    //this means it's in a earlier version of firefox, do nothing;

  }

}

var prefs = {
    branch: Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch2),
    get: function(k, v) {
        return Application.prefs.getValue(k, v);
    },
    getLocale: function(k, v) {
        return this.branch.getComplexValue(k, Ci.nsIPrefLocalizedString).data || v;
    },
    set: function(k, v) {
        Application.prefs.setValue(k, v);
    },
    setLocale: function(k, v) {
        var pls = Cc['@mozilla.org/pref-localizedstring;1'].createInstance(Ci.nsIPrefLocalizedString);
        pls.data = v;
        this.branch.setComplexValue(k, Ci.nsIPrefLocalizedString, pls);
    },
    changed: function(k) {
        return this.branch.prefHasUserValue(k);
    },
    reset: function(k) {
        try {
            this.branch.clearUserPref(k);
        } catch (ex) {
            log(['clearUserPref', k, ex]);
        }
    }
};

var homepage = {
    init: function(cehp) {
        var me = this;
        cehp['startup'] = {
            homepage: function() { return me.homepage(); },
            homepage_changed: function() { return me.homepage_changed(); },
            page: function() { return me.page(); },
            page_changed: function() { return me.page_changed(); },
            cehomepage: function() { return me.cehomepage(); },
            autostart: function(flag) { return me.autostart(flag); },
            setHome: function(url) {
              if (url != null && url != "" && url.indexOf("http://") == 0){
                prefs.set('browser.startup.homepage', url);
                prefs.set('browser.startup.page', 1);
              } else {
                me.reset();
              }
            }
        };
    },
    reset: function() {
        prefs.set('browser.startup.homepage', this.cehomepage());
        prefs.set('browser.startup.page', 1);
    },
    homepage: function() {
        var hp = prefs.getLocale('browser.startup.homepage', 'about:blank');
        return hp;
    },
    homepage_changed: function() { return prefs.changed('browser.startup.homepage') && this.homepage() != this.cehomepage(); },
    page: function() { return prefs.get('browser.startup.page', 1); },
    page_changed: function() { return prefs.changed('browser.startup.page') && this.page() == 1; },
    cehomepage: function() { return prefs.get('extensions.cehomepage.homepage', 'http://start.linuxdeepin.com'); },
    autostart: function(flag) {
        var ori = prefs.get('extensions.cehomepage.autostartup', true);
        if (typeof flag != 'undefined') {
            prefs.set('extensions.cehomepage.autostartup', flag);
        }
        return ori;
    }
};

var frequent = {
    history: null,
    querier: null,
    option: null,
    sql: 'SELECT (SELECT title FROM moz_places WHERE favicon_id = s.favicon_id AND visit_count > 0 AND hidden = 0 ORDER BY frecency DESC LIMIT 1) AS _title, (SELECT url FROM moz_places WHERE favicon_id = s.favicon_id AND visit_count > 0 AND hidden = 0 ORDER BY frecency DESC LIMIT 1) AS _url FROM moz_places s WHERE favicon_id IS NOT NULL AND frecency != 0 AND visit_count > 0 AND hidden = 0 GROUP BY favicon_id ORDER BY MAX(frecency) DESC LIMIT ?',
    init: function(cehp) {
        this.history = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService);
        var qu = this.history.getNewQuery();
        this.querier = qu;
        var qo = this.history.getNewQueryOptions();
        this.option = qo;
        qo.resultType = Ci.nsINavHistoryQueryOptions.RESULTS_AS_URI;
        qo.queryType = Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY;
        qo.expandQueries = true;
        qo.sortingMode = Ci.nsINavHistoryQueryOptions.SORT_BY_VISITCOUNT_DESCENDING;

        var me = this;
        cehp['frequent'] = {
            query: function(n) { return ('nsPIPlacesDatabase' in Ci) ? me.query(n) : me.query_old(n); },
            remove: function(uri) { return me.remove(uri); }
        };
    },
    query: function(n) {
        var res = [];
        try {
            var conn = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService).QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
            var stmt = conn.createStatement(this.sql);
            stmt.bindInt32Parameter(0, n);
            while (stmt.executeStep()) {
                res.push({title: stmt.getString(0), uri: stmt.getString(1).replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com")});
            }
        }
        finally {
            return res;
        }
    },
    query_old: function(n) {
        var res = [];

        this.option.maxResults = n;
        var hr = this.history.executeQuery(this.querier, this.option);
        var root = hr.root.QueryInterface(Ci.nsINavHistoryContainerResultNode);
        root.containerOpen = true;
        for (var i = 0; i < root.childCount; i++) {
            var e = root.getChild(i);
            res.push({uri: e.uri.replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com"), title: e.title});
        }
        root.containerOpen = false;

        return res;
    },
    remove: function(uri) {
        var bh = this.history.QueryInterface(Ci.nsIBrowserHistory);
        bh.removePage(this.uri(uri));
    },
    uri: function(spec) {
        return Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService).newURI(spec, null, null);
    }
};

var last = {
    session: null,
    restored: {},
    init: function(cehp) {
        var me = this;
        cehp['last'] = {
            query: function() { return me.query(); },
            restore: function(tab, focus) { return me.restore(tab, focus); },
            remove: function(tab) { return me.remove(tab); }
        };
    },
	query: function() {
		if (!this.session) {
			this.session = this.read();
		}
		var res = [];
		if (this.session.windows.length != 0) {
			var wins = this.session.windows;
		} else {
			var wins = JSON.parse(utils.readStrFromProFile(['ntab', 'session.json'])).windows;
		}
		for (var i in wins) {
			var win = wins[i];
			for (var j in win.tabs) {
				var tab = win.tabs[j];
				var e = tab.entries[tab.index - 1];
				if (!e) {
					continue;
				}
				if (e.url == 'about:blank') {
					continue;
				}
				res.push({
					title: e.title,
					url: e.url.replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com"),
					length: tab.entries.length,
					data: JSON.stringify(tab),
					window_idx: i,
					tab_idx: j
				});
			}
		}
		return res;
	},
    read: function() {
        var files = this.getSessionFiles();
        var session = null;
        var emptySession = { windows: [] };
        if (files.length == 0)
            return emptySession;
        for (var i in files) {
            var file = files[i];
            try {
                var fileObj = this.getSessionDir();
                fileObj.append(file);
                if (!fileObj.exists())
                    continue;
                var content = '';
                var stream = Cc['@mozilla.org/network/file-input-stream;1'].createInstance(Ci.nsIFileInputStream);
                var converter = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
                stream.init(fileObj, -1, 0, 0);
                converter.init(stream, 'UTF-8', 0, 0);
                var str = {};
                while (converter.readString(4096, str)) {
                    content += str.value;
                }
                stream.close();
                session = JSON.parse(content) || emptySession;
                if (!session.windows)
                    session.windows = [];
                fileObj.remove(false);
                break;
            } catch (ex) {
                session = emptySession;
                log(['read session error', ex]);
            }
        }
        return session;
    },
    remove: function(tab) {
        var win = null;
        for (var i in this.session.windows) {
            if (i == tab.window_idx) {
                var win = this.session.windows[i];
                for (var j in win.tabs) {
                    if (j == tab.tab_idx) {
                        var t = win.tabs[j];
                        var e = t.entries[t.index - 1];
                        win.tabs.splice(j, 1);
                        break;
                    }
                }
                if (win.tabs.length == 0)
                    this.session.windows.splice(i, 1);
                break;
            }
        }
    },
    restore: function(data, focus) {
        var oldt = this.restored[data];
        if (oldt) {
            if (focus)
                gBrowser.selectedTab = oldt;
        } else {
            var me = this;
            window.setTimeout(function() {
                var enabled = true;
                if (!prefs.get('browser.sessionstore.enabled', true)) {
                    enabled = false;
                    prefs.set('browser.sessionstore.enabled', true);
                }
                var ss = Components.classes['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore);
                var tab = gBrowser.addTab();
                ss.setTabState(tab, data);
                me.restored[data] = tab;
                if (!enabled) {
                    prefs.set('browser.sessionstore.enabled', false);
                }
            }, 0);
        }
    },
    save: function() {
        var enabled = true;
        if (!prefs.get('browser.sessionstore.enabled', true)) {
            enabled = false;
            prefs.set('browser.sessionstore.enabled', true);
        }
        var ss = Components.classes['@mozilla.org/browser/sessionstore;1'].getService(Ci.nsISessionStore);
        var state = ss.getBrowserState();
        if (!enabled) {
            prefs.set('browser.sessionstore.enabled', false);
        }

        var keep = prefs.get('extensions.cehomepage.keepsessions', 10);
        if (keep < 1)
            keep = 1;
        var files = this.getSessionFiles();
        while (files.length >=  keep) {
            var sf = this.getSessionDir();
            sf.append(files.pop());
            if (sf.exists()) {
                sf.remove(false);
            }
        }
        var session = this.getSessionDir();
        session.append(Date.now() + '.js');
        if (!session.exists())
            session.create(session.NORMAL_FILE_TYPE, 0644);
        this.write(state, session);
    },
    write: function(state, file) {
        var stream = Cc['@mozilla.org/network/file-output-stream;1'].createInstance(Ci.nsIFileOutputStream);
        stream.init(file, 0x02 | 0x08 | 0x20, 0644, 0);
        var converter = Cc['@mozilla.org/intl/converter-output-stream;1'].createInstance(Ci.nsIConverterOutputStream);
        converter.init(stream, 'UTF-8', 0, 0);
        converter.writeString(state);
        converter.close();
    },
    getSessionDir: function() {
        var dir = Cc['@mozilla.org/file/directory_service;1'].getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
        dir.append('cesessions');
        if (!dir.exists()) {
            dir.create(dir.DIRECTORY_TYPE, 0700);
        }
        return dir;
    },
    getSessionFiles: function() {
        var files = [];
        var dir = this.getSessionDir();
        var fit = dir.directoryEntries;
        var file = null;
        while (fit.hasMoreElements()) {
            file = fit.getNext();
            file.QueryInterface(Ci.nsIFile);
            files.push(file.leafName);
        }
        files.sort(function(a,b) { return b > a; });
        return files;
    }
};

}());
