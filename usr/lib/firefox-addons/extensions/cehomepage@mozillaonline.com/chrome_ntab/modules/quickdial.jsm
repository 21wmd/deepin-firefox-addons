Components.utils['import']('resource://ntab/utils.jsm');

var Cc = Components.classes;
var Ci = Components.interfaces;
var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
var faviconService = Cc['@mozilla.org/browser/favicon-service;1'].getService(Ci.nsIFaviconService);

var EXPORTED_SYMBOLS = ['quickDialModule'];

function completeURL(url) {
	if (!url)
		return url;

	if (url.indexOf('http://') != 0 && url.indexOf('https://') != 0 && url.indexOf('ftp://')!=0) {
		url = 'http://' + url;
	}

	try {
		return ioService.newURI(url, null, null).spec;
	} catch (e) {
		return url;
	}
}

// Read quickdial data from json file under profile directory.
var dialData = null;
var defaultDialData = null;
var str = utils.readStrFromProFile(['ntab', 'quickdial.json']);
if (!!str) {
	dialData = JSON.parse(str);

	var _oldTaobao = false;
	// Refresh favicon and complete url
	for (index in dialData) {
		var dial = dialData[index];
		dial.url = completeURL(dial.url);
		if (dial.url.indexOf("mm_12811289_2210561_8696507") != -1) {
			dial.url = dial.url.replace(/mm_12811289_2210561_8696507/g, "mm_28347190_2425761_9313997");
			_oldTaobao = true;
		}
		if (!dial.icon) {
			try {
				var icon = faviconService.getFaviconImageForPage(ioService.newURI(dial.url, null, null)).spec;
				dial.icon = icon == 'chrome://mozapps/skin/places/defaultFavicon.png' ? '' : icon;
			} catch(e) {
				dump('\nError occurs when parsing quickdial.json: ' + e + '\n');
			}
		}
	}
	if (_oldTaobao) {
		str = str.replace(/mm_12811289_2210561_8696507/g, "mm_28347190_2425761_9313997");
		utils.setStrToProFile(['ntab', 'quickdial.json'], str);
	}
}



var defaultDataJSM = {};
try {
	var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('moa.ntab.dial.');
	var branch = prefs.getCharPref('branch');
	Components.utils['import']('resource://ntab/quickdial/' + branch + '/default.jsm', defaultDataJSM);
} catch (e) {
	defaultDataJSM.defaultQuickDial = {
		dialData: {}
	};
}

// If json file is empty, then use default value;
if(!dialData) {
	dialData = defaultDataJSM.defaultQuickDial.dialData;
}
defaultDialData = defaultDataJSM.defaultQuickDial.dialData;

var defaultPosition = {};

for (var key1 in defaultDialData) {
	defaultPosition[defaultDialData[key1]] = key1;
}


function _notifyAllNewTab(num) {
	// Modify pref to notify all the opened new tab.
	var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('moa.ntab.dial.');
	prefs.setCharPref('update.' + num, +new Date);
}

function _onDialModified(num) {
	_notifyAllNewTab(num);
	// Save all dial data into a json file
	utils.setStrToProFile(['ntab', 'quickdial.json'], JSON.stringify(dialData));
}

