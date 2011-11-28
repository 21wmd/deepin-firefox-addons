var Ci = Components.interfaces;
var Cc = Components.classes;
var gPref = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefService)
               .QueryInterface(Components.interfaces.nsIPrefBranch2);

Components.utils['import']('resource://ntab/quickdial.jsm');
Components.utils['import']('resource://ntab/hash.jsm');
Components.utils['import']('resource://ntab/session.jsm');

function getShellService() {
	var shell = null;
	try {
		shell = Components.classes["@mozilla.org/browser/shell-service;1"]
				.getService(Components.interfaces.nsIShellService);
	} catch (e) {dump("*** e = " + e + "\n");}
	return shell;
}

var ntab = (function(){
	function _t(view) {
		tracker.track({
			type: 'view',
			action: 'switch',
			sid: view
		});
	}

	return {
		// TODO change pref: moa.ntab.view
		onclick_to_browser: function() {
			ntab.check_browser();
			window.setTimeout(function() {
				if (gPref.getBoolPref('moa.ntab.browser')) {
					$('set_default_browser_msg').style.display = 'block';
					window.setTimeout(function() {
						var _opacity = 1;
						function _setopacity() {
							if (_opacity <= 0) {
								$('set_default_browser_msg').style.display = 'none';
								$('set_default_browser_msg').style.opacity = 0;
								return;
							}

							_opacity -= 0.1;
							$('set_default_browser_msg').style.opacity = _opacity;
							window.setTimeout(_setopacity, 50);
						}
						_setopacity();
					}, 2000)
				}
			}, 110)
		},

		onclick_to_cehomepage: function() {
			cehomepage.set_cehomepage();
			window.setTimeout(function() {
				if (gPref.getCharPref('browser.startup.homepage').indexOf("about:cehome") != -1) {
					$('set_homepage_msg').style.display = 'block';
					window.setTimeout(function() {
						var _opacity = 1;
						function _setopacity() {
							if (_opacity <= 0) {
								$('set_homepage_msg').style.display = 'none';
								$('set_homepage_msg').style.opacity = 0;
								return;
							}

							_opacity -= 0.1;
							$('set_homepage_msg').style.opacity = _opacity;
							window.setTimeout(_setopacity, 50);
						}
						_setopacity();
					}, 2000)
				}
			}, 110)
		},


		onclick_to_blank: function() {
			ntab.switch_to('blank');
			_t('blank');
		},

		onclick_to_search: function() {
			ntab.switch_to('search');
			_t('search');
		},

		onclick_to_dial: function() {
			ntab.switch_to('quickdial');
			_t('quickdial');
		},

		onclick_to_nav: function() {
			ntab.switch_to('nav');
			_t('nav');
		},

		switch_to: function(view_name) {
			gPref.setCharPref('moa.ntab.view', view_name);
			// Switch to view immidiately.
			this.updateView(view_name);
		},

		check_browser: function() {
			var shell = getShellService();
			if (shell.isDefaultBrowser(true)) {
				gPref.setBoolPref('moa.ntab.browser', true);
			} else {
				gPref.setBoolPref('moa.ntab.browser', false);
				default_browser.set_default();
				window.setTimeout(default_browser.update_default_view, 100);
			}
		},


		showView: function(view_id) {
			var shell = getShellService();
			if(shell.isDefaultBrowser(true)) {
				gPref.setBoolPref('moa.ntab.browser', true);
			} else {
				gPref.setBoolPref('moa.ntab.browser', false);
			}

			window.setTimeout(default_browser.update_default_view, 100);


//			window.setTimeout(cehomepage.update_default_view, 100);



			var children = $('main-content').childNodes;
			for (i = 0; i < children.length; i++) {
				var child = children[i];
				if (view_id == child.id) {
					child.style.display = '';
					child.style.position = 'relative';
					child.style.top = '0';
					child.style.left = '0';
				} else if (child.tagName) {
					/**
					 * Set position to absolute to get element out of view
					 * Do not set display to none here, because we need to calculate the content size of iframes.
					 * @see nav.init
					 **/
					child.style.position = 'absolute';
					child.style.top = '-100000px';
					child.style.left = '-100000px';
				}
			}
		},

		updateView: function() {
			closeAllPromptDialog();
			var view = gPref.getCharPref('moa.ntab.view');
			switch (view) {
				case 'nav':
					nav.show();
					break;
				case 'search':
					search.show();
					break;
				case 'blank':
					ntab.showView(-1);
					break;
				case 'quickdial':
				default:
					quickDial.initDialBox(false);
					break;
			}

			var switchers = $('layout').querySelectorAll('DIV:first-child DIV.button-switch');
			for (var i = 0; i < switchers.length; i++) {
				var s = switchers[i];
				if (s.id == 'btn_' + view) {
					CSS.add(s, 'selected');
				} else {
					CSS.del(s, 'selected');
				}
			}

			if (view == 'blank') {
				CSS.add($('ntab-view-switchers-box'), 'blank');
			} else {
				CSS.del($('ntab-view-switchers-box'), 'blank');
			}
		},

		prefObserver: {
			QueryInterface : function (aIID) {
				if (aIID.equals(Components.interfaces.nsIObserver) ||
					aIID.equals(Components.interfaces.nsISupports) ||
					aIID.equals(Components.interfaces.nsISupportsWeakReference))
					return this;
				throw Components.results.NS_NOINTERFACE;
		    },

		    observe: function(subject, topic, data) {
		    	if (topic == 'nsPref:changed') {
		    		if (data == 'moa.ntab.view') {
		    			ntab.updateView();
		    		}
					if(data == 'moa.ntab.dial.column' || data == 'moa.ntab.dial.row' || data == 'moa.ntab.dial.showSearch') {
						var view = gPref.getCharPref('moa.ntab.view');
						quickDial.initDialBox(true);
						ntab.updateView();
					}
		    	}
		    }
		}
	}
})();

