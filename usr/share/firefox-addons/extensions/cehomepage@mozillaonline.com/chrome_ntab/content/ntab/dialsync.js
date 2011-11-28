var dialsync = (function() {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	Components.utils['import']('resource://ntab/utils.jsm');
	Components.utils['import']("resource://gre/modules/FileUtils.jsm");


	var _gPref = Components.classes["@mozilla.org/preferences-service;1"]
				   .getService(Components.interfaces.nsIPrefService)
				   .QueryInterface(Components.interfaces.nsIPrefBranch2);

	function _deleteCachedSnapshot(){
		var snapShotDir = utils.getProFile(['ntab', 'cache']);
		if (!snapShotDir || !snapShotDir.exists()){
			return;
		}
		var entries =snapShotDir.directoryEntries;
		var array = [];
		while(entries.hasMoreElements()) {
			var entry = entries.getNext();
			entry.QueryInterface(Components.interfaces.nsIFile);
			array.push(entry);
		}
		for (var i = array.length - 1; i >= 0; i--) {
			if(array[i].isFile()) {
				array[i].remove(false);
			}
		}
	}

	return {
		importJSON: function() {
			var element = document.createElement('DIV');
			element.className = 'pick-file';
			element.innerHTML = '<span>' + _('moa.ntab.importjson') + '</span><input type="file" />'
			new PromptDialog({
				elem: element,
				onOK: function() {
					if (!element.querySelectorAll('INPUT')[0].value)
						return;

					var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
					var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
					file.initWithPath(element.querySelectorAll('INPUT')[0].value);
					if(!file.exists()){
						return;
					}
					var userDataString = utils.readStrFromFile(file);
//					try {
						var userDataJSON = JSON.parse(userDataString);
						// check whether the file is correct
						for (var index in userDataJSON) {
							if(/^\d+$/.test(index)) {
								if(!userDataJSON[index].title || !userDataJSON[index].url ) {
									alert(_('moa.ntab.jsonfile.importerror'));
									return;
								}
								if (/javascript\s*:/.test(userDataJSON[index].url)) {
									alert(_('moa.ntab.jsonfile.importerror'));
									return;
								}
							} else if (index == 'column') {
								if(typeof(userDataJSON['column']) != 'number'
									|| userDataJSON['column'] < 1 || userDataJSON['column'] > 10) {
									alert(_('moa.ntab.jsonfile.importerror'));
									return;
								}
							} else if (index == 'row') {
								if(typeof(userDataJSON['row']) != 'number'
									|| userDataJSON['row'] < 1 || userDataJSON['row'] > 10) {
									alert(_('moa.ntab.jsonfile.importerror'));
									return;
								}
							}
						}
						var dialContent = userDataJSON.dialContent;
						for (var index in dialContent) {
							if(/^\d+$/.test(index)) {
								if(!dialContent[index].title || !dialContent[index].url ) {
									alert(_('moa.ntab.jsonfile.importerror'));
									return;
								}
								if (/javascript\s*:/.test(dialContent[index].url)) {
									alert(_('moa.ntab.jsonfile.importerror'));
									return;
								}
							}
						}
						if(typeof(userDataJSON['column']) != 'number' || userDataJSON['column'] < 1 || userDataJSON['column'] > 10) {
							alert(_('moa.ntab.jsonfile.importerror'));
							return;
						}
						if(typeof(userDataJSON['row']) != 'number' || userDataJSON['row'] < 1 || userDataJSON['row'] > 10) {
							alert(_('moa.ntab.jsonfile.importerror'));
							return;
						}
						
						_gPref.setIntPref('moa.ntab.dial.column', userDataJSON['column']);
						_gPref.setIntPref('moa.ntab.dial.row', userDataJSON['row']);
						_gPref.setBoolPref('moa.ntab.openInNewTab', (typeof userDataJSON['openInNewTab'] != 'boolean') ? true : !!userDataJSON['openInNewTab']);
						_gPref.setBoolPref('moa.ntab.dial.showSearch', (typeof userDataJSON['showSearch'] != 'boolean') ? true : !!userDataJSON['showSearch']);
						_gPref.setBoolPref('moa.ntab.display.usehotkey', (typeof userDataJSON['usehotkey'] != 'boolean') ? false : !!userDataJSON['usehotkey']);
						_gPref.setBoolPref('moa.ntab.dial.loadInExistingTabs', (typeof userDataJSON['loadInExistingTabs'] != 'boolean') ? false : !!userDataJSON['loadInExistingTabs']);
						_gPref.setBoolPref('moa.ntab.contextMenuItem.show', (typeof userDataJSON['contextMenuItem-show'] != 'boolean') ? true : !!userDataJSON['contextMenuItem-show']);
						_gPref.setBoolPref('moa.ntab.quickdial.showpersonalhistory', (typeof userDataJSON['showpersonalhistory'] != 'boolean') ? true : !!userDataJSON['showpersonalhistory']);
						
						utils.setStrToProFile(['ntab', 'quickdial.json'], JSON.stringify(dialContent));
						_deleteCachedSnapshot();
						alert(_('moa.ntab.jsonfile.imported'));
						quickDialModule.refresh();
						quickDial.initDialBox(true);
//					}catch(e) {
//						alert(_('moa.ntab.jsonfile.importerror'));
//					}
				}
			});
		},

		exportJSON: function() {
			try {
				var userDataString = utils.readStrFromProFile(['ntab', 'quickdial.json']);
				if(userDataString == "") {
					userDataString = quickDialModule.getDefaultDataStr();
				}
				var userDataJSON = {};
				var dialContent = JSON.parse(userDataString);
				for (var index in dialContent){
					delete dialContent[index].icon;
				}
				userDataJSON['dialContent'] = dialContent;
				//save all prefenrence
				userDataJSON['column'] = _gPref.getIntPref('moa.ntab.dial.column');
				userDataJSON['row'] = _gPref.getIntPref('moa.ntab.dial.row');
				userDataJSON['openInNewTab'] = _gPref.getBoolPref('moa.ntab.openInNewTab');
				userDataJSON['showSearch'] = _gPref.getBoolPref('moa.ntab.dial.showSearch');
				userDataJSON['usehotkey'] = _gPref.getBoolPref('moa.ntab.display.usehotkey');
				userDataJSON['loadInExistingTabs'] = _gPref.getBoolPref('moa.ntab.loadInExistingTabs');
				userDataJSON['contextMenuItem-show'] = _gPref.getBoolPref('moa.ntab.contextMenuItem.show');
				userDataJSON['showpersonalhistory'] = _gPref.getBoolPref('moa.ntab.quickdial.showpersonalhistory');
				var filename = "cedial-" + Date.now() + ".txt";
				var file = FileUtils.getFile("Desk", [filename]);
				if (!file.exists()) {
					file.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0666);
				}
				utils.setStrToFile(file, JSON.stringify(userDataJSON));
				alert(_('moa.ntab.jsonfile.exported', [filename]));
			}catch(e){
				alert(_('moa.ntab.jsonfile.exporterror'));
			}
		}
	};
})();