var quickDialModule = {
	getDial: function(num) {
		if (dialData[num]) {
			return {
				title: dialData[num].title,
				url: dialData[num].url,
				icon: dialData[num].icon,
				defaultposition : defaultPosition[dialData[num].url] ? defaultPosition[dialData[num].url] : "",
				thumbnail: dialData[num].thumbnail
			}
		}

		return null;
	},
	refresh: function() {
		str = utils.readStrFromProFile(['ntab', 'quickdial.json']);
		if (!!str) {
			dialData = JSON.parse(str);
			for (index in dialData) {
				var dial = dialData[index];
				dial.url = completeURL(dial.url);
				if (!dial.icon) {
					try {
						var icon = faviconService.getFaviconImageForPage(ioService.newURI(dial.url, null, null)).spec;
						dial.icon = icon == 'chrome://mozapps/skin/places/defaultFavicon.png' ? '' : icon;
					} catch(e) {
						dump('\nError occurs when parsing quickdial.json: ' + e + '\n');
					}
				}
			}
		}
	},
	getDefaultDataStr: function() {
		return JSON.stringify(defaultDialData);
	},
	/**
	 * Add to blank dial directly without index given. Called by clicking on menu item.
	 *
	 * @return
	 * 	-1: no blank dial
	 *  >0: blank dial index
	 *
	 */
	fillBlankDial: function(data) {
		var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('moa.ntab.dial.');
		var MAX_COLUMN_ROW = 10;
		var _cell = prefs.getIntPref('column');
		_cell = _cell > 0 ? _cell < MAX_COLUMN_ROW ? _cell : MAX_COLUMN_ROW : COLUMNS;
		var _row = prefs.getIntPref('row');
		_row = _row > 0 ? _row < MAX_COLUMN_ROW ? _row : MAX_COLUMN_ROW : ROWS;

		var total = _cell * _row;
		var index = -1;
		for (var i = 1; i <= total; i++) {
			if (dialData[i])
				continue;

			index = i;
			break;
		}

		if (index > 0) {
			this.updateDial(index, data);
		}

		return index;
	},

	/**
	 * Update dial title if title is empty or default value.
	 */
	updateTitleIfEmpty: function(url, title) {
		var stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1']
								.getService(Components.interfaces.nsIStringBundleService);
		var stringBundle = stringBundleService.createBundle('chrome://ntab/locale/ntab.properties');
		var defaultTitle = stringBundle.GetStringFromName('ntab.dial.editdialog.titleinput');

		for (var idx in dialData) {
			if (url == dialData[idx].url && (!dialData[idx].title || defaultTitle == dialData[idx].title)) {
				dialData[idx].title = title;
				_onDialModified(idx);
			}
		}
	},

	updateFavicon: function(url) {
		for (var idx in dialData) {
			if (url == dialData[idx].url && !dialData[idx].icon) {
				var icon = faviconService.getFaviconImageForPage(utils.getNsiURL(url)).spec;
				dialData[idx].icon = icon == 'chrome://mozapps/skin/places/defaultFavicon.png' ? '' : icon;
				_onDialModified(idx);
			}
		}
	},

	updateDial: function(num, data, delCache) {
		// Check if cache file should be deleted.
		if (true === delCache || (dialData[num] && dialData[num].url != data.url)) {
			var delCacheFile = true;
			var url = dialData[num].url;

			for (var idx in dialData) {
				if (dialData[idx].url == dialData[num].url && ('' + num) != ('' + idx)) {
					delCacheFile = false;
					break;
				}
			}

			if (delCacheFile) {
				utils.removeFile(['ntab', 'cache', utils.md5(dialData[num].url)]);
			}
		}

		// Update dial data
		if (!dialData[num]) {
			dialData[num] = {};
		}
		dialData[num].title = data.title;
		dialData[num].url = completeURL(data.url);


		try {
			var icon = faviconService.getFaviconImageForPage(ioService.newURI(data.url, null, null)).spec;
			dialData[num].icon = icon == 'chrome://mozapps/skin/places/defaultFavicon.png' ? '' : icon;
		} catch (e) { }

		_onDialModified(num);
	},

	snapshotDone: function(url) {
		this.refreshDialViewRelated(url);
	},

	refreshDialViewRelated: function(url) {
		for (var num in dialData) {
			if (dialData[num].url == url) {
				_notifyAllNewTab(num);
			}
		}
	},

	removeDial: function(num) {
		if (!dialData[num])
			return;

		// Check if cache file should be deleted.
		var url = dialData[num].url;
		var delCacheFile = true;

		for (var idx in dialData) {
			if (dialData[idx].url == url && ('' + num) != ('' + idx)) {
				delCacheFile = false;
				break;
			}
		}
		delete dialData[num];
		_onDialModified(num);

		if (delCacheFile) {
			utils.removeFile(['ntab', 'cache', utils.md5(url)]);
		}
	},

	exchangeDial: function(source, target) {
		if (source == target)
			return;

		var tmp = dialData[source];
		// if target is empty, then delete source data.
		if (!dialData[target]) {
			delete dialData[source];
		} else {
			dialData[source] = dialData[target];
		}

		if (!tmp) {
			delete dialData[target];
		} else {
			dialData[target] = tmp;
		}

		_onDialModified(source);
		_onDialModified(target);
	}
};
