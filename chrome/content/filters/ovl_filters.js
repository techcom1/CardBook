if ("undefined" == typeof(ovl_filters)) {
	try {
		ChromeUtils.import("resource:///modules/mailServices.js");
		ChromeUtils.import("resource:///modules/jsmime.jsm");
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource:///modules/mailServices.js");
		Components.utils.import("resource:///modules/jsmime.jsm");
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var ovl_filters = {
		
		_isLocalSearch: function(aSearchScope) {
			switch (aSearchScope) {
				case Components.interfaces.nsMsgSearchScope.offlineMail:
				case Components.interfaces.nsMsgSearchScope.offlineMailFilter:
				case Components.interfaces.nsMsgSearchScope.onlineMailFilter:
				case Components.interfaces.nsMsgSearchScope.localNews:
					return true;
				default:
					return false;
				}
		},

		_addEmails: function(aMsgHdrs, aActionValue, aField) {
			if (!cardbookPreferences.getEnabled(aActionValue)) {
				cardbookUtils.formatStringForOutput("errorFiltersAddEmailsABDisabled", [aField, aActionValue], "Error");
				return;
			}

			let count = aMsgHdrs.length;
			for (var i = 0; i < count; i++) {
				let hdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);
				var addresses = {}, names = {}, fullAddresses = {};
				MailServices.headerParser.parseHeadersWithArray(hdr[aField], addresses, names, fullAddresses);
				for (var j = 0; j < addresses.value.length; j++) {
					cardbookRepository.addCardFromDisplayAndEmail(aActionValue, names.value[j], addresses.value[j], "");
				}
			}
		},

		_removeEmails: function(aMsgHdrs, aActionValue, aField) {
			if (!cardbookPreferences.getEnabled(aActionValue)) {
				cardbookUtils.formatStringForOutput("errorFiltersRemoveEmailsABDisabled", [aField, aActionValue], "Error");
				return;
			}
			
			let count = aMsgHdrs.length;
			for (var i = 0; i < count; i++) {
				let hdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);
				var addresses = {}, names = {}, fullAddresses = {};
				MailServices.headerParser.parseHeadersWithArray(hdr[aField], addresses, names, fullAddresses);
				for (var j = 0; j < addresses.value.length; j++) {
					var myEmail = addresses.value[j].toLowerCase();
					if (cardbookRepository.cardbookCardEmails[aActionValue]) {
						if (cardbookRepository.cardbookCardEmails[aActionValue][myEmail]) {
							var myCard = cardbookRepository.cardbookCardEmails[aActionValue][myEmail][0];
							cardbookRepository.deleteCards([myCard], "cardbook.cardRemovedIndirect");
						}
					}
				}
			}
		},

		_matchEmails: function(aMsgHdrEmails, aSearchValue, aSearchOp) {
			if (!cardbookPreferences.getEnabled(aSearchValue)) {
				cardbookUtils.formatStringForOutput("errorFiltersMatchEmailsABDisabled", [aSearchValue], "Error");
				return false;
			}
			var addresses = {}, names = {}, fullAddresses = {};
			MailServices.headerParser.parseHeadersWithArray(aMsgHdrEmails, addresses, names, fullAddresses);
			var matches = false;
			for (var i = 0; i < addresses.value.length; i++) {
				switch (aSearchOp) {
					case Components.interfaces.nsMsgSearchOp.IsInAB:
					case Components.interfaces.nsMsgSearchOp.IsntInAB:
						if (i === 0) {
							if (cardbookRepository.isEmailInPrefIdRegistered(aSearchValue, addresses.value[i])) {
								matches = true;
							} else {
								matches = false;
							}
						} else {
							if (cardbookRepository.isEmailInPrefIdRegistered(aSearchValue, addresses.value[i])) {
								matches = (matches && true);
							} else {
								matches = (matches && false);
							}
						}
						break;
					default:
						Components.utils.reportError("invalid search operator : " + aSearchOp);
				}
			}
			if (aSearchOp == Components.interfaces.nsMsgSearchOp.IsntInAB) {
				return !matches;
			} else {
				return matches;
			}
		},

		onLoad: function () {
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");

			var searchFrom = {
				id: "cardbook#searchFrom",
				name: strBundle.GetStringFromName("cardbook.searchFrom.name"),
				getEnabled: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				needsBody: false,
				getAvailable: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				getAvailableOperators: function (scope, length) {
					if (!ovl_filters._isLocalSearch(scope)) {
						length.value = 0;
						return [];
					}
					length.value = 2;
					return [Components.interfaces.nsMsgSearchOp.IsInAB, Components.interfaces.nsMsgSearchOp.IsntInAB];
				},
				match: function (aMsgHdr, aSearchValue, aSearchOp) {
					return ovl_filters._matchEmails(aMsgHdr.author, aSearchValue, aSearchOp);
				}
			};
			MailServices.filters.addCustomTerm(searchFrom);

			var searchTo = {
				id: "cardbook#searchTo",
				name: strBundle.GetStringFromName("cardbook.searchTo.name"),
				getEnabled: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				needsBody: false,
				getAvailable: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				getAvailableOperators: function (scope, length) {
					if (!ovl_filters._isLocalSearch(scope)) {
						length.value = 0;
						return [];
					}
					length.value = 2;
					return [Components.interfaces.nsMsgSearchOp.IsInAB, Components.interfaces.nsMsgSearchOp.IsntInAB];
				},
				match: function (aMsgHdr, aSearchValue, aSearchOp) {
					return ovl_filters._matchEmails(aMsgHdr.recipients, aSearchValue, aSearchOp);
				}
			};
			MailServices.filters.addCustomTerm(searchTo);

			var searchCc = {
				id: "cardbook#searchCc",
				name: strBundle.GetStringFromName("cardbook.searchCc.name"),
				getEnabled: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				needsBody: false,
				getAvailable: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				getAvailableOperators: function (scope, length) {
					if (!ovl_filters._isLocalSearch(scope)) {
						length.value = 0;
						return [];
					}
					length.value = 2;
					return [Components.interfaces.nsMsgSearchOp.IsInAB, Components.interfaces.nsMsgSearchOp.IsntInAB];
				},
				match: function (aMsgHdr, aSearchValue, aSearchOp) {
					return ovl_filters._matchEmails(aMsgHdr.ccList, aSearchValue, aSearchOp);
				}
			};
			MailServices.filters.addCustomTerm(searchCc);

			var searchBcc = {
				id: "cardbook#searchBcc",
				name: strBundle.GetStringFromName("cardbook.searchBcc.name"),
				getEnabled: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				needsBody: false,
				getAvailable: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				getAvailableOperators: function (scope, length) {
					if (!ovl_filters._isLocalSearch(scope)) {
						length.value = 0;
						return [];
					}
					length.value = 2;
					return [Components.interfaces.nsMsgSearchOp.IsInAB, Components.interfaces.nsMsgSearchOp.IsntInAB];
				},
				match: function (aMsgHdr, aSearchValue, aSearchOp) {
					return ovl_filters._matchEmails(aMsgHdr.bccList, aSearchValue, aSearchOp);
				}
			};
			MailServices.filters.addCustomTerm(searchBcc);

			var searchAll = {
				id: "cardbook#searchAll",
				name: strBundle.GetStringFromName("cardbook.searchAll.name"),
				getEnabled: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				needsBody: false,
				getAvailable: function (scope, op) {
					return ovl_filters._isLocalSearch(scope);
				},
				getAvailableOperators: function (scope, length) {
					if (!ovl_filters._isLocalSearch(scope)) {
						length.value = 0;
						return [];
					}
					length.value = 2;
					return [Components.interfaces.nsMsgSearchOp.IsInAB, Components.interfaces.nsMsgSearchOp.IsntInAB];
				},
				// true && false => false
				// true || false => true
				match: function (aMsgHdr, aSearchValue, aSearchOp) {
					if (aSearchOp == Components.interfaces.nsMsgSearchOp.IsntInAB) {
						return (ovl_filters._matchEmails(aMsgHdr.author, aSearchValue, aSearchOp) &&
								ovl_filters._matchEmails(aMsgHdr.recipients, aSearchValue, aSearchOp) &&
								ovl_filters._matchEmails(aMsgHdr.ccList, aSearchValue, aSearchOp) &&
								ovl_filters._matchEmails(aMsgHdr.bccList, aSearchValue, aSearchOp));
					} else {
						return (ovl_filters._matchEmails(aMsgHdr.author, aSearchValue, aSearchOp) ||
								ovl_filters._matchEmails(aMsgHdr.recipients, aSearchValue, aSearchOp) ||
								ovl_filters._matchEmails(aMsgHdr.ccList, aSearchValue, aSearchOp) ||
								ovl_filters._matchEmails(aMsgHdr.bccList, aSearchValue, aSearchOp));
					}
				}
			};
			MailServices.filters.addCustomTerm(searchAll);

			var addFrom = {
				id: "cardbook#addFrom",
				name: strBundle.GetStringFromName("cardbook.addFrom.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "author");
				}
			};
			MailServices.filters.addCustomAction(addFrom);

			var addTo = {
				id: "cardbook#addTo",
				name: strBundle.GetStringFromName("cardbook.addTo.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "recipients");
				}
			};
			MailServices.filters.addCustomAction(addTo);

			var addCc = {
				id: "cardbook#addCc",
				name: strBundle.GetStringFromName("cardbook.addCc.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "ccList");
				}
			};
			MailServices.filters.addCustomAction(addCc);

			var addBcc = {
				id: "cardbook#addBcc",
				name: strBundle.GetStringFromName("cardbook.addBcc.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "bccList");
				}
			};
			MailServices.filters.addCustomAction(addBcc);

			var addAll = {
				id: "cardbook#addAll",
				name: strBundle.GetStringFromName("cardbook.addAll.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "author");
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "recipients");
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "ccList");
					ovl_filters._addEmails(aMsgHdrs, aActionValue, "bccList");
				}
			};
			MailServices.filters.addCustomAction(addAll);

			var removeFrom = {
				id: "cardbook#removeFrom",
				name: strBundle.GetStringFromName("cardbook.removeFrom.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "author");
				}
			};
			MailServices.filters.addCustomAction(removeFrom);

			var removeTo = {
				id: "cardbook#removeTo",
				name: strBundle.GetStringFromName("cardbook.removeTo.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "recipients");
				}
			};
			MailServices.filters.addCustomAction(removeTo);

			var removeCc = {
				id: "cardbook#removeCc",
				name: strBundle.GetStringFromName("cardbook.removeCc.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "ccList");
				}
			};
			MailServices.filters.addCustomAction(removeCc);

			var removeBcc = {
				id: "cardbook#removeBcc",
				name: strBundle.GetStringFromName("cardbook.removeBcc.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "bccList");
				}
			};
			MailServices.filters.addCustomAction(removeBcc);

			var removeAll = {
				id: "cardbook#removeAll",
				name: strBundle.GetStringFromName("cardbook.removeAll.name"),
				isValidForType: function(type, scope) {return true;},
				validateActionValue: function(value, folder, type) { return null;},
				allowDuplicates: true,
				needsBody: false,
				apply: function (aMsgHdrs, aActionValue, aListener, aType, aMsgWindow) {
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "author");
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "recipients");
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "ccList");
					ovl_filters._removeEmails(aMsgHdrs, aActionValue, "bccList");
				}
			};
			MailServices.filters.addCustomAction(removeAll);

			window.removeEventListener('load', arguments.callee, true);
		}
	};
	
	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
	loader.loadSubScript("chrome://cardbook/content/wdw_log.js");
};

window.addEventListener("load", function(e) { ovl_filters.onLoad(e); }, false);
