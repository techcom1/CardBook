try {
	ChromeUtils.import("resource://gre/modules/Services.jsm");
	ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
}
catch(e) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
}

function CardBookCmdLineHandler() {}

CardBookCmdLineHandler.prototype = {
	classID: Components.ID("{823f4516-885f-492d-b8d3-d5e8c8316be1}"),
	QueryInterface: XPCOMUtils.generateQI([ Components.interfaces.nsICommandLineHandler ]),

	handle: function (aCmdLine) {
		if (aCmdLine.handleFlag("cardbook", false)) {
			let topWindow = Services.wm.getMostRecentWindow("CardBook:standaloneWindow");
			if (topWindow) {
				topWindow.focus();
			} else {
				Services.ww.openWindow(null, "chrome://cardbook/content/standalone/wdw_cardbookWin.xul", "_blank",
										"chrome,extrachrome,menubar,resizable,scrollbars,status,toolbar,dialog=no", aCmdLine);
			}
			aCmdLine.preventDefault = true;
		}
	},

	helpInfo: "  -cardbook            Open CardBook.\n"
};

function NSGetFactory(cid) {
	return (XPCOMUtils.generateNSGetFactory([CardBookCmdLineHandler]))(cid);
}
