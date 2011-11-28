(function() {
	// Initial global object
	// This object can be access by: MOA.NTab.Snapshot
	var snapshot = MOA.ns('NTab.Snapshot');

	var Cc = Components.classes;
	var Ci = Components.interfaces;

	Components.utils['import']('resource://ntab/utils.jsm');
	Components.utils['import']('resource://ntab/quickdial.jsm');
	Components.utils['import']('resource://ntab/hash.jsm');

	// Pre-defined snapshot
	var snapshotMap = {};
	try {
		var defaultDataJSM = {};
		var prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService).getBranch('moa.ntab.dial.');
		var branch = prefs.getCharPref('branch');
		Components.utils['import']('resource://ntab/quickdial/' + branch + '/default.jsm', defaultDataJSM);
		snapshotMap = defaultDataJSM.defaultQuickDial.snapshotMap;
	} catch (e) {
		snapshotMap = {
			'http://www.linuxdeepin.com/': 'chrome://ntab/skin/thumb/master/ld.png',
			'http://start.linuxdeepin.com/': 'chrome://ntab/skin/thumb/master/ldstart.png',
			'http://www.1616.net/': 'chrome://ntab/skin/thumb/master/1616.png',
			'http://www.baidu.com/': 'chrome://ntab/skin/thumb/master/baidu.png',
			'http://www.baidu.com/s?ie=utf8&wd=': 'chrome://ntab/skin/thumb/master/baidu.png',
			'http://www.renren.com/': 'chrome://ntab/skin/thumb/master/renren.png',
			'http://www.360buy.com/': 'chrome://ntab/skin/thumb/master/360.png',
			'http://click.union.360buy.com/JdClick/?unionId=206&siteId=8&to=http://www.360buy.com/': 'chrome://ntab/skin/thumb/master/360.png',
			'http://www.tmall.com/': 'chrome://ntab/skin/thumb/master/taobao.png',
			'http://s.click.taobao.com/t_9?p=mm_12811289_0_0&l=http%3A%2F%2Fmall.taobao.com%2F': 'chrome://ntab/skin/thumb/master/tmall.png',
			'http://www.sina.com.cn/': 'chrome://ntab/skin/thumb/master/sina.png',
			'http://www.amazon.cn/': 'chrome://ntab/skin/thumb/master/joyo.png',
			'http://www.amazon.cn/?source=mozilla9-23': 'chrome://ntab/skin/thumb/master/joyo.png',
			'http://www.google.com/': 'chrome://ntab/skin/thumb/master/google.jpg',
			'http://www.google.com.hk/': 'chrome://ntab/skin/thumb/master/google.jpg',
            'http://www.youdao.com/': 'chrome://ntab/skin/thumb/master/youdao.jpg',
            'http://cn.bing.com/': 'chrome://ntab/skin/thumb/master/bing.jpg',
            'http://www.bing.com/': 'chrome://ntab/skin/thumb/master/bing.jpg',
		};
	}


	/*** Implement methods in snapshot object. ***/

	/**
	 * Return the chrome url of snapshot by website url.
	 * If snapshot is not generated yet, return null.
	 *
	 * @param url
	 * 		url of website, e.g.： http://www.baidu.com
	 *
	 * @return string
	 * 		return chrome url of snapshot, e.g.: chrome://ntab-profile/snapshot123.png
	 *      If snapshot is not generated yet, return null.
	 *
	 */
	snapshot.getSnapshotUrl = function(url) {
		if (snapshotMap[url])
			return snapshotMap[url];

		var hashName = utils.md5(url);
		var file = utils.getProFile(['ntab', 'cache', hashName]);
		if (!file)
			return '';

		var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		return ioService.newFileURI(file).spec;
	};

	/**
	 * Tell snapshot module to create a snapshot for a given url.
	 *
	 * @param url
	 * 		url of website
	 *
	 * @return
	 * 		no return.
	 * 		Snapshot module should call function back: MOA.NTab.TabLoader.snapshotDone()
	 */
	snapshot.createSnapshot = function(url) {
		if (snapshotMap[url])
			return;

		// Add url to global hash, indicate that the url is under processing.
		hashModule.add(url, true);
		queue.push(url);
		processQueue();
	};

	/**
	 * Tell snapshot module to refresh snapshot for a given url.
	 *
	 * @param url
	 * 		url of website
	 *
	 * @return
	 * 		no return.
	 */
	snapshot.refreshSnapshot = function(url) {
		this.removeSnapshot(url);
		this.createSnapshot(url);
	};

	/**
	 * Tell snapshot module to remove snapshot.
	 *
	 * @param url
	 * 		url of website
	 *
	 * @return
	 * 		no return
	 */
	snapshot.removeSnapshot = function(url) {
		utils.removeFile(['ntab', 'cache', utils.md5(url)]);
	};

	// Array to store urls
	var queue = [];
	var MAX_CONNECTIONS = 3;
	var snapshots = [];
	var TIMEOUT_LOAD = 30000;
	var browserSize = {
						small : {width : 512, height : 384},
						normal : {width : 1024, height : 768},
						cutArea : {width : 256, height : 192}
					  };
	function processQueue() {
		if (snapshots.length >= MAX_CONNECTIONS)
			return;

		if (queue.length == 0)
			return;

		MOA.debug('Start generate snapshot for url: ' + queue[0]);
		snapshots.push(new NTSnapshot(queue.shift()));
	}

	function _snapshotDone(snapshot) {
		MOA.debug('Snapshot is done for url: ' + snapshot.url);

		var tmp = [];
		for (var i = 0; i < snapshots.length; i++) {
			if (snapshot == snapshots[i])
				continue;
			tmp.push(snapshots[i]);
		}
		snapshots = tmp;
		processQueue();

		MOA.debug('Refresh dial related: ' + snapshot.url);
		// Remove url from global hash, indicate that the snapshot work has been done.
		hashModule.remove(snapshot.url);
		quickDialModule.snapshotDone(snapshot.url);
	}

	var NTSnapshot = function(url) {
		this.initialize(url);
	};

	NTSnapshot.prototype = {
		initialize: function(url) {
			this.url = url;
			var self = this;
			setTimeout(function() {
				self.load();
			}, 0);
		},

		load: function() {
			MOA.debug('Create hidden browser to load url: ' + this.url);
			this.browser = document.createElement('browser');
			this.browser.width = browserSize.small.width;
			this.browser.height = browserSize.small.height;
			this.browser.setAttribute('type', 'content');
			document.getElementById('nt-hidden-box').appendChild(this.browser);

			var self = this;
			var other = this;
			this.loadEvent = function() {
				// FIXME loaded twice.
				// alert(self.browser.contentWindow.document.location);
				MOA.debug('Timeout when loading url: ' + self.url);
				self.onload();
			};

			this.timeout = window.setTimeout(function() {
				MOA.debug('Page has been loaded: ' + self.url);
				self.onload();
			}, TIMEOUT_LOAD);

			this.browser.setAttribute('src', this.url);
			this.browser.addEventListener('load', this.loadEvent, true);
		},

		onload: function() {
			MOA.debug('Create canvas to draw window: ' + this.url);

			window.clearTimeout(this.timeout);
			this.browser.removeEventListener('load', this.loadEvent, true);

			function getFavicon(doc) {
				var links = doc.getElementsByTagName('link');
				for (var i = 0; i < links.length; i++) {
					var link = links[i];
					if (/icon/i.test(link.rel)) {
						return link.href;
					}
				}

				if (!utils.isLocal(doc.location)) {
					var uri = utils.getNsiURL(doc.location);
					return uri.prePath + '/favicon.ico';
				}
			}
			//adapted from https://gist.github.com/1036506
			function isDominantByOneColor(context, width, height) {
			  let colorCount = {};
			  let maxCount = 0;
			  let dominantColor = "";
			  // data is an array of a series of 4 one-byte values representing the rgba values of each pixel
			  let data = context.getImageData(0, 0, width, height).data;

			  for (let i = 0; i < data.length; i += 4) {
				// ignore transparent pixels
				if (data[i+3] == 0)
				  continue;

				let color = data[i] + "," + data[i+1] + "," + data[i+2];

				colorCount[color] = colorCount[color] ? colorCount[color] + 1 : 1;

				// keep track of the color that appears the most times
				if (colorCount[color] > maxCount) {
				  maxCount = colorCount[color];
				  dominantColor = color;
				}
			  }
			   // 0.4 is defined by test, maybe have better value
				return  (maxCount / (data.length / 4)) > 0.45;
			}
			function drawImageSnapshot() {
				MOA.debug('Image has been loaded: height=' + this.height + '   width=' + this.width);
				if (this.height <= 113 || this.width <= 113) {
					getNextURLSnapshot();
				} else {
					var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
					canvas.width = 206;
                    canvas.height = 132;
					var context = canvas.getContext('2d');
					context.clearRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = "#FFFFFF";
                    context.fillRect(0, 0, canvas.width, canvas.height);
					if(this.height <= canvas.height) {
						context.drawImage(this, Math.floor(0.5 * (canvas.width - this.width)), Math.floor(0.5 * (canvas.height - this.height)));
					} else {
					// image is square
						context.drawImage(this, Math.floor(0.5 * (canvas.width - canvas.height)), 0, canvas.height, canvas.height);
					}
					var data = canvas.toDataURL('image/png');
					var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
					var uri = ioService.newURI(data, 'UTF8', null);
					utils.saveURIToProFile(['ntab', 'cache', utils.md5(self.url)], uri, function() {
						MOA.debug('Snapshot image has been saved: ' + self.url);
						_snapshotDone(self);
						self.destroy();
					});
				}
			}
			function getNextURLSnapshot() {
			MOA.debug('imageArray length: ' + imageArray.length);
				if(imageArray.length == 0) {
					cutWebPageCorner();
				} else {
					var imageurl = imageArray.shift();
					var image = new Image();
					image.src = imageurl;
					image.onload = drawImageSnapshot;
					image.onerror = getNextURLSnapshot;
				}
			}
			var imageArray = [];
			var wnd = this.browser.contentWindow;
			var doc = wnd.document;
			var iconLink = doc.querySelectorAll('link[rel="icon"], link[rel^="apple-touch-icon"]');
			for (var i = 0; i < iconLink.length; i++) {
				imageArray.push(iconLink[i].href);
			}
			var host = doc.location.hostname;
			MOA.debug('Hostname: ' + host);
			imageArray.push('http://' + host + '/apple-touch-icon-114x114-precomposed.png');
			imageArray.push('http://' + host + '/apple-touch-icon-114x114.png');
			imageArray.push('http://' + host + '/apple-touch-icon-precomposed.png');
			imageArray.push('http://' + host + '/apple-touch-icon.png');
			// update title and favicon
			quickDialModule.updateTitleIfEmpty(this.url, doc.title);
			utils.setFavicon(this.url, getFavicon(doc));
			quickDialModule.updateFavicon(this.url);

			// Settimeout to draw thumbnail, make sure that whole page is complete rendered.
			var self = this;
			function cutWebPageCorner() {
				var width = browserSize.cutArea.width;
				var height = browserSize.cutArea.height;

				var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
				// keep same scale of with / height
				canvas.width = 206;
				canvas.height = height * canvas.width / width;

				var context = canvas.getContext('2d');
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.scale(canvas.width / width,
							canvas.height / height);
				context.save();
				context.drawWindow(wnd, 0, 0, width, height, 'rgb(255,255,255)');
				if(!isDominantByOneColor(context, width, height)) {
					var data = canvas.toDataURL('image/png');
					var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
					var uri = ioService.newURI(data, 'UTF8', null);
					utils.saveURIToProFile(['ntab', 'cache', utils.md5(self.url)], uri, function() {
						MOA.debug('Snapshot image has been saved: ' + self.url);
						_snapshotDone(self);
						self.destroy();
					});
				} else {
					width = browserSize.small.width;
					height = browserSize.small.height;
					canvas.width = 206;
					canvas.height = height * canvas.width / width;
					var context = canvas.getContext('2d');
					context.clearRect(0, 0, canvas.width, canvas.height);
					context.scale(canvas.width / width,
								canvas.height / height);
					context.save();
					context.drawWindow(wnd, 0, 0, width, height, 'rgb(255,255,255)');
					var data = canvas.toDataURL('image/png');
					var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
					var uri = ioService.newURI(data, 'UTF8', null);
					utils.saveURIToProFile(['ntab', 'cache', utils.md5(self.url)], uri, function() {
						MOA.debug('Snapshot image has been saved: ' + self.url);
						_snapshotDone(self);
						self.destroy();
					});
				}
			}
			getNextURLSnapshot();
//			cutWebPageCorner();
		},

		destroy: function() {
			window.clearTimeout(this.timeout);
			if (this.browser) {
				this.browser.removeEventListener('load', this.loadEvent, true);
				if (this.browser.parentNode) {
					this.browser.parentNode.removeChild(this.browser);
				}
				delete this.browser;
			}
		}
	};

	window.addEventListener('unload', function(event) {
		while (snapshots.length > 0) {
			var snapshot = snapshots.shift();
			hashModule.remove(snapshot.url);
			snapshot.destroy();
		}
	}, false);
})();
