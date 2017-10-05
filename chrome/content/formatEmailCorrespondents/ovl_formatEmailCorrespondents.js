if ("undefined" == typeof(ovl_formatEmailCorrespondents)) {
	var ovl_formatEmailCorrespondents = {

		getCardBookDisplayNameFromEmail: function(aEmail, aDefaultDisplay) {
			var found = false;
			var myResult = "";
			if (aEmail != null && aEmail !== undefined && aEmail != "") {
				var myTestString = aEmail.toLowerCase();
				for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && cardbookRepository.cardbookAccounts[i][6] != "SEARCH") {
						var myDirPrefId = cardbookRepository.cardbookAccounts[i][4];
						if (cardbookRepository.cardbookCardEmails[myDirPrefId]) {
							if (cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString]) {
								myResult = cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString][0].fn;
								found = true;
								break;
							}
						}
					}
				}
			}
			if (found) {
				if (myResult != null && myResult !== undefined && myResult != "") {
					return {found: found, result: myResult};
				} else {
					return {found: found, result: aEmail};
				}
			} else if (aDefaultDisplay != null && aDefaultDisplay !== undefined && aDefaultDisplay != "") {
				return {found: found, result: aDefaultDisplay};
			} else {
				return {found: found, result: aEmail};
			}
		},

		getDisplayNameColumn: function(aEmails, aContext) {
			var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
			var showCondensedAddresses = prefs.getBoolPref("mail.showCondensedAddresses");
			var exclusive = prefs.getBoolPref("extensions.cardbook.exclusive");
			var results = [];
			var addresses = {}, names = {}, fullAddresses = {};
			MailServices.headerParser.parseHeadersWithArray(aEmails, addresses, names, fullAddresses);
			for (var i = 0; i < addresses.value.length; i++) {
				var myCardBookResult = {};
				if (showCondensedAddresses) {
					if (names.value[i] != null && names.value[i] !== undefined && names.value[i] != "") {
						results.push(FormatDisplayName(addresses.value[i], names.value[i], aContext));
					} else {
						results.push(FormatDisplayName(addresses.value[i], "", aContext));
					}
				} else {
					if (names.value[i] != null && names.value[i] !== undefined && names.value[i] != "") {
						results.push(names.value[i]);
					} else {
						results.push(addresses.value[i]);
					}
				}
			}
			return results.join(", ");
		}
	};
};

function cardbookSenderHandler() {
};

cardbookSenderHandler.prototype = {
	getCellText: function(row, col) {
		//get the message's header so that we can extract the date field
		if (gDBView.isContainer(row) && gDBView.viewFlags & nsMsgViewFlagsType.kGroupBySort) {
			return "";
		} else {
			var hdr = gDBView.getMsgHdrAt(row);
			return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("sender"), "from");
		}
	},
	getSortStringForRow: function(hdr) {return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("sender"), "from");},
	isString:            function() {return true;},
	getCellProperties:   function(row, col, props){},
	getRowProperties:    function(row, props){},
	getImageSrc:         function(row, col) {return null;},
	getSortLongForRow:   function(hdr) {return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("sender"), "from");}
};

function cardbookRecipientsHandler() {
};

cardbookRecipientsHandler.prototype = {
	getCellText: function(row, col) {
		//get the message's header so that we can extract the date field
		if (gDBView.isContainer(row) && gDBView.viewFlags & nsMsgViewFlagsType.kGroupBySort) {
			return "";
		} else {
			var hdr = gDBView.getMsgHdrAt(row);
			return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("recipients"), "to");
		}
	},
	getSortStringForRow: function(hdr) {return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("recipients"), "to");},
	isString:            function() {return true;},
	getCellProperties:   function(row, col, props){},
	getRowProperties:    function(row, props){},
	getImageSrc:         function(row, col) {return null;},
	getSortLongForRow:   function(hdr) {return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("recipients"), "to");}
};

function cardbookCorrespondentHandler() {
};

