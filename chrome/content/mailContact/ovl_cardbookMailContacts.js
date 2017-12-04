if ("undefined" == typeof(ovl_cardbookMailContacts)) {
	Components.utils.import("resource:///modules/gloda/msg_search.js");
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var ovl_cardbookMailContacts = {
		knownContacts: false,

		// used by ovl_cardbookMailContacts.isEmailRegistered to apply the mail account restrictions
		// used by ovl_attachments.setCardBookMenus to apply the mail account restrictions
		getIdentityKey: function() {
			var result = "";
			if (gFolderDisplay.selectedCount == 1) {
				var identity = accountManager.getFirstIdentityForServer(gFolderDisplay.selectedMessage.folder.server);
				if (identity) {
				 result = identity.key;
				}
			}
			return result;
		},

		addToCardBookMenuSubMenu: function(aMenuName, aCallbackFunction) {
			cardbookUtils.addToCardBookMenuSubMenu(aMenuName, ovl_cardbookMailContacts.getIdentityKey(), aCallbackFunction);
		},

		isEmailRegistered: function(aEmail) {
			return cardbookRepository.isEmailRegistered(aEmail, ovl_cardbookMailContacts.getIdentityKey());
		},

		getCardFromEmail: function(aEmail) {
			var myTestString = aEmail.toLowerCase();
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && (cardbookRepository.cardbookAccounts[i][6] != "SEARCH")) {
					var myDirPrefId = cardbookRepository.cardbookAccounts[i][4];
					if (cardbookRepository.cardbookCardEmails[myDirPrefId]) {
						if (cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString]) {
							return cardbookRepository.cardbookCardEmails[myDirPrefId][myTestString][0];
						}
					}
				}
			}
		},

		addToCardBook: function(aDirPrefId) {
			try {
				var myNewCard = new cardbookCardParser();
				myNewCard.dirPrefId = aDirPrefId;
				var myPopupNode = document.popupNode;
				var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
				var myEmail = myEmailNode.getAttribute('emailAddress');
				myNewCard.email.push([[myEmail], [], "", []]);
				myNewCard.fn = myEmailNode.getAttribute('displayName');
				if (myNewCard.fn == "") {
					myNewCard.fn = myEmail.substr(0, myEmail.indexOf("@")).replace("."," ").replace("_"," ");
				}
				var myDisplayNameArray = myNewCard.fn.split(" ");
				if (myDisplayNameArray.length > 1) {
					myNewCard.lastname = myDisplayNameArray[myDisplayNameArray.length - 1];
					var removed = myDisplayNameArray.splice(myDisplayNameArray.length - 1, 1);
					myNewCard.firstname = myDisplayNameArray.join(" ");
				}
				cardbookUtils.openEditionWindow(myNewCard, "AddEmail", "cardbook.cardAddedIndirect");

				var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
				var myEmail = myEmailNode.getAttribute('emailAddress');
				UpdateEmailNodeDetails(myEmail, myEmailNode);
			}
			catch (e) {
				var errorTitle = "addToCardBook";
				Services.prompt.alert(null, errorTitle, e);
			}
		},

		mailContextAddToCardBook: function(aDirPrefId) {
			try {
				var myNewCard = new cardbookCardParser();
				myNewCard.dirPrefId = aDirPrefId;
				var url = gContextMenu.linkURL;
				var myEmail = getEmail(url);
				myNewCard.email.push([[myEmail], [], "", []]);
				cardbookUtils.openEditionWindow(myNewCard, "AddEmail", "cardbook.cardAddedIndirect");
			}
			catch (e) {
				var errorTitle = "mailContextAddToCardBook";
				Services.prompt.alert(null, errorTitle, e);
			}
		},

		editOrViewContact: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			var isEmailRegistered = ovl_cardbookMailContacts.isEmailRegistered(myEmail);
	
			if (isEmailRegistered) {
				var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
				var myOutCard = new cardbookCardParser();
				cardbookUtils.cloneCard(myCard, myOutCard);
				if (myOutCard.isAList) {
					var myType = "List";
				} else {
					var myType = "Contact";
				}
				if (cardbookPreferences.getReadOnly(myCard.dirPrefId)) {
					cardbookUtils.openEditionWindow(myOutCard, "View" + myType);
				} else {
					cardbookUtils.openEditionWindow(myOutCard, "Edit" + myType, "cardbook.cardModifiedIndirect");
				}
				UpdateEmailNodeDetails(myEmail, myEmailNode);
			}
		},

		deleteContact: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			var isEmailRegistered = ovl_cardbookMailContacts.isEmailRegistered(myEmail);
	
			if (isEmailRegistered) {
				var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
				wdw_cardbook.deleteCardsAndValidate("cardbook.cardRemovedIndirect", [myCard]);
				UpdateEmailNodeDetails(myEmail, myEmailNode);
			}
		},

		findEmailsFromEmail: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			ovl_cardbookMailContacts.findEmails(null, [myEmail]);
		},

		findAllEmailsFromContact: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			var isEmailRegistered = ovl_cardbookMailContacts.isEmailRegistered(myEmail);
	
			if (isEmailRegistered) {
				var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
				ovl_cardbookMailContacts.findEmails([myCard], null);
			}
		},

		findEmails: function (aListOfSelectedCard, aListOfSelectedEmails) {
			var listOfEmail = [];
			if (aListOfSelectedCard != null && aListOfSelectedCard !== undefined && aListOfSelectedCard != "") {
				for (var i = 0; i < aListOfSelectedCard.length; i++) {
					if (!aListOfSelectedCard[i].isAList) {
						for (var j = 0; j < aListOfSelectedCard[i].email.length; j++) {
							listOfEmail.push(aListOfSelectedCard[i].email[j][0][0].toLowerCase());
						}
					} else {
						listOfEmail.push(aListOfSelectedCard[i].fn.replace('"', '\"'));
					}
				}
			} else if (aListOfSelectedEmails != null && aListOfSelectedEmails !== undefined && aListOfSelectedEmails != "") {
				listOfEmail = JSON.parse(JSON.stringify(aListOfSelectedEmails));
			}
			
			var tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane");
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
			// gloda is not defined when used from an independant window
			tabmail.openTab("glodaFacet", {searcher: new GlodaMsgSearcher(null, '"' + listOfEmail.join('" "') + '"', false)});
		},

		findEventsFromEmail: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			var isEmailRegistered = ovl_cardbookMailContacts.isEmailRegistered(myEmail);
			if (isEmailRegistered) {
				var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
				ovl_cardbookMailContacts.findEvents(null, [myEmail], myEmail, "mailto:" + myEmail, myCard.fn);
			} else {
				var myDisplayName = myEmailNode.getAttribute('displayName');
				ovl_cardbookMailContacts.findEvents(null, [myEmail], myEmail, "mailto:" + myEmail, myDisplayName);
			}
		},

		findAllEventsFromContact: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			var isEmailRegistered = ovl_cardbookMailContacts.isEmailRegistered(myEmail);
	
			if (isEmailRegistered) {
				var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
				ovl_cardbookMailContacts.findEvents([myCard], null, myCard.fn, "mailto:" + myEmail, myCard.fn);
			}
		},

		findEvents: function (aListOfSelectedCard, aListOfSelectedEmails, aDisplayName, aAttendeeId, aAttendeeName) {
			var listOfEmail = [];
			if (aListOfSelectedCard != null && aListOfSelectedCard !== undefined && aListOfSelectedCard != "") {
				for (var i = 0; i < aListOfSelectedCard.length; i++) {
					if (!aListOfSelectedCard[i].isAList) {
						for (var j = 0; j < aListOfSelectedCard[i].email.length; j++) {
							listOfEmail.push(aListOfSelectedCard[i].email[j][0][0].toLowerCase());
						}
					} else {
						listOfEmail.push(aListOfSelectedCard[i].fn.replace('"', '\"'));
					}
				}
			} else if (aListOfSelectedEmails != null && aListOfSelectedEmails !== undefined && aListOfSelectedEmails != "") {
				listOfEmail = JSON.parse(JSON.stringify(aListOfSelectedEmails));
			}
			var myArgs = {listOfEmail: listOfEmail, displayName: aDisplayName, attendeeId: aAttendeeId, attendeeName: aAttendeeName};
			var myWindow = window.openDialog("chrome://cardbook/content/lightning/wdw_cardbookEventContacts.xul", "", cardbookRepository.modalWindowParams, myArgs);
		},

		hideOldAddressbook: function (aExclusive) {
			if (aExclusive) {
				document.getElementById("addToAddressBookItem").setAttribute("hidden", true);
				document.getElementById("editContactItem").setAttribute("hidden", true);
				document.getElementById("viewContactItem").setAttribute("hidden", true);
				document.getElementById("editCardBookSeparator").setAttribute("hidden", true);
			} else {
				document.getElementById("editCardBookSeparator").setAttribute("hidden", false);
			}
		},
		
		hideOrShowLightningEntries: function (addon) {
			if (addon && addon.isActive) {
				document.getElementById("findEventsFromEmailMessenger").removeAttribute('hidden');
				if (ovl_cardbookMailContacts.knownContacts) {
					document.getElementById("findAllEventsFromContactMessenger").removeAttribute('hidden');
				}
			}
		},
		
		hideOrShowNewAddressbook: function (aValue) {
			ovl_cardbookMailContacts.knownContacts = aValue;
			if (aValue) {
				document.getElementById("addToCardBookMenu").setAttribute("hidden", true);
				document.getElementById("editInCardBookMenu").removeAttribute('hidden');
				document.getElementById("deleteInCardBookMenu").removeAttribute('hidden');
				document.getElementById("findAllEmailsFromContactMessenger").removeAttribute('hidden');
			} else {
				var count = 0;
				for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && (cardbookRepository.cardbookAccounts[i][6] != "SEARCH") && !cardbookRepository.cardbookAccounts[i][7]) {
						count++;
					}
				}
				if (count !== 0) {
					document.getElementById("addToCardBookMenu").removeAttribute('hidden');
				} else {
					document.getElementById("addToCardBookMenu").setAttribute("hidden", true);
				}
				document.getElementById("editInCardBookMenu").setAttribute("hidden", true);
				document.getElementById("deleteInCardBookMenu").setAttribute("hidden", true);
				document.getElementById("findAllEmailsFromContactMessenger").setAttribute("hidden", true);
			}

			document.getElementById("findEventsFromEmailMessenger").setAttribute("hidden", true);
			document.getElementById("findAllEventsFromContactMessenger").setAttribute("hidden", true);
			AddonManager.getAddonByID(cardbookRepository.LIGHTNING_ID, ovl_cardbookMailContacts.hideOrShowLightningEntries);
		}
	};
};

