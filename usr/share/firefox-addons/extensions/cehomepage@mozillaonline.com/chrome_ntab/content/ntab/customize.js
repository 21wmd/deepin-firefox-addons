var custom = (function() {
	var Cc = Components.classes;
	var Ci = Components.interfaces;

	var _image = null;
	var _width = 0;
	var _height = 0;
	function _resizeImage() {
		if (!_image)
			return;

		var clientWidth = document.documentElement.clientWidth;
		var clientHeight = document.documentElement.clientHeight;

		if ((clientWidth / clientHeight) > (_width / _height)) {
			_image.style.width = clientWidth + 'px';
			_image.style.height = _height * clientWidth / _width + 'px';
		} else {
			_image.style.height = clientHeight + 'px';
			_image.style.width = _width * clientHeight / _height + 'px';
		}
	}

	window.addEventListener('resize', _resizeImage, false);


	var _gPref = Components.classes["@mozilla.org/preferences-service;1"]
	               .getService(Components.interfaces.nsIPrefService)
	               .QueryInterface(Components.interfaces.nsIPrefBranch2);

	var _preReloadImage = null;

	function _changeBgImage() {
		// clear background image first.
		if (_image) {
			_image.parentNode.removeChild(_image);
			_image = null;
			CSS.del(document.body, 'withbg');
		}

		if (!_gPref.getCharPref('moa.ntab.backgroundimage')) {
			return;
		}

		var fileUrl = _gPref.getCharPref('moa.ntab.backgroundimage');

		if (_preReloadImage) {
			_preReloadImage.onload = emptyFunction;
		}

		_preReloadImage = new Image();
		_preReloadImage.src = fileUrl;
		_preReloadImage.onload = function() {
			CSS.add(document.body, 'withbg');
			_width = this.width;
			_height = this.height;

			if (!_image) {
				_image = new Image();
				_image.setAttribute('style', 'position: fixed; z-index: -100; top: 0; left: 0;');
				document.body.appendChild(_image);
			}

			_image.src = fileUrl;
			_resizeImage();
		}
	}

	return {
		pickImage: function() {
			var element = document.createElement('DIV');
			element.className = 'pick-file';
			element.innerHTML = '<span>' + _('moa.ntab.pickupimage') + '</span><input type="file" />'
			new PromptDialog({
				elem: element,
				onOK: function() {
					if (!element.querySelectorAll('INPUT')[0].value)
						return;

					var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
					var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
					file.initWithPath(element.querySelectorAll('INPUT')[0].value);

					_gPref.setCharPref('moa.ntab.backgroundimage', ioService.newFileURI(file).spec);
				}
			});
		},

		showBgImage: function() {
			_changeBgImage();
		},

		clearBgImage: function() {
			_gPref.setCharPref('moa.ntab.backgroundimage', '');
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
		    		if (data == 'moa.ntab.backgroundimage') {
		    			_changeBgImage();
		    		}
		    	}
		    }
		}
	};
})();
