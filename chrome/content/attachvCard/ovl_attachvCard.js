if ("undefined" == typeof(ovl_attachvCard)) {
	var ovl_attachvCard = {
		
		attachvCard: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			var cardbookPrefService = new cardbookPreferenceService();
			var selected = document.getElementById("msgIdentity").selectedItem;
			var key = selected.getAttribute("identitykey");
			var result = [];
			result = cardbookPrefService.getAllVCards();
			for (var i = 0; i < result.length; i++) {
				var resultArray = result[i].split("::");
				if (resultArray[0] == "true") {
					if (resultArray[1] == key || resultArray[1] == "allMailAccounts") {
						var myFilename = resultArray[4];
						if (cardbookRepository.cardbookCards[resultArray[2]+"::"+resultArray[3]]) {
							var myCard = cardbookRepository.cardbookCards[resultArray[2]+"::"+resultArray[3]];
							var attachment = Components.classes["@mozilla.org/messengercompose/attachment;1"].createInstance(Components.interfaces.nsIMsgAttachment);
							attachment.contentType = "text/vcard";
							attachment.name = myFilename;
							var myFile = cardbookUtils.getTempFile();
							myFile.append("cardbook-send-messages");
							myFile.append(myFilename);
							if (myFile.exists() && myFile.isFile()) {
								try {
									myFile.remove(true);
								} catch(e) {
									cardbookUtils.formatStringForOutput("errorAttachingFile", [myFile.path, e], "Error");
									return;
								}
							}
							cardbookSynchronization.writeContentToFile(myFile.path, cardbookUtils.getvCardForEmail(myCard), "UTF8");
							if (myFile.exists() && myFile.isFile()) {
								attachment.url = "file:///" + myFile.path;
								gMsgCompose.compFields.addAttachment(attachment);
							} else {
								cardbookUtils.formatStringForOutput("errorAttachingFile", [myFile.path], "Error");
							}
						}
					}
				}
			}
		}
	};

	var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
};

window.addEventListener("compose-send-message", function(e) { ovl_attachvCard.attachvCard(e); }, true);
