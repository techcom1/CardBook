if ("undefined" == typeof(ovl_collected)) {
	Components.utils.import("resource:///modules/jsmime.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var ovl_collected = {
		
		addCollectedContact: function (aIdentity, aEmailsCollections, aDisplayName, aEmail) {
			wdw_cardbooklog.updateStatusProgressInformationWithDebug2("debug mode : start of emails identitiy : " + aIdentity);
			wdw_cardbooklog.updateStatusProgressInformationWithDebug2("debug mode : start of emails collection : " + aEmailsCollections.toSource());
			if (!(aEmail != null && aEmail !== undefined && aEmail != "")) {
				return;
			} else if (aEmail.includes("{{") && aEmail.includes("}}")) {
				return;
			}
			if (aDisplayName != null && aDisplayName !== undefined && aDisplayName != "") {
				if (aDisplayName.includes("{{") && aDisplayName.includes("}}")) {
					return;
				}
			}
			if (!cardbookRepository.isEmailRegistered(aEmail, aIdentity)) {
				for (var i = 0; i < aEmailsCollections.length; i++) {
					var dirPrefId = aEmailsCollections[i][3];
					if (!cardbookPreferences.getReadOnly(dirPrefId)) {
						if (aEmailsCollections[i][0] == "true") {
							if ((aIdentity == aEmailsCollections[i][2]) || ("allMailAccounts" == aEmailsCollections[i][2])) {
								var dirPrefIdName = cardbookPreferences.getName(dirPrefId);
								wdw_cardbooklog.updateStatusProgressInformationWithDebug2(dirPrefIdName + " : debug mode : trying to collect contact " + aDisplayName + " (" + aEmail + ")");
								cardbookRepository.addCardFromDisplayAndEmail(dirPrefId, aDisplayName, aEmail, aEmailsCollections[i][4]);
							}
						}
					}
				}
			}
		},
	
		collectToCardBook: function () {
			var resultEmailsCollections = [];
			var allEmailsCollections = [];
			allEmailsCollections = cardbookPreferences.getAllEmailsCollections();
			for (var i = 0; i < allEmailsCollections.length; i++) {
				var resultArray = allEmailsCollections[i].split("::");
				resultEmailsCollections.push([resultArray[0], resultArray[1], resultArray[2], resultArray[3], resultArray[4]]);
			}
			
			if (resultEmailsCollections && resultEmailsCollections.length != 0) {
				var myFields = gMsgCompose.compFields;
				var listToCollect = ["replyTo", "to", "cc", "bcc", "followupTo"];
				for (var i = 0; i < listToCollect.length; i++) {
					if (myFields[listToCollect[i]]) {
						if (myFields[listToCollect[i]] != null && myFields[listToCollect[i]] !== undefined && myFields[listToCollect[i]] != "") {
							var addresses = {}, names = {}, fullAddresses = {};
							MailServices.headerParser.parseHeadersWithArray(myFields[listToCollect[i]], addresses, names, fullAddresses);
							for (var j = 0; j < addresses.value.length; j++) {
								ovl_collected.addCollectedContact(gMsgCompose.identity.key, resultEmailsCollections, names.value[j], addresses.value[j]);
								cardbookMailPopularity.updateMailPopularity(addresses.value[j]);
							}
						}
					}
				}
			} else {
				var myFields = gMsgCompose.compFields;
				var listToCollect = ["replyTo", "to", "cc", "bcc", "followupTo"];
				for (var i = 0; i < listToCollect.length; i++) {
					if (myFields[listToCollect[i]]) {
						if (myFields[listToCollect[i]] != null && myFields[listToCollect[i]] !== undefined && myFields[listToCollect[i]] != "") {
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
	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
};
// collect emails
window.addEventListener("compose-send-message", function(e) { ovl_collected.collectToCardBook(e); }, true);
