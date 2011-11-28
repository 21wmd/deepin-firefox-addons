function $(id) {
	return document.getElementById(id);
};

function offset(elem) {
	var box = elem.getBoundingClientRect();
	return {
		top: box.top,
		left: box.left
	}
}

function emptyFunction() { }

function escapeHTML(str) {
	return !str ? str : str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function completeURL(url) {
	if (!url)
		return url;

	if (url.indexOf('http://') != 0 && url.indexOf('https://') != 0 && url.indexOf('ftp://')!=0) {
		url = 'http://' + url;
	}

	try {
		var ioService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		var uri = ioService.newURI(url, null, null);

		// if url is 'http://', then spec will be http:///
		// so in order to prevent such case, test if uri.host exists.
		if (!uri.host) {
			return url;
		} else {
			return uri.spec;
		}
	} catch (e) {
		return url;
	}
}

function extend(src, target) {
	for (var key in src) {
		target[key] = src[key];
	}
	return target;
}

var CSS = {
	is: function(node, cls) {
		var re = new RegExp('(^|\\s)' + cls + '(\\s|$)');
		if (re.test(node.className)) {
			return true;
		} else {
			return false;
		}
	},

	add: function(node, cls) {
		if (this.is(node, cls))
			return;
		var clss = node.className.split(' ');
		clss.push(cls);
		node.className = clss.join(' ');
	},

	del: function(node, cls) {
		var clss = node.className.split(' ');
		for (var i in clss) {
			if (clss[i] == cls) {
				clss.splice(i, 1);
				node.className = clss.join(' ');
				return;
			}
		}
	},

	find: function(cls, node) {
		if (!node) {
			node = document;
		}
		if (node.getElementsByClassName) {
			return node.getElementsByClassName(cls);
		} else if (node.querySelectorAll) {
			return node.querySelectorAll('.' + cls);
		} else if (document.getElementsByClassName) {
			return document.getElementsByClassName.call(node, cls);
		}
	}
};

function getChromeWindow() {
	return QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		.getInterface(Components.interfaces.nsIWebNavigation)
		.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
		.rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		.getInterface(Components.interfaces.nsIDOMWindow);
}

var TAB = {
	init: function(elem, callback) {
		// TODO using XBL
		// Register tabbox
		var tabboxs = elem.querySelectorAll('DIV.tabbox');
		for (var i = 0; i < tabboxs.length; i++) {
			var tabbox = tabboxs[i];
			var tabs = tabbox.querySelectorAll('DIV.tabs > DIV.tab');
			var tabpanels = tabbox.querySelectorAll('DIV.tabpanels > DIV.tabpanel');

			if (tabs.length != tabpanels.length) {
				throw 'Structure is wrong.';
			}

			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j];
				tab.onclick = function() {
					CSS.add(this, 'selected');
					var _tabs = this.parentNode.querySelectorAll('DIV.tab');
					var _tabpanels = this.parentNode.parentNode.querySelectorAll('DIV.tabpanels > DIV.tabpanel');
					for (var k = 0; k < _tabs.length; k++) {
						if (this == _tabs[k]) {
							_tabpanels[k].style.display = 'block';
							continue;
						}

						CSS.del(_tabs[k], 'selected')
						_tabpanels[k].style.display = 'none';
					}

					if (typeof callback == 'function') {
						callback(this);
					}
				};
			}
		}
	}
};

function httpGet(url, onreadystatechange) {
	var xmlHttpRequest = new XMLHttpRequest();
	xmlHttpRequest.open('GET', url, true);
	xmlHttpRequest.send(null);
	xmlHttpRequest.onreadystatechange = function() {
		onreadystatechange(xmlHttpRequest);
		//if (4 == xmlHttpRequest.readyState && 200 == xmlHttpRequest.status) {
		//	onSuccess(xmlHttpRequest);
		//}
	};
}

function isValidUrl(aUrl) {
  // valid urls don't contain spaces ' '; if we have a space it isn't a valid url.
  // Also disallow dropping javascript: or data: urls--bail out
  if (!aUrl || !aUrl.length || aUrl.indexOf(" ", 0) != -1 ||
       /^\s*(javascript|data|chrome):/.test(aUrl))
    return false;

  return true;
}


function closeAllPromptDialog() {
	var evt = document.createEvent('HTMLEvents');
	evt.initEvent('NTabClosePD', false, false);
	document.dispatchEvent(evt);
}

function PromptDialog(options) {
	this.initialize(options);
}

PromptDialog.prototype = {
	initialize: function(options) {
		this.options = extend(options, {
			beforeShow: emptyFunction,
			afterShow: emptyFunction,
			onCancel: emptyFunction,
			onOK: emptyFunction,
			elem: null,						// elements to be shown in dialog
		});

		if (!this.options.elem) {
			return;
		}

		// close other prompt dialogs.
		closeAllPromptDialog();
		this.addEventListeners();
		this.show();
	},

	addEventListeners: function() {
		var self = this;
		this.eventLisenters = [];
		this.eventLisenters.push({
			element: document,
			eventName: 'NTabClosePD',
			func: function() {
				self.destroy();
			}
		});

		this.eventLisenters.push({
			element: $('prompt-btn-close'),
			eventName: 'click',
			func: function() {
				self.destroy();
			}
		});

		this.eventLisenters.push({
			element: $('prompt-btn-ok'),
			eventName: 'click',
			func: function() {
				if (false !== self.options.onOK()) {
					self.destroy();
				}
			}
		});

		this.eventLisenters.push({
			element: $('prompt-dialog'),
			eventName: 'keypress',
			func: function(event) {
				if (event.keyCode == '27') {
					self.destroy();
				}
			}
		});

		this.eventLisenters.push({
			element: $('prompt-btn-cancel'),
			eventName: 'click',
			func: function() {
				self.options.onCancel();
				self.destroy();
			}
		});

		for (var i = 0; i < this.eventLisenters.length; i++) {
			var tmp = this.eventLisenters[i];
			tmp.element.addEventListener(tmp.eventName, tmp.func, false);
		}
	},

	removeEventListeners: function() {
		if (!this.eventLisenters)
			return;

		for (var i = 0; i < this.eventLisenters.length; i++) {
			var tmp = this.eventLisenters[i];
			tmp.element.removeEventListener(tmp.eventName, tmp.func, false);
		}
	},

	show: function() {
		this.options.beforeShow();
		$('prompt-dialog').style.display = '';
		$('prompt-content-box').appendChild(this.options.elem);
		// auto focus ok button, so user could use 'ENTER' key to confirm dialog.
		$('prompt-btn-ok').focus();
		this.options.afterShow();
	},

	destroy: function() {
		this.removeEventListeners();
		$('prompt-dialog').style.display = 'none';
		$('prompt-content-box').removeChild(this.options.elem);
	}
};
