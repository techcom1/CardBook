if ("undefined" == typeof(cardbookDiscovery)) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var cardbookDiscovery = {

		gDiscoveryDescription : "Discovery module",

		getAllURLsToDiscover: function (aDirPrefIdToExclude) {
			var sortedDiscoveryAccounts = [];
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (aDirPrefIdToExclude != null && aDirPrefIdToExclude !== undefined && aDirPrefIdToExclude != "") {
					if (cardbookRepository.cardbookAccounts[i][4] == aDirPrefIdToExclude) {
						continue;
					}
				}
				if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && cardbookRepository.cardbookAccounts[i][6] == "CARDDAV") {
					var myUrl = cardbookPreferences.getUrl(cardbookRepository.cardbookAccounts[i][4]);
					var myRootUrl = cardbookSynchronization.getRootUrl(myUrl);
					var myShortUrl = cardbookSynchronization.getShortUrl(myUrl);
					var myUser = cardbookPreferences.getUser(cardbookRepository.cardbookAccounts[i][4]);
					var found = false;
					for (var j = 0; j < sortedDiscoveryAccounts.length; j++) {
						if (sortedDiscoveryAccounts[j][1] == myUser + "::" + myShortUrl) {
							found = true;
							break;
						}
					}
					if (!found) {
						sortedDiscoveryAccounts.push([myUser + " - " + myRootUrl, myUser + "::" + myShortUrl]);
					}
				}
			}
			sortedDiscoveryAccounts = cardbookUtils.sortArrayByString(sortedDiscoveryAccounts,0,1);
			return sortedDiscoveryAccounts;
		},

		startDiscovery: function () {
			var allPrefsURLs = [];
			allPrefsURLs = cardbookPreferences.getDiscoveryAccounts();

			for (var i = 0; i < allPrefsURLs.length; i++) {
				var dirPrefId = cardbookUtils.getUUID();
				if (i == 0) {
					cardbookUtils.formatStringForOutput("discoveryRunning", [cardbookDiscovery.gDiscoveryDescription]);
				}
				cardbookSynchronization.initDiscovery(dirPrefId);
				cardbookSynchronization.initMultipleOperations(dirPrefId);
				cardbookRepository.cardbookServerValidation[dirPrefId] = {length: 0, user: allPrefsURLs[i][1]};
				cardbookRepository.cardbookServerSyncRequest[dirPrefId]++;
				var connection = {connUser: allPrefsURLs[i][1], connPrefId: dirPrefId, connUrl: allPrefsURLs[i][0], connDescription: cardbookDiscovery.gDiscoveryDescription};
				var params = {aDirPrefIdType: "CARDDAV"};
				cardbookSynchronization.discoverPhase1(connection, "GETDISPLAYNAME", params);
				cardbookDiscovery.waitForDiscoveryFinished(dirPrefId);
			}
		},

		stopDiscovery: function (aDirPrefId, aState) {
			cardbookSynchronization.finishMultipleOperations(aDirPrefId);
			if (aState) {
				var total = cardbookSynchronization.getRequest() + cardbookSynchronization.getTotal() + cardbookSynchronization.getResponse() + cardbookSynchronization.getDone();
				if (total === 0) {
					wdw_cardbooklog.updateStatusProgressInformationWithDebug1(cardbookDiscovery.gDiscoveryDescription + " : debug mode : cardbookRepository.cardbookServerValidation : ", cardbookRepository.cardbookServerValidation);
					var myAccountsToAdd = [];
					var myAccountsToRemove = [];
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
								myAccountsToAdd.push(cardbookUtils.fromValidationToArray(dirPrefId));
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
									myAccountsToRemove.push(myCurrentAccountsNotFound[i][4]);
									break;
								}
							}
						}
					}
	
					for (var i = 0; i < myAccountsToAdd.length; i++) {
						cardbookDiscovery.addAddressbook(myAccountsToAdd[i]);
					}
					for (var i = 0; i < myAccountsToRemove.length; i++) {
						cardbookDiscovery.removeAddressbook(myAccountsToRemove[i]);
					}
					for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
						cardbookSynchronization.stopDiscovery(dirPrefId);
					}
				}
			} else {
				cardbookSynchronization.stopDiscovery(aDirPrefId);
			}
		},

		addAddressbook: function (aAccountsToAdd) {
			// this function is luckily not always available
			// especially after having added an address book, a new discovery does not reask for adding 
			if (openDialog) {
				var myArgs = {action: "discovery", accountsToAdd: aAccountsToAdd};
				openDialog("chrome://cardbook/content/addressbooksconfiguration/wdw_addressbooksAdd.xul", "", cardbookRepository.windowParams, myArgs);
			}
		},

		removeAddressbook: function (aDirPrefId) {
			try {
				var myDirPrefIdName = cardbookPreferences.getName(aDirPrefId);
				var myDirPrefUrl = cardbookPreferences.getUrl(aDirPrefId);
				var myDirPrefIdType = cardbookPreferences.getType(aDirPrefId);
				
				var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
				var confirmTitle = strBundle.GetStringFromName("confirmTitle");
				var confirmMsg = strBundle.formatStringFromName("accountDeletionDiscoveryConfirmMessage", [myDirPrefIdName], 1);
				var returnFlag = false;
				returnFlag = Services.prompt.confirm(null, confirmTitle, confirmMsg);
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