// for the contact menu popup
// setupEmailAddressPopup
(function() {
	// Keep a reference to the original function.
	var _original = setupEmailAddressPopup;
	
	// Override a function.
	setupEmailAddressPopup = function() {
		// Execute original function.
		var rv = _original.apply(null, arguments);
		
		// Execute some action afterwards.
		var loader = Services.scriptloader;
		loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
		var exclusive = cardbookPreferences.getBoolPref("extensions.cardbook.exclusive");
		ovl_cardbookMailContacts.hideOldAddressbook(exclusive);

		var myEmail = arguments[0].getAttribute('emailAddress');
		var isEmailRegistered = ovl_cardbookMailContacts.isEmailRegistered(myEmail);
		ovl_cardbookMailContacts.hideOrShowNewAddressbook(isEmailRegistered);

		if (isEmailRegistered) {
			var myCard = ovl_cardbookMailContacts.getCardFromEmail(myEmail);
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			document.getElementById("editInCardBookMenu").setAttribute("cardbookId", myCard.dirPrefId+"::"+myCard.uid);
			if (cardbookPreferences.getReadOnly(myCard.dirPrefId)) {
				document.getElementById('editInCardBookMenu').label=strBundle.GetStringFromName("viewInCardBookMenuLabel");
			} else {
				document.getElementById('editInCardBookMenu').label=strBundle.GetStringFromName("editInCardBookMenuLabel");
			}
			
			cardbookUtils.addCardToIMPPMenuSubMenu(myCard, 'IMPPCardsMenuPopup');
		} else {
			cardbookUtils.addCardToIMPPMenuSubMenu(null, 'IMPPCardsMenuPopup');
		}
		var emailAddressPlaceHolder = document.getElementById("emailAddressPlaceHolder");
		emailAddressPlaceHolder.setAttribute("label", MailServices.headerParser.makeMimeAddress(arguments[0].getAttribute("displayName"), arguments[0].getAttribute('emailAddress')));
		
		// return the original result
		return rv;
	};

})();

