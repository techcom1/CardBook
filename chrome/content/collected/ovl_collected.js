if ("undefined" == typeof(ovl_collected)) {
	var ovl_collected = {
		
		collectToCardBook: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			Components.utils.import("resource:///modules/jsmime.jsm");
			var cardbookPrefService = new cardbookPreferenceService();
			var resultEmailsCollections = [];
			var allEmailsCollections = [];
			allEmailsCollections = cardbookPrefService.getAllEmailsCollections();
			for (var i = 0; i < allEmailsCollections.length; i++) {
				var resultArray = allEmailsCollections[i].split("::");
				resultEmailsCollections.push([resultArray[0], resultArray[1], resultArray[2], resultArray[3], resultArray[4]]);
			}
			wdw_cardbooklog.updateStatusProgressInformationWithDebug2("debug mode : start of emails identitiy : " + gMsgCompose.identity.key);
			wdw_cardbooklog.updateStatusProgressInformationWithDebug2("debug mode : start of emails collection : " + resultEmailsCollections.toSource());
			
			if (resultEmailsCollections && resultEmailsCollections.length != 0) {
				var myFields = gMsgCompose.compFields;
				var listToCollect = ["replyTo", "to", "cc", "fcc", "bcc", "followupTo"];
				for (var i = 0; i < listToCollect.length; i++) {
					if (myFields[listToCollect[i]]) {
						if (myFields[listToCollect[i]] != null && myFields[listToCollect[i]] !== undefined && myFields[listToCollect[i]] != "") {
							var addresses = {}, names = {}, fullAddresses = {};
							MailServices.headerParser.parseHeadersWithArray(myFields[listToCollect[i]], addresses, names, fullAddresses);
							for (var j = 0; j < addresses.value.length; j++) {
								if (!cardbookRepository.isEmailRegistered(addresses.value[j], gMsgCompose.identity.key)) {
									for (var k = 0; k < cardbookRepository.cardbookAccounts.length; k++) {
										if (cardbookRepository.cardbookAccounts[k][1] && cardbookRepository.cardbookAccounts[k][5] && cardbookRepository.cardbookAccounts[k][6] != "SEARCH") {
											for (var l = 0; l < resultEmailsCollections.length; l++) {
												var dirPrefId = resultEmailsCollections[l][3];
												if ((cardbookRepository.cardbookAccounts[k][4] == dirPrefId) && (resultEmailsCollections[l][0] == "true")) {
													if ((gMsgCompose.identity.key == resultEmailsCollections[l][2]) || ("allMailAccounts" == resultEmailsCollections[l][2])) {
														var dirPrefIdName = cardbookUtils.getPrefNameFromPrefId(dirPrefId);
														wdw_cardbooklog.updateStatusProgressInformationWithDebug2(dirPrefIdName + " : debug mode : trying to collect contact " + addresses.value[j]);
														cardbookRepository.addCardFromDisplayAndEmail(dirPrefId, names.value[j], addresses.value[j], resultEmailsCollections[l][4]);
													}
												}
											}
										}
									}
								}
								cardbookMailPopularity.updateMailPopularity(addresses.value[j]);
							}
						}
					}
				}
			} else {
				var myFields = gMsgCompose.compFields;
				var listToCollect = ["replyTo", "to", "cc", "fcc", "bcc", "followupTo"];
				for (var i = 0; i < listToCollect.length; i++) {
					if (myFields[listToCollect[i]]) {
						if (myFields[listToCollect[i]] != null && myFields[listToCollect[i]] !== undefined && myFields[listToCollect[i]] != "") {
							var emailsCollectionList = [];
							emailsCollectionList = emailsCollection.split(',');
							var addresses = {}, names = {}, fullAddresses = {};
							MailServices.headerParser.parseHeadersWithArray(myFields[listToCollect[i]], addresses, names, fullAddresses);
							for (var j = 0; j < addresses.value.length; j++) {
								cardbookMailPopularity.updateMailPopularity(addresses.value[j]);
							}
						}
					}
				}
			}
		}

	}
};

window.addEventListener("compose-send-message", function(e) { ovl_collected.collectToCardBook(e); }, true);
