const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

function AboutNTab() {}
AboutNTab.prototype = {
	classDescription: 'China Edition New Tab about:ntab',
	contractID: '@mozilla.org/network/protocol/about;1?what=ntab',
	classID: Components.ID('3ce0f801-b121-4a20-9188-3b92b13e9809'),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

	getURIFlags: function(aURI) {
		return (Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT |
				Ci.nsIAboutModule.ALLOW_SCRIPT);
	},
	
	newChannel: function(aURI) {
		var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		var secMan = Cc['@mozilla.org/scriptsecuritymanager;1'].getService(Ci.nsIScriptSecurityManager);
		var principal = secMan.getCodebasePrincipal(aURI);
		var home = 'chrome://ntab/content/ntab.html';
		var channel = ios.newChannel(home, null, null);
		channel.originalURI = aURI;
		return channel;
	}
};

// Definition for Firefox4
if (XPCOMUtils.generateNSGetFactory) {
	const NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutNTab]);
} else {
	const NSGetModule = function (aCompMgr, aFileSpec) {
		return XPCOMUtils.generateModule([AboutNTab]);
	}
}