// for the yellow star
// UpdateEmailNodeDetails
(function() {
	// Keep a reference to the original function.
	var _original = UpdateEmailNodeDetails;

	// Override a function.
	UpdateEmailNodeDetails = function() {

		var rv = _original.apply(null, arguments);

		// Execute some action afterwards.
		var loader = Services.scriptloader;
		loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
		var exclusive = cardbookPreferences.getBoolPref("extensions.cardbook.exclusive");
		var showCondensedAddresses = cardbookPreferences.getBoolPref("mail.showCondensedAddresses");
		var myDisplayname = arguments[1].getAttribute("displayName");
		var myEmailAddress = arguments[1].getAttribute("emailAddress");
		var myCardBookResult = {};
		myCardBookResult = ovl_formatEmailCorrespondents.getCardBookDisplayNameFromEmail(myEmailAddress, myDisplayname);
		if (showCondensedAddresses) {
			if (exclusive) {
				arguments[1].setAttribute("hascard", myCardBookResult.found.toString());
				arguments[1].setAttribute("label", myCardBookResult.result);
			} else if (myCardBookResult.found) {
				arguments[1].setAttribute("hascard", myCardBookResult.found.toString());
				arguments[1].setAttribute("label", myCardBookResult.result);
			}
		} else {
			if (exclusive) {
				arguments[1].setAttribute("hascard", myCardBookResult.found.toString());
			} else if (myCardBookResult.found) {
				arguments[1].setAttribute("hascard", myCardBookResult.found.toString());
			}
		}
		return rv;
	};

})();

// nothing happens when click the yellow star
// 	
(function() {
	// Keep a reference to the original function.
	var _original = onClickEmailStar;
	
	// Override a function.
	onClickEmailStar = function() {
		return;
	};

})();

// for adding a contact from an email address
// fillMailContextMenu
(function() {
	// Keep a reference to the original function.
	var _original = fillMailContextMenu;

	// Override a function.
	fillMailContextMenu = function() {

		var rv = _original.apply(null, arguments);

		// Execute some action afterwards.
		gContextMenu.showItem("mailContext-addToCardBookMenu", gContextMenu.onMailtoLink && !gContextMenu.inThreadPane);
		if (gContextMenu.onMailtoLink && !gContextMenu.inThreadPane) {
			var loader = Services.scriptloader;
			loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
			var exclusive = cardbookPreferences.getBoolPref("extensions.cardbook.exclusive");
			if (exclusive) {
				gContextMenu.showItem("mailContext-addemail", false);
			}
		}
		
		return rv;
	};

})();