cardbookCorrespondentHandler.prototype = {
    isOutgoingMail: function(aMsgHdr) {
		if (!aMsgHdr) {
			return false;
		}
		let author = aMsgHdr.mime2DecodedAuthor;
		if (author) {
			let am = MailServices.accounts;
			for (let identity in fixIterator(am.allIdentities, Components.interfaces.nsIMsgIdentity)) {
				if (author.includes(identity.email)) {
					return true;
				}
			}
		}
		return false;
	},
	getCellText: function(row, col) {
		//get the message's header so that we can extract the date field
		if (gDBView.isContainer(row) && gDBView.viewFlags & nsMsgViewFlagsType.kGroupBySort) {
			return "";
		} else {
			var hdr = gDBView.getMsgHdrAt(row);
			if (this.isOutgoingMail(hdr)) {
				return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("recipients"), "to");
			} else {
				return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("sender"), "from");
			}
		}
	},
	getSortStringForRow: function(hdr) {
		var hdr = gDBView.getMsgHdrAt(row);
		if (this.isOutgoingMail(hdr)) {
			return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("recipients"), "to");
		} else {
			return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("sender"), "from");
		}
	},
	isString:            function() {return true;},
	getCellProperties:   function(row, col, props){
		var hdr = gDBView.getMsgHdrAt(row);
		if (this.isOutgoingMail(hdr)) {
			return "outgoing";
		} else {
			return "incoming";
		}
	},
	getRowProperties:    function(row, props){},
	getImageSrc:         function(row, col) {return null;},
	getSortLongForRow:   function(hdr) {
		var hdr = gDBView.getMsgHdrAt(row);
		if (this.isOutgoingMail(hdr)) {
			return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("recipients"), "to");
		} else {
			return ovl_formatEmailCorrespondents.getDisplayNameColumn(hdr.getStringProperty("sender"), "from");
		}
	}
};

ovl_formatEmailCorrespondents.createObserver = {
	observe: function(aMsgFolder, aTopic, aData) {
		if (gDBView) {
			gDBView.addColumnHandler("senderCol", new cardbookSenderHandler());
			gDBView.addColumnHandler("recipientCol", new cardbookRecipientsHandler());
			gDBView.addColumnHandler("correspondentCol", new cardbookCorrespondentHandler());
		}
	}
};

ovl_formatEmailCorrespondents.addObserver = function() {
	var ObserverService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	ObserverService.addObserver(ovl_formatEmailCorrespondents.createObserver, "MsgCreateDBView", false);
};

// for the displayed name of emails columns
window.addEventListener("load", ovl_formatEmailCorrespondents.addObserver, false);



// for the displayed name of emails
// FormatDisplayName
(function() {
	// Keep a reference to the original function.
	var _original = FormatDisplayName;
	
	// Override a function.
	FormatDisplayName = function() {
		
		// Execute some action afterwards.
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
		var exclusive = prefs.getBoolPref("extensions.cardbook.exclusive");
		var showCondensedAddresses = prefs.getBoolPref("mail.showCondensedAddresses");
		var rv = "";
		if (exclusive) {
			if (showCondensedAddresses) {
				var myCardBookResult = {};
				myCardBookResult = ovl_formatEmailCorrespondents.getCardBookDisplayNameFromEmail(arguments[0],arguments[1])
				rv = myCardBookResult.result;
			} else {
				// Execute original function.
				rv = _original.apply(null, arguments);
				if (!(rv != null && rv !== undefined && rv != "")) {
					if (arguments[1] != null && arguments[1] !== undefined && arguments[1] != "") {
						rv = arguments[1];
					} else {
						rv = arguments[0];
					}
				}
			}
		} else {
			var myCardBookResult = {};
			myCardBookResult = ovl_formatEmailCorrespondents.getCardBookDisplayNameFromEmail(arguments[0], arguments[1])
			if (!myCardBookResult.found) {
				// Execute original function.
				rv = _original.apply(null, arguments);
				if (!(rv != null && rv !== undefined && rv != "")) {
					if (arguments[1] != null && arguments[1] !== undefined && arguments[1] != "") {
						rv = arguments[1];
					} else {
						rv = arguments[0];
					}
				}
			} else {
				rv = myCardBookResult.result;
			}
		}
		
		// return the original result
		return rv;
	};

})();
