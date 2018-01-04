if ("undefined" == typeof(cardbookListConversion)) {
	Components.utils.import("resource:///modules/jsmime.jsm");
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	function cardbookListConversion(aEmails, aIdentity) {
		this.emailResult = [];
		this.recursiveList = [];
		this._convert(aEmails, aIdentity);
	}
	
	cardbookListConversion.prototype = {
		_verifyRecursivity: function (aList) {
			for (var i = 0; i < this.recursiveList.length; i++) {
				if (this.recursiveList[i] == aList) {
					cardbookUtils.formatStringForOutput("errorInfiniteLoopRecursion", [this.recursiveList.toSource()], "Error");
					return false;
				}
			}
			this.recursiveList.push(aList);
			return true;
		},
		
		_getEmails: function (aCard, aOnlyEmail) {
			if (aCard.isAList) {
				var myList = aCard.fn;
				if (this._verifyRecursivity(myList)) {
					this._convert(MailServices.headerParser.makeMimeAddress(myList, myList));
				}
			} else {
				var listOfEmail = []
				listOfEmail = cardbookUtils.getMimeEmailsFromCards([aCard], aOnlyEmail).join(", ");
				if (listOfEmail != "") {
					this.emailResult.push(listOfEmail);
				}
			}
		},
		
		_convert: function (aEmails, aIdentity) {
			var memberCustom = cardbookPreferences.getStringPref("extensions.cardbook.memberCustom");
			var useOnlyEmail = cardbookPreferences.getBoolPref("extensions.cardbook.useOnlyEmail");
			var addresses = {}, names = {}, fullAddresses = {};
			MailServices.headerParser.parseHeadersWithArray(aEmails, addresses, names, fullAddresses);
			for (var i = 0; i < addresses.value.length; i++) {
				if (addresses.value[i].includes("@")) {
					if (useOnlyEmail) {
						// we are forced to collect here because after the display name is removed
						var resultEmailsCollections = [];
						var allEmailsCollections = [];
						allEmailsCollections = cardbookPreferences.getAllEmailsCollections();
						for (var j = 0; j < allEmailsCollections.length; j++) {
							var resultArray = allEmailsCollections[j].split("::");
							resultEmailsCollections.push([resultArray[0], resultArray[1], resultArray[2], resultArray[3], resultArray[4]]);
						}
						if (resultEmailsCollections && resultEmailsCollections.length != 0) {
							ovl_collected.addCollectedContact(aIdentity, resultEmailsCollections, names.value[i], addresses.value[i]);
						}
						
						this.emailResult.push(addresses.value[i]);
					} else {
						this.emailResult.push(MailServices.headerParser.makeMimeAddress(names.value[i], addresses.value[i]));
					}
				// for Mail Merge compatibility
				} else if (fullAddresses.value[i].includes("{{") && fullAddresses.value[i].includes("}}")) {
					this.emailResult.push(fullAddresses.value[i]);
				} else {
					var found = false;
					for (j in cardbookRepository.cardbookCards) {
						var myCard = cardbookRepository.cardbookCards[j];
						if (myCard.isAList && myCard.fn == names.value[i]) {
							found = true;
							this.recursiveList.push(names.value[i]);
							if (myCard.version == "4.0") {
								for (var k = 0; k < myCard.member.length; k++) {
									var uid = myCard.member[k].replace("urn:uuid:", "");
									if (cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+uid]) {
										var myTargetCard = cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+uid];
										this._getEmails(myTargetCard, useOnlyEmail);
									}
								}
							} else if (myCard.version == "3.0") {
								for (var k = 0; k < myCard.others.length; k++) {
									var localDelim1 = myCard.others[k].indexOf(":",0);
									if (localDelim1 >= 0) {
										var header = myCard.others[k].substr(0,localDelim1);
										var trailer = myCard.others[k].substr(localDelim1+1,myCard.others[k].length);
										if (header == memberCustom) {
											if (cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")]) {
												var myTargetCard = cardbookRepository.cardbookCards[myCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")];
												this._getEmails(myTargetCard, useOnlyEmail);
											}
										}
									}
								}
							}
							break;
						}
					}
					if (!found) {
						this.emailResult.push(fullAddresses.value[i]);
					}
				}
			}
		}
	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
};
				
if ("undefined" == typeof(ovl_list)) {
	var ovl_list = {
		expandRecipientsFromCardBook: function () {
			var myFields = window.gMsgCompose.compFields;
			var listToCollect = ["replyTo", "to", "cc", "bcc", "followupTo"];
			for (var i = 0; i < listToCollect.length; i++) {
				if (myFields[listToCollect[i]]) {
					if (myFields[listToCollect[i]] != null && myFields[listToCollect[i]] !== undefined && myFields[listToCollect[i]] != "") {
						var myConversion = new cardbookListConversion(myFields[listToCollect[i]], window.gMsgCompose.identity.key);
						myFields[listToCollect[i]] = cardbookRepository.arrayUnique(myConversion.emailResult).join(", ");
					}
				}
			}
		}
	};
};

// expandRecipients
(function() {
	// Keep a reference to the original function.
	var _original = expandRecipients;
	
	// Override a function.
	expandRecipients = function() {
		// Execute original function.
		var rv = _original.apply(null, arguments);
		
		// Execute some action afterwards.
		ovl_list.expandRecipientsFromCardBook();

		// return the original result
		return rv;
	};

})();

// updateSendLock
(function() {
	// Keep a reference to the original function.
	var _original = updateSendLock;
	
	// Override a function.
	updateSendLock = function() {
		// Execute original function.
		// var rv = _original.apply(null, arguments);
		
		// Execute some action afterwards.
		// if (!gSendLocked) {
		// 	let inputValue = awGetInputElement(row).value.trim();
		// 	ovl_list.mailListNameExistsInCardBook(inputValue.replace(/ *<.*>/, ""));
		// }
		//
		// return the original result
		gSendLocked = false;
		// return rv;
	};

})();