var default_browser = (function() {
	var is_default = false;
	return {
		set_default: function() {
			var shell = getShellService();
			if (!shell.isDefaultBrowser(true)) {
				shell.setDefaultBrowser(true, false);
				gPref.setBoolPref('moa.ntab.browser', true);
			}
		},

		update_default_view: function(){
			$("btn_browser").style.display = gPref.getBoolPref('moa.ntab.browser') ? 'none' : 'block';
		},

		prefObserver: {
			QueryInterface : function (aIID) {
				if (aIID.equals(Components.interfaces.nsIObserver) ||
					aIID.equals(Components.interfaces.nsISupports) ||
					aIID.equals(Components.interfaces.nsISupportsWeakReference))
					return this;
				throw Components.results.NS_NOINTERFACE;
		    },

		    observe: function(subject, topic, data) {
				if (topic == 'nsPref:changed') {
		    		if (data == 'moa.ntab.browser') {
		    			window.setTimeout(default_browser.update_default_view, 100);
		    		}
		    	}
		    }
		}
	}
})();

var cehomepage = (function() {
	var is_default = false;
	return {
		set_cehomepage: function() {
			gPref.setCharPref('browser.startup.homepage', 'about:cehome');
		},

		update_default_view: function(){
			$("btn_homepage").style.display = (gPref.getCharPref('browser.startup.homepage').indexOf('about:cehome') != -1)
												? 'none' : 'block';
		},

		prefObserver: {
			QueryInterface : function (aIID) {
				if (aIID.equals(Components.interfaces.nsIObserver) ||
					aIID.equals(Components.interfaces.nsISupports) ||
					aIID.equals(Components.interfaces.nsISupportsWeakReference))
					return this;
				throw Components.results.NS_NOINTERFACE;
		    },

		    observe: function(subject, topic, data) {
				if (topic == 'nsPref:changed') {
		    		if (data == 'browser.startup.homepage') {
		    			window.setTimeout(cehomepage.update_default_view, 100);
		    		}
		    	}
		    }
		}
	}
})();

function iframeLoader(options) {
	this.initialize(options);
}

iframeLoader.prototype = {
	initialize: function(options) {
		this.options = extend(options, {
			onDOMContentLoaded: emptyFunction,
			onIntervalBeforeLoaded: emptyFunction,
			iframe: null
		});

		if (!this.options.iframe)
			return;

		this.monitor();
	},

	monitor: function() {
		var iframe = this.options.iframe;
		var self = this;
		function _onLoad(event) {
			self.options.onDOMContentLoaded();

			window.clearInterval(_interval_before_loaded);
			// remove listeners
			iframe.contentDocument.removeEventListener('DOMContentLoaded', _onLoad, false);
			iframe.removeEventListener('load', _onLoad, false);

			function changeLinkTarget(event) {
				var element = event.target;
				element = element.parentNode && element.parentNode instanceof HTMLAnchorElement ? element.parentNode : element;
				if (element instanceof HTMLFormElement ||
					element instanceof HTMLAnchorElement) {
					element.target = gPref.getBoolPref('moa.ntab.openLinkInNewTab') ? '_blank' : '_top';
				}
			}
			// Hack click event on HTMLAnchorElement, open link in _top window.
			iframe.contentDocument.body.addEventListener('click', changeLinkTarget, true);

			// Hack form submit
			iframe.contentDocument.body.addEventListener('submit', changeLinkTarget, true);

			// Hach context menu
			iframe.contentDocument.addEventListener('contextmenu', getChromeWindow().MOA.NTab.onContextMenu, false);
		}

		var _interval_before_loaded = null;
		/**
		 * Can not get the actual document object of iframe right now
		 * Set an interval to check readyState of the contentDocument
		 * When readyState is changed to something rather than uninitialized (loading | interactive | loaded | complete),
		 * add event listener to DOMContentLoaded
		 **/
		var _interval = window.setInterval(function() {
			var readyState = iframe.contentDocument.readyState;
			if (readyState && readyState != 'uninitialized') {
				iframe.contentDocument.addEventListener('DOMContentLoaded', _onLoad, false);
				_interval_before_loaded = window.setInterval(function() {
					self.options.onIntervalBeforeLoaded();
				}, 200);
				window.clearInterval(_interval);
				window.clearTimeout(_timeout);
			}
		}, 100);

		var _timeout = window.setTimeout(function() {
			window.clearInterval(_interval);
		}, 10000)

		iframe.addEventListener('load', _onLoad, false);
	}
};

