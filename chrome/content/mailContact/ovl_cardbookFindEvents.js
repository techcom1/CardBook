if ("undefined" == typeof(ovl_cardbookFindEvents)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("resource://gre/modules/AddonManager.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var ovl_cardbookFindEvents = {

		findEventsFromEmail: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			if (ovl_cardbookMailContacts) {
				var isEmailRegistered = cardbookRepository.isEmailRegistered(myEmail, ovl_cardbookMailContacts.getIdentityKey());
			} else {
				var isEmailRegistered = cardbookRepository.isEmailRegistered(myEmail);
			}
			if (isEmailRegistered) {
				var myCard = cardbookUtils.getCardFromEmail(myEmail);
				ovl_cardbookFindEvents.findEvents(null, [myEmail], myEmail, "mailto:" + myEmail, myCard.fn);
			} else {
				var myDisplayName = myEmailNode.getAttribute('displayName');
				ovl_cardbookFindEvents.findEvents(null, [myEmail], myEmail, "mailto:" + myEmail, myDisplayName);
			}
		},

		findAllEventsFromContact: function() {
			var myPopupNode = document.popupNode;
			var myEmailNode = findEmailNodeFromPopupNode(myPopupNode, 'emailAddressPopup');
			var myEmail = myEmailNode.getAttribute('emailAddress');
			if (ovl_cardbookMailContacts) {
				var isEmailRegistered = cardbookRepository.isEmailRegistered(myEmail, ovl_cardbookMailContacts.getIdentityKey());
			} else {
				var isEmailRegistered = cardbookRepository.isEmailRegistered(myEmail);
			}
	
			if (isEmailRegistered) {
				var myCard = cardbookUtils.getCardFromEmail(myEmail);
				ovl_cardbookFindEvents.findEvents([myCard], null, myCard.fn, "mailto:" + myEmail, myCard.fn);
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
		}
	};
};
