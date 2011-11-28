const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');

function AboutCEhome() {}
AboutCEhome.prototype = {
	classDescription: 'China Edition New Home about:cehome',
	contractID: '@mozilla.org/network/protocol/about;1?what=cehome',
	classID: Components.ID('c0a76f7d-8214-4476-afe3-b34f9051cb99'),
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule]),

	getURIFlags: function(aURI) {
		return (Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT |
				Ci.nsIAboutModule.ALLOW_SCRIPT);
	},
	
	newChannel: function(aURI) {
		var ios = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		var secMan = Cc['@mozilla.org/scriptsecuritymanager;1'].getService(Ci.nsIScriptSecurityManager);
		var principal = secMan.getCodebasePrincipal(aURI);
		var home = 'chrome://cehomepage/content/aboutHome.xul';
		var channel = ios.newChannel(home, null, null);
		channel.originalURI = aURI;
		return channel;
	}
};

// Definition for Firefox4
if (XPCOMUtils.generateNSGetFactory) {
	const NSGetFactory = XPCOMUtils.generateNSGetFactory([AboutCEhome]);
} else {
	const NSGetModule = function (aCompMgr, aFileSpec) {
		return XPCOMUtils.generateModule([AboutCEhome]);
	}
}