function webView(options) {
	this.initialize(options);
}

webView.prototype = {
	initialize: function(options) {
		this.options = extend(options, {
			view_id: null,
			src: null,
			target_frame_id: null
		});

		if (!this.options.view_id || !this.options.src)
			return;

		this.isInitialized = false;
	},

	show: function() {
		if (!this.isInitialized) {
			var iframe = null;
			if (!this.options.target_frame_id) {
				iframe = document.createElement('IFRAME');
				$(this.options.view_id).appendChild(iframe);
			} else {
				iframe = $(this.options.target_frame_id);
			}

			iframe.src = this.options.src;

			function _sizeToContent(event) {
				var height = iframe.contentDocument.documentElement.scrollHeight;
				iframe.style.height = height + 'px';
			}

			new iframeLoader({
				onDOMContentLoaded: _sizeToContent,
				onIntervalBeforeLoaded: _sizeToContent,
				onTimeout: _sizeToContent,
				iframe: iframe
			});
		}
		this.isInitialized = true;
		ntab.showView(this.options.view_id);
	}
};

var nav = new webView({
	view_id: 'nav',
	src: gPref.getCharPref('moa.ntab.view.nav.url'),
	target_frame_id: 'nav_iframe'
});

var search = new webView({
	view_id: 'search',
	src: gPref.getCharPref('moa.ntab.view.search.url'),
	target_frame_id: 'search_iframe'
});

function queryHistoryByFreq(n) {
	var result = [];


	try {
		var conn = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService)
				.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
		var sql = [];
		sql.push('SELECT (');
		sql.push('	SELECT url FROM');
		sql.push('	moz_favicons');
		sql.push('	WHERE ');
		sql.push('	        id = s.favicon_id');
		sql.push('	LIMIT 1');
		sql.push('        ) AS _favicon, (');
		sql.push('	SELECT title ');
		sql.push('	FROM moz_places ');
		sql.push('	WHERE ');
		sql.push('		favicon_id = s.favicon_id ');
		sql.push('		AND ');
		sql.push('		visit_count > 0 ');
		sql.push('		AND ');
		sql.push('		hidden = 0 ');
		sql.push('	ORDER BY ');
		sql.push('		frecency DESC LIMIT 1');
		sql.push('	) AS _title, (');
		sql.push('	SELECT url ');
		sql.push('	FROM moz_places ');
		sql.push('	WHERE ');
		sql.push('		favicon_id = s.favicon_id ');
		sql.push('		AND ');
		sql.push('		visit_count > 0 ');
		sql.push('		AND ');
		sql.push('		hidden = 0 ');
		sql.push('	ORDER BY frecency DESC LIMIT 1) AS _url ');
		sql.push('FROM moz_places s ');
		sql.push('WHERE ');
		sql.push('	favicon_id IS NOT NULL ');
		sql.push('	AND ');
		sql.push('	frecency != 0 ');
		sql.push('	AND');
		sql.push('	visit_count > 0 ');
		sql.push('	AND ');
		sql.push('	hidden = 0 ');
		sql.push('GROUP BY favicon_id ');
		sql.push('ORDER BY MAX(frecency) DESC LIMIT ?');

		var statement = conn.createStatement(sql.join('\n'));
		statement.bindInt32Parameter(0, n);
		while (statement.executeStep()) {
			result.push({
				favicon: statement.getString(0),
				title: statement.getString(1),
				url: statement.getString(2)
			});
		}
	} catch (e) {
		// alert(e);
	}

	return result;
}

function _getFaviconForURL(url) {
	var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
	var faviconService = Cc['@mozilla.org/browser/favicon-service;1'].getService(Ci.nsIFaviconService);
	var icon = faviconService.getFaviconImageForPage(ioService.newURI(url, null, null)).spec;
	return icon == 'chrome://mozapps/skin/places/defaultFavicon.png' ? 'chrome://ntab/skin/icon/favicon.png' : icon;
}

// 8/9/2011 for BD request, change taobao pid.   writed by xxie
function filterTaobaoPid(url) {
	url = url.replace(/mm_12811289_2210561_8696507/g, "mm_28347190_2425761_9313997");
	return url;
}

