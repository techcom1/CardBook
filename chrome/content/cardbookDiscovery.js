if ("undefined" == typeof(cardbookDiscovery)) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var cardbookDiscovery = {

		gDiscoveryDescription : "Discovery module",

		startDiscovery: function () {
			var allURLs = [];
			allURLs = cardbookPreferences.getURLs();
			
			if (allURLs.length == 0) {
				cardbookRepository.cardbookSyncMode = "NOSYNC";
			} else {
				for (var i = 0; i < allURLs.length; i++) {
					if (i == 0) {
						cardbookSynchronization.initDiscovery();
						cardbookUtils.formatStringForOutput("discoveryRunning", [cardbookDiscovery.gDiscoveryDescription]);
					}
					var dirPrefId = cardbookUtils.getUUID();
					cardbookSynchronization.initDiscoveryWithPrefId(dirPrefId);
					cardbookRepository.cardbookServerValidation[dirPrefId] = {length: 0, user: allURLs[i][1]};
					cardbookRepository.cardbookServerSyncRequest[dirPrefId]++;
					var connection = {connUser: allURLs[i][1], connPrefId: dirPrefId, connUrl: allURLs[i][0], connDescription: cardbookDiscovery.gDiscoveryDescription};
					var params = {aDirPrefIdType: "CARDDAV"};
					cardbookSynchronization.discoverPhase1(connection, "GETDISPLAYNAME", params);
					cardbookDiscovery.waitForDiscoveryFinished(dirPrefId);
				}
			}
		},

		stopDiscovery: function (aDirPrefId, aState) {
			cardbookSynchronization.finishMultipleOperations(aDirPrefId);
			var total = cardbookSynchronization.getRequest() + cardbookSynchronization.getTotal() + cardbookSynchronization.getResponse() + cardbookSynchronization.getDone();
			if (total === 0) {
				cardbookRepository.cardbookSyncMode = "NOSYNC";
				if (aState) {
					wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : cardbookRepository.cardbookServerValidation : ", cardbookRepository.cardbookServerValidation);
					// find all current CARDDAV accounts
					var myCurrentAccounts = [];
					myCurrentAccounts = JSON.parse(JSON.stringify(cardbookRepository.cardbookAccounts));
					function onlyCardDAV(element) {
						return (element[6] == "CARDDAV");
					}
					myCurrentAccounts = myCurrentAccounts.filter(onlyCardDAV);
					wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : myCurrentAccounts : ", myCurrentAccounts);
					
					// find all accounts that should be added and removed
					for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
						if (cardbookRepository.cardbookServerValidation[dirPrefId].length != 0) {
							for (var url in cardbookRepository.cardbookServerValidation[dirPrefId]) {
								if (url == "length" || url == "user") {
									continue;
								}
								for (var i = 0; i < myCurrentAccounts.length; i++) {
									var myCurrentUrl = cardbookPreferences.getUrl(myCurrentAccounts[i][4]);
									var myCurrentUser = cardbookPreferences.getUser(myCurrentAccounts[i][4]);
									if ((myCurrentUser == cardbookRepository.cardbookServerValidation[dirPrefId].user) && (myCurrentUrl == cardbookUtils.decodeURL(url))) {
										cardbookRepository.cardbookServerValidation[dirPrefId].length--;
										cardbookRepository.cardbookServerValidation[dirPrefId][url].forget = true;
										myCurrentAccounts[i][6] = "CARDDAVFOUND";
										break;
									}
								}
							}
							// add accounts
							if (cardbookRepository.cardbookServerValidation[dirPrefId].length > 0) {
								cardbookDiscovery.addAddressbook("discovery", dirPrefId);
							}
						}
					}
					// remove accounts
					var myCurrentAccountsNotFound = [];
					myCurrentAccountsNotFound = myCurrentAccounts.filter(onlyCardDAV);
					for (var i = 0; i < myCurrentAccountsNotFound.length; i++) {
						var myCurrentUrl = cardbookPreferences.getUrl(myCurrentAccountsNotFound[i][4]);
						var myCurrentUser = cardbookPreferences.getUser(myCurrentAccountsNotFound[i][4]);
						var myCurrentShortUrl = cardbookSynchronization.getShortUrl(myCurrentUrl);
						for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
							for (var url in cardbookRepository.cardbookServerValidation[dirPrefId]) {
								if (url == "length" || url == "user") {
									continue;
								}
								if ((myCurrentUser == cardbookRepository.cardbookServerValidation[dirPrefId].user) && (myCurrentShortUrl == cardbookSynchronization.getShortUrl(cardbookUtils.decodeURL(url)))) {
									cardbookDiscovery.removeAddressbook(myCurrentAccountsNotFound[i][4], "DISCOVERY");
									break;
								}
							}
						}
					}
				}
			}
		},

		addAddressbook: function (aAction, aDirPrefId) {
			if ((aDirPrefId != null && aDirPrefId !== undefined && aDirPrefId != "") || (cardbookRepository.cardbookSyncMode === "NOSYNC")) {
				cardbookRepository.cardbookSyncMode = "SYNC";
				var myArgs = {action: aAction, dirPrefId: aDirPrefId};
				var myWindow = window.openDialog("chrome://cardbook/content/addressbooksconfiguration/wdw_addressbooksAdd.xul", "",
												   // Workaround for Bug 1151440 - the HTML color picker won't work
												   // in linux when opened from modal dialog
												   (Services.appinfo.OS == 'Linux') ? "chrome,resizable,centerscreen" : "modal,chrome,resizable,centerscreen"
												   , myArgs);
			}
		},

		// no need to set the sync mode for removing deleted CARDDAV account
		removeAddressbook: function (aDirPrefId, aSource) {
			try {
				var myDirPrefIdName = cardbookPreferences.getName(aDirPrefId);
				var myDirPrefUrl = cardbookPreferences.getUrl(aDirPrefId);
				var myDirPrefIdType = cardbookPreferences.getType(aDirPrefId);
				
				var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
				var confirmTitle = strBundle.GetStringFromName("confirmTitle");
				var confirmMsg = strBundle.formatStringFromName("accountDeletionDiscoveryConfirmMessage", [myDirPrefIdName], 1);
				var returnFlag = false;
				returnFlag = Services.prompt.confirm(window, confirmTitle, confirmMsg);
				if (returnFlag) {
					cardbookRepository.removeAccountFromComplexSearch(aDirPrefId);
					cardbookRepository.removeAccountFromRepository(aDirPrefId);
					// cannot be launched from cardbookRepository
					cardbookIndexedDB.removeAccount(aDirPrefId, myDirPrefIdName);
					cardbookPreferences.delBranch(aDirPrefId);
					wdw_cardbook.loadCssRules();
					cardbookUtils.formatStringForOutput("addressbookClosed", [myDirPrefIdName]);
					wdw_cardbooklog.addActivity("addressbookClosed", [myDirPrefIdName], "deleteMail");
					cardbookUtils.notifyObservers("cardbook.ABRemovedDirect");
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookRepository.removeAddressbook error : " + e, "Error");
			}
		},

		waitForDiscoveryFinished: function (aDirPrefId) {
			cardbookRepository.lTimerSyncAll[aDirPrefId] = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			var lTimerSync = cardbookRepository.lTimerSyncAll[aDirPrefId];
			lTimerSync.initWithCallback({ notify: function(lTimerSync) {
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : cardbookRepository.cardbookServerDiscoveryRequest : ", cardbookRepository.cardbookServerDiscoveryRequest[aDirPrefId]);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : cardbookRepository.cardbookServerDiscoveryResponse : ", cardbookRepository.cardbookServerDiscoveryResponse[aDirPrefId]);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : cardbookRepository.cardbookServerDiscoveryError : ", cardbookRepository.cardbookServerDiscoveryError[aDirPrefId]);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : cardbookRepository.cardbookServerValidation : ", cardbookRepository.cardbookServerValidation[aDirPrefId]);
						if (cardbookRepository.cardbookServerDiscoveryError[aDirPrefId] >= 1) {
							cardbookDiscovery.stopDiscovery(aDirPrefId, false);
							lTimerSync.cancel();
						} else if (cardbookRepository.cardbookServerDiscoveryRequest[aDirPrefId] == cardbookRepository.cardbookServerDiscoveryResponse[aDirPrefId] && cardbookRepository.cardbookServerDiscoveryResponse[aDirPrefId] != 0) {
							cardbookDiscovery.stopDiscovery(aDirPrefId, true);
							lTimerSync.cancel();
						}
					}
					}, 1000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
		}

	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookSynchronization.js");
};