var quickDial = (function() {
	var isInitialized = false;
	function generateHTMLForDial(num, dial, nocache, first_load) {
		var html = [];
		if (!!dial) {
			html.push('		<div>');
			html.push('			<div>');
			html.push('				<div class="div-table dial-bar">');
			html.push('					<div>');
			// If it is first load, wait 100ms and load favicon, or it will cost too much time.
			if (first_load) {
				html.push('						<div class="dial-favicon"><div class="' + (dial.icon ? 'default-favicon' : 'dial-def-favicon') + '" imagesrc="' + (dial.icon ? dial.icon : 'chrome://ntab/skin/icon/favicon.png') +  '"></div></div>');

			} else {
				html.push('						<div class="dial-favicon"><div class="' + (dial.icon ? '' : 'dial-def-favicon') + '"><img src="' + (dial.icon ? dial.icon : 'chrome://ntab/skin/icon/favicon.png') + '"/></div></div>');
			}
			html.push('						<div class="dial-title"><div class="text-ellipsis">' + escapeHTML(dial.title) + '</div></div>');
			html.push('						<div class="dial-opt-box"><div class="btn-opt btn-opt-edit" onclick="quickDial.editDial(' + num + ')" _title="ntab.dial.label.edit"></div></div>');
			html.push('						<div class="dial-opt-box"><div class="btn-opt btn-opt-del" onclick="quickDial.delDial(' + num + ')" _title="ntab.dial.label.del"></div></div>');
			html.push('					</div>');
			html.push('				</div>');
			html.push('			</div>');
			html.push('		</div>');
			html.push('		<div>');
			html.push('			<div>');
			// Get snapshot url for dial
			var wnd = getChromeWindow();
			var thumbnail = wnd.MOA.NTab.Snapshot.getSnapshotUrl(dial.url);

			// If thumbnail is null, and nocache is set 'True', then add some random code to make sure snapshot image is loaded with nocache.
			if (nocache && thumbnail) {
				thumbnail += '?r=' + Math.random();
			}

			// Check if url is under processing, if not, create it now.
			if (!thumbnail && !hashModule.contains(dial.url)) {
				getChromeWindow().MOA.NTab.Snapshot.createSnapshot(dial.url);
			}

			var backgournd = !thumbnail ? '' : 'background:url(' + thumbnail + ') no-repeat scroll center 0 transparent';
			var className = !thumbnail ? 'loading' : '';
			html.push('				<div>');
			html.push('					<a draggable="false" onclick="quickDial.onclickdial(' + num + ');" href="' + completeURL(filterTaobaoPid(dial.url)) + '"><div style="height: 100%; width: 100%;' + backgournd + '" class="' + className + '"></div></a>');
			html.push('				</div>');
			html.push('			</div>');
			html.push('		</div>');
		} else {
			html.push('		<div>');
			html.push('			<div>');
			html.push('				<div class="div-table dial-bar">');
			html.push('					<div>');
			html.push('						<div class="dial-favicon"><div class="dial-def-favicon"><img src="chrome://ntab/skin/icon/favicon.png" /></div></div>');
			html.push('						<div class="dial-title"><div></div></div>');
			html.push('						<div class="dial-opt-box"><div class="btn-opt btn-opt-edit" onclick="quickDial.editDial(' + num + ')" _title="ntab.dial.label.edit"></div></div>');
			html.push('					</div>');
			html.push('				</div>');
			html.push('			</div>');
			html.push('		</div>');
			html.push('		<div>');
			html.push('			<div>');
			html.push('				<div class="quickdial-add" style="height: 100%; text-align: center; cursor: pointer;" onclick="quickDial.addDial(' + num + ');">');
			html.push('					<span>' + _('ntab.dial.label.clicktoadddial') + '</span>');
			html.push('				</div>');
			html.push('			</div>');
			html.push('		</div>');
		}
		return html.join('\n');
	}

	var _dragenternum = null;
	var _dragtimeout = null;

	function _ondragenter(num) {
		window.clearTimeout(_dragtimeout);
		_dragtimeout = window.setTimeout(function(n) {
			if (_dragenternum) {
				CSS.del($('item-' + _dragenternum), 'quick-dial-item-drag-over')
			}
			_dragenternum = n;
			CSS.add($('item-' + n), 'quick-dial-item-drag-over')
		}, 10, num);
	}

	function _ondragleave(num) {
		window.clearTimeout(_dragtimeout);
		_dragtimeout = window.setTimeout(function(n) {
			if (_dragenternum) {
				CSS.del($('item-' + _dragenternum), 'quick-dial-item-drag-over')
			}
		}, 10, num);
	}

	var COLUMNS = 4;
	var ROWS = 2;
	var MAX_COLUMN_ROW = 10;

	function _getAllBookmarks() {
		var result = [];
		if (!gPref.getBoolPref('moa.ntab.quickdial.showpersonalhistory'))
			return result;

		// var conn = Cc['@mozilla.org/browsernav-history-service;1'].getService(Ci.nsINavBookmarksService)
		//		.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
		var conn = Cc['@mozilla.org/browser/nav-history-service;1'].getService(Ci.nsINavHistoryService)
				.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
		var sql = 'SELECT b.title as title, p.url as url FROM moz_bookmarks b, moz_places p WHERE b.type = 1 AND b.fk = p.id AND p.hidden = 0';
		var statement = conn.createStatement(sql);
		while (statement.executeStep()) {
			result.push({
				favicon: _getFaviconForURL(statement.getString(1)),
				title: statement.getString(0),
				url: statement.getString(1)
			});
		}

		return result;
	}

	function _filter(str) {
		return !str ? str : str.replace(/'/g, '\\\'');
	}

	function _fillSiteSelections(sites, place) {
		var html = [];
		for (var i = 0; i < sites.length; i++) {
			var site = sites[i];
			var filterURL = site.url.replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com");
			html.push('<div>');
			html.push('	<div><img src="' + _getFaviconForURL(filterURL) + '" /></div>');
			html.push('	<div>');
			html.push('	<a class="text-ellipsis" href="' + filterURL + '" onclick="quickDial.quickSelect(\'' + _filter(filterURL) + '\', \'' + _filter(site.title) + '\'); return false;">' + escapeHTML(site.title) + '</a>');
			html.push('	</div>');
			html.push('</div>');
		}
		place.innerHTML = html.join('\n');
	}

	return {
		initDialBox: function(refreshWholePage) {
			if(!refreshWholePage) {
				if (isInitialized) {
					ntab.showView('quick_dial');
					return;
				}
			} else {
				if (!isInitialized) {
					return;
				}
			}
			isInitialized = true;

			var _cell = gPref.getIntPref('moa.ntab.dial.column');
			_cell = _cell > 0 ? _cell < MAX_COLUMN_ROW ? _cell : MAX_COLUMN_ROW : COLUMNS;
			var _row = gPref.getIntPref('moa.ntab.dial.row');
			_row = _row > 0 ? _row < MAX_COLUMN_ROW ? _row : MAX_COLUMN_ROW : ROWS;

			var html = [];
			for (var i = 0; i < _row; i++) {
				html.push('<div>');

				for (var j = 0; j < _cell; j++) {
					var num = i * _cell + j + 1;
					var dial = quickDialModule.getDial(num);
					var item_id = 'item-' + num;

					html.push('<div>');
					html.push('	<div class="div-table quick-dial-item ' + (dial ? 'dial-used' : '') + '" id="' + item_id + '" draggable="true"' +
						'ondragstart="quickDial.ondragstart(event, ' + num + ');" ' +
						'ondragover="quickDial.ondragover(event);" ondrop="quickDial.ondrop(event, ' + num + ');"' +
						'ondragenter="quickDial.ondragenter(event, ' + num + ');"' +
						'ondragleave="quickDial.ondragleave(event, ' + num + ');" >');
					var itemHTML = generateHTMLForDial(num, dial, false, true);
					html.push(itemHTML);
					html.push('	</div>');
					html.push('</div>');
				}

				html.push('</div>');
			}
			$('quick_dial_box').innerHTML = html.join('');

			function _setFavIcons() {
				var faviconDIVArray = document.querySelectorAll('div.default-favicon');
				for (var j = 0; j < faviconDIVArray.length; j++) {
					var imageURL = faviconDIVArray[j].getAttribute('imagesrc');
					var image = document.createElement('img');
					image.setAttribute('src', imageURL);
					faviconDIVArray[j].appendChild(image);
				}
			}

			//insert favicon asynchronous  only asynchronous at first time
			if(!refreshWholePage) {
				window.setTimeout(_setFavIcons, 100);
			} else {
				_setFavIcons();
			}

			if (gPref.getBoolPref('moa.ntab.dial.showSearch')) {
				// display search box
				$('quickdial_search_banner').style.display = '';
				$('quickdial_search').src = gPref.getCharPref('moa.ntab.dial.search.url');
			} else {
				$('quickdial_search_banner').style.display = 'none';
			}

			new iframeLoader({
				onDOMContentLoaded: function() {
					$('quickdial_search').style.visibility = 'visible';
				},
				onTimeout: emptyFunction,
				iframe: $('quickdial_search')
			});

			ntab.showView('quick_dial');
		},

		addDial: function(num) {
			this.editDial(num);
		},

		refreshAll: function(num) {
			var _cell = gPref.getIntPref('moa.ntab.dial.column');
			_cell = _cell > 0 ? _cell < MAX_COLUMN_ROW ? _cell : MAX_COLUMN_ROW : COLUMNS;
			var _row = gPref.getIntPref('moa.ntab.dial.row');
			_row = _row > 0 ? _row < MAX_COLUMN_ROW ? _row : MAX_COLUMN_ROW : ROWS;

			var total = _cell * _row;
			for (var i = 0; i < total; i++) {
				this.refreshDial(i + 1);
			}
		},

		refreshDial: function(num) {
			var dial = quickDialModule.getDial(num);
			if (!dial) {
				quickDialModule.removeDial();
				return;
			}
			var wnd = getChromeWindow();
			wnd.MOA.NTab.Snapshot.refreshSnapshot(dial.url);
			quickDialModule.refreshDialViewRelated(dial.url);
		},

		quickSelect: function(url, title) {
			var inputs = $('prompt-content-box').querySelectorAll('DIV.prompt-edit-dial > DIV:first-child > INPUT[type=text].input-url');
			if (inputs.length != 1)
				return;
			inputs[0].value = url;

			inputs = $('prompt-content-box').querySelectorAll('DIV.prompt-edit-dial > DIV:first-child > INPUT[type=text].input-title');
			inputs[0].value = title;
		},

		editDial: function(num) {
			var elem = document.createElement('div');
			elem.innerHTML = templates.dialEditingTemplate;
			elem.className = 'prompt-edit-dial';

			var pd = new PromptDialog({
				elem: elem,
				beforeShow: function() {
					// init tabbox
					TAB.init(elem);


					if (gPref.getBoolPref('moa.ntab.quickdial.showpersonalhistory')) {
					// most visted web sites.
						_fillSiteSelections(queryHistoryByFreq(20), elem.querySelectorAll('DIV.tabbox > DIV.tabpanels > DIV.mostvisited-sites')[0]);

					// Show bookmarks
						_fillSiteSelections(_getAllBookmarks(), elem.querySelectorAll('DIV.tabbox > DIV.tabpanels > DIV.bookmark-sites')[0])
					}

					// set other sites
					httpGet(gPref.getCharPref('moa.ntab.dial.sitesjson'), function(response) {
						if (response.readyState == 4 && 200 == response.status) {
							var sites = null;
							try {
								sites = JSON.parse(response.responseText);
							} catch (err) { }

							if (!sites)
								return;

							_fillSiteSelections(sites, elem.querySelectorAll('DIV.tabbox > DIV.tabpanels > DIV.nav-sites')[0]);
						}
					});

					var dial = quickDialModule.getDial(num);

					if (!dial) {
						CSS.add(elem, 'prompt-add-dial');
					}

					var urlinput = elem.querySelectorAll('DIV:first-child > INPUT[type=text].input-url')[0];
					var titleinput = elem.querySelectorAll('DIV:first-child > INPUT[type=text].input-title')[0];
					if (dial) {
						urlinput.value = dial.url;
						titleinput.value = dial.title;
					} else {
						urlinput.value = 'http://';
						titleinput.value = _('ntab.dial.editdialog.titleinput');
					}

					// response for ENTER key
					var inputs = elem.querySelectorAll('DIV:first-child > INPUT[type=text]');
					for (var i = 0; i < inputs.length; i++) {
						inputs[i].onkeypress = function(event) {
							switch (event.keyCode) {
								// enter
								case 13:
									if (false != _onok()) {
										pd.destroy();
									}
									break;
							}
						}
					}
				},
				afterShow: function() {
					var dial = quickDialModule.getDial(num);
					if (!dial) {
						var urlinput = elem.querySelectorAll('DIV:first-child > INPUT[type=text].input-title')[0];
						urlinput.focus();
						urlinput.setSelectionRange(0, urlinput.value.length);
					}
				},
				onOK: function() {
					return _onok();
				},
				onCancel: function() {
					pd.destroy();
				}
			});

			function _onok() {
				var input = elem.querySelectorAll('DIV:first-child > INPUT.input-url')[0];
				input.value = input.value.trim();
				if ('' == input.value) {
					input.focus();
					return false;
				}
				// append http:// as default prefix
				input.value = completeURL(input.value);
				// TODO check if it is a url
				if (!/^(http(s)?|ftp):\/\/.+/.test(input.value)) {
					alert('请输入一个正确的网址！');
					input.focus();
					return false;
				}

				var url = input.value;
				var dial = quickDialModule.getDial(num);

				var refresh = elem.querySelectorAll('DIV:first-child > INPUT.checkbox-refresh')[0].checked;
				// Check if url has been changed, if yes, then create snapshot for it.
				if (refresh || !dial || url != dial.url) {
					// get main chrome window
					var wnd = getChromeWindow();
					wnd.MOA.NTab.Snapshot.createSnapshot(url);
				}

				var title = elem.querySelectorAll('DIV:first-child > INPUT.input-title')[0].value.trim();
				// Update dial
				quickDialModule.updateDial(num, {
					url: url,
					title: title
				}, refresh);
			}
		},

		delDial: function(num) {
			var element = document.createElement('DIV');
			element.className = 'confirm-msg';
			var dial = quickDialModule.getDial(num);
			element.textContent = _('ntab.dial.delConfirmMsg', [dial.title ? dial.title : dial.url]);
			new PromptDialog({
				elem: element,
				onOK: function() {
					quickDialModule.removeDial(num);
				}
			});
		},

		updateDialView: function(num) {
			var item_id = 'item-' + num;
			if (!$(item_id))
				return;

			var dial = quickDialModule.getDial(num);
			$(item_id).innerHTML = generateHTMLForDial(num, dial, true, false);
		},

		prefObserver: {
			QueryInterface : function (aIID) {
				if (aIID.equals(Components.interfaces.nsIObserver) ||
					aIID.equals(Components.interfaces.nsISupports) ||
					aIID.equals(Components.interfaces.nsISupportsWeakReference))
					return this;
				throw Components.results.NS_NOINTERFACE;
		    },

		    observe: function(subject, topic, data) {
		    	if (topic == 'nsPref:changed') {
		    		if (data == 'moa.ntab.quickdial.hidehistory') {
		    			quickDial.onShowHideHistory();
		    			return;
		    		}
		    		if (data.indexOf('moa.ntab.dial.update.') == 0) {
		    			quickDial.updateDialView(data.substring('moa.ntab.dial.update.'.length));
		    		}
		    	}
		    }
		},

		ondragstart: function(event, num) {
			event.dataTransfer.setData('text/ntab-dial', num);
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.dropEffect ='move';
		},

		ondrop: function(event, num) {
			event.preventDefault();
			var source = event.dataTransfer.getData('text/ntab-dial');
			if (source && source != num) {
				quickDialModule.exchangeDial(source, num);
			} else if (event.dataTransfer.getData("text/uri-list")) {
				var title = '';
				if (event.dataTransfer.getData("text/html")) {
					var fragment = Cc["@mozilla.org/feed-unescapehtml;1"]
                             .getService(Ci.nsIScriptableUnescapeHTML)
                             .parseFragment(event.dataTransfer.getData("text/html"), false, null, document.createElement('DIV'))
					title = fragment.textContent;
				}

				quickDialModule.updateDial(num, {
					url: event.dataTransfer.getData("text/uri-list"),
					title: title
				});
			}
			// stop propagation, in order to stop trigerring open tab action etc.
			event.stopPropagation();
			_ondragleave(num);
		},

		ondragover: function(event) {
			if (event.dataTransfer.getData('text/ntab-dial') ||
				event.dataTransfer.getData("text/uri-list")) {
				event.preventDefault();
			}
		},

		ondragenter: function(event, num) {
			if (event.dataTransfer.getData('text/ntab-dial') ||
				event.dataTransfer.getData("text/uri-list")) {
				event.preventDefault();
				_ondragenter(num);
			}
		},

		ondragleave: function(event, num) {
			_ondragleave(num);
		},

		hideHistory: function(hide) {
			gPref.setBoolPref('moa.ntab.quickdial.hidehistory', hide);
		},

		onShowHideHistory: function() {
			var hide = gPref.getBoolPref('moa.ntab.quickdial.hidehistory');
			if (true === hide) {
				CSS.add($('history'), 'hide');
				CSS.del($('show_history'), 'hide');
			} else {
				CSS.add($('show_history'), 'hide');
				CSS.del($('history'), 'hide');
			}
		},

		onclickdial: function(num) {
			tracker.track({
				type: 'quickdial',
				action: 'click',
				fid: quickDialModule.getDial(num).defaultposition,
				sid: num
			});
		}
	}
})();

function _fillSites(sites, place, showIcon) {

	var divs = [];
	for (var i = 0; i < sites.length; i++) {
		var site = sites[i];
		var filterURL = site.url.replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com");
		var div = document.createElement('DIV');
		if (showIcon) {
			div.innerHTML = '<div><img src="chrome://ntab/skin/icon/favicon.png"></img></div><a class="text-ellipsis" href="' + completeURL(filterURL) + '">' + escapeHTML(site.title) + '</a>';
		} else {
			div.innerHTML = '<a class="text-ellipsis" href="' + completeURL(filterURL) + '">' + escapeHTML(site.title) + '</a>';
		}
		place.appendChild(div);
		divs.push(div);
	}

	// Optimize favicon loading perfomance, when ntab page is first-run.
	if (showIcon) {
		window.setTimeout(function() {
			for (var i = 0; i < sites.length; i++) {
				var site = sites[i];
				var filterURL = site.url.replace(/start\.linuxdeepin\.com/ig, "start.linuxdeepin.com");
				var iconUrl = _getFaviconForURL(filterURL);
				if (!iconUrl || iconUrl == 'chrome://ntab/skin/icon/favicon.png') {
					iconUrl = site.iconUrl ? site.iconUrl : iconUrl;
				}
				divs[i].childNodes[0].childNodes[0].src = iconUrl;
			}
		}, 100);
	}
}

function _fillRemoteSites(sitesContent, place) {
	sitesContent = _filter(sitesContent);
	place.innerHTML = sitesContent;
}

function _filter(inString) {
	inString =  inString.replace(/expression\((.|\n)*\);?/ig, "");
	inString = inString.replace(/\s*(href|src)\s*=\s*("\s*(javascript|vbscript)\s*:\s*[^"]+"|'\s*(javascript|vbscript)\s*:\s*[^']+'|(javascript|vbscript)\s*:\s*[^\s]+)\s*(?=>)/ig, "");
	inString = inString.replace(/\s*on[a-z]+\s*=\s*("[^"]+"|'[^']+'|[^\s]+)\s*(?=>)/ig, "");
	inString = inString.replace(/<(script|link|style|iframe)(.|\n)*<\/\1>\s*/ig, "");
	return inString;
}

function fillHistory() {
	quickDial.onShowHideHistory();

	if (gPref.getBoolPref('moa.ntab.quickdial.showpersonalhistory')) {
		// set most visited sites.
		_fillSites(queryHistoryByFreq(10), $('history').querySelectorAll('DIV.mostvisited-sites')[0]);

		// set last session sites
		_fillSites(session.query(10), $('history').querySelectorAll('DIV.lastsession-sites')[0]);
	}


	// set others
	var branch = gPref.getCharPref('moa.ntab.dial.branch');
	var sitesTabs = null;
	try {
		var defaultDataJSM = {};
		Components.utils['import']('resource://ntab/quickdial/' + branch + '/default.jsm', defaultDataJSM);
		sitesTabs = defaultDataJSM.defaultQuickDial.sitesTabs;
	} catch (e) {
		sitesTabs = [];
	}

	sitesTabs.forEach(function(tabObj) {
		var tabs = $('history').querySelectorAll('DIV.tabbox > DIV.tabs')[0];
		var tabDiv = document.createElement('DIV');
		tabDiv.textContent = _(tabObj.nameStr);
		tabDiv.className = 'tab';
		tabDiv.id = 'nav_sites';
		// Insert tab node before hide-btn which is the last one.

		tabs.insertBefore(tabDiv, tabs.childNodes[tabs.childNodes.length - 1]);


		var tabPanelDiv = null;
		if ($(tabObj.panelId)) {
			tabPanelDiv = $(tabObj.panelId);
		} else {
			tabPanelDiv = document.createElement('DIV');
			tabPanelDiv.className = 'tabpanel sites-list link-trace';
			tabPanelDiv.id = tabObj.panelId;
			$('history').querySelectorAll('DIV.tabbox > DIV.tabpanels')[0].appendChild(tabPanelDiv);
		}

		httpGet(gPref.getCharPref(tabObj.urlPref), function(response) {
			if (response.readyState == 4 && 200 == response.status) {
				var sites = null;
				try {
					//sites = JSON.parse(response.responseText);
					sitesContent = response.responseText;
				} catch (err) {
					// alert(err);
				}

				if (!sitesContent)
					return;

//				_fillSites(sites, tabPanelDiv, tabObj.showIcon);
				_fillRemoteSites(sitesContent, tabPanelDiv);
			}
		});
	});


	var tabs = $('history').querySelectorAll('DIV.tabbox > DIV.tabs')[0];
	var anchor = document.createElement('a');
	anchor.textContent = _('ntab.dial.label.firefoxchina');
	anchor.href = gPref.getCharPref('moa.ntab.view.firefoxchina.url');
	anchor.className = 'homepagetabanchor';
	var anchorDiv = document.createElement('DIV');
	anchorDiv.className = 'homepagetab';
	anchorDiv.appendChild(anchor);
	tabs.insertBefore(anchorDiv, tabs.childNodes[tabs.childNodes.length - 1]);


	TAB.init($('history'), function(node) {
		gPref.setCharPref('moa.ntab.quickdial.history.view', node.id);
	});

	// switch to last view
	var lastTabView = gPref.getCharPref('moa.ntab.quickdial.history.view');
	if ($(lastTabView) && $(lastTabView).onclick) {
		$(lastTabView).onclick();
	}
}

document.addEventListener('contextmenu', getChromeWindow().MOA.NTab.onContextMenu, false);
document.addEventListener('click', function(event) {
	var element = event.target.parentNode instanceof HTMLAnchorElement ? event.target.parentNode : event.target;
	if (!element instanceof HTMLAnchorElement)
		return;

	if (!element.href || !isValidUrl(element.href))
		return;

	element.target = gPref.getBoolPref('moa.ntab.openLinkInNewTab') ? '_blank' : '_top';
}, false);

window.addEventListener('DOMContentLoaded', function() {
	// Prevent conflict with fastestfox
	if (typeof jQuery != 'undefined' && typeof jQuery.noConflict == 'function') {
		try {
			jQuery.noConflict();
		} catch (e) { }
	}

	gPref.addObserver('moa.ntab.', quickDial.prefObserver, true);
	gPref.addObserver('moa.ntab.', ntab.prefObserver, true);
//	gPref.addObserver('browser.startup.homepage', cehomepage.prefObserver, true);
	gPref.addObserver('moa.ntab.', default_browser.prefObserver, true);
	gPref.addObserver('moa.ntab.backgroundimage', custom.prefObserver, true);
	fillHistory();
	ntab.updateView();
	custom.showBgImage();

	tracker.track({
		type: 'view',
		action: 'load',
		sid: gPref.getCharPref('moa.ntab.view')
	});
}, true);

window.addEventListener('unload', function() {
	gPref.removeObserver('moa.ntab.', quickDial.prefObserver, true);
	gPref.removeObserver('moa.ntab.', ntab.prefObserver, true);
//	gPref.removeObserver('browser.startup.homepage', cehomepage.prefObserver, true);
	gPref.removeObserver('moa.ntab.', default_browser.prefObserver, true);
	gPref.removeObserver('moa.ntab.backgroundimage', custom.prefObserver, true);
}, true);
