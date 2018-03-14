if ("undefined" == typeof(wdw_migrate)) {
	Components.utils.import("resource:///modules/mailServices.js");
	Components.utils.import("resource://gre/modules/Services.jsm");

	var wdw_migrate = {
		
		customMap : [ ["1", false], ["2", false], ["3", false], ["4", false] ],
		allLists : {},

		writeCustomToPreference: function () {
			var myType = 'pers';
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			var customLabel = strBundle.GetStringFromName("customLabel");
			result = cardbookRepository.customFields[myType];
			var myCount = result.length;
			for (var i = 0; i < wdw_migrate.customMap.length; i++) {
				if (wdw_migrate.customMap[i][1]) {
					var found = false
					var myCode = "X-CUSTOM" + wdw_migrate.customMap[i][0];
					for (var j = 0; j < result.length; j++) {
						if (result[j][0] == myCode) {
							found = true;
							break;
						}
					}
					if (!found) {
						cardbookPreferences.setCustomFields(myType, myCount, myCode + ":" + customLabel + wdw_migrate.customMap[i][0]);
						myCount++;
					}
				}
			}
			cardbookRepository.loadCustoms();
		},

		translateStandardCards: function (aDirPrefIdTarget, aDirPrefIdTargetName, aABCard, aVersion, aDateFormat, aMode) {
			try {
				var myCard = new cardbookCardParser();
				myCard.dirPrefId = aDirPrefIdTarget;
				cardbookUtils.setCardUUID(myCard);
				myCard.version = aVersion;
				var myMap = [ ["FirstName", "firstname"], ["LastName", "lastname"], ["DisplayName", "fn"], ["NickName", "nickname"], ["JobTitle", "title"], ["Notes", "note"] ];
				for (var i = 0; i < myMap.length; i++) {
					var myMapData = aABCard.getProperty(myMap[i][0],"");
					myCard[myMap[i][1]] = myMapData;
				}
				for (var i = 0; i < wdw_migrate.customMap.length; i++) {
					var myMapData = aABCard.getProperty("Custom" + wdw_migrate.customMap[i][0],"");
					if (myMapData != "") {
						myCard.others.push("X-CUSTOM" + wdw_migrate.customMap[i][0] + ":" + myMapData);
						if (!wdw_migrate.customMap[i][1]) {
							wdw_migrate.customMap[i][1] = true;
						}
					}
				}
				var myDep = aABCard.getProperty("Department","");
				var myOrg = aABCard.getProperty("Company","");
				if (myDep != "") {
					if (myOrg != "") {
						myCard.org = myDep + " - " + myOrg;
					} else {
						myCard.org = myDep;
					}
				} else {
					if (myOrg != "") {
						myCard.org = myOrg;
					}
				}
				
				var myListMap = [ ["PrimaryEmail", ["TYPE=PREF" , "TYPE=HOME"] , "email"], ["SecondEmail", ["TYPE=HOME"], "email"], ["WorkPhone", ["TYPE=WORK"], "tel"], ["HomePhone", ["TYPE=HOME"], "tel"],
								  ["FaxNumber", ["TYPE=FAX"], "tel"], ["PagerNumber", ["TYPE=PAGER"], "tel"], ["CellularNumber", ["TYPE=CELL"], "tel"], ["WebPage1", ["TYPE=WORK"], "url"],
								  ["WebPage2", ["TYPE=HOME"], "url"] ];
				for (var i = 0; i < myListMap.length; i++) {
					var myMapData = aABCard.getProperty(myListMap[i][0],"");
					if (myMapData != "") {
						myCard[myListMap[i][2]].push([[myMapData], myListMap[i][1], "", []]);
					}
				}

				var myAdrMap = [ [ [ ["HomeAddress", "HomeAddress2"], "HomeCity", "HomeState", "HomeZipCode", "HomeCountry"], ["TYPE=HOME"] ],
								 [ [ ["WorkAddress", "WorkAddress2"], "WorkCity", "WorkState", "WorkZipCode", "WorkCountry"], ["TYPE=WORK"] ] ];
				for (var i = 0; i < myAdrMap.length; i++) {
					var lString = "";
					var myAdr = ["", ""];
					for (var j = 0; j < myAdrMap[i][0][0].length; j++) {
						var myProp = aABCard.getProperty(myAdrMap[i][0][0][j],"");
						if (myProp != "") {
							if (lString != "") {
								lString = lString + "\n" + myProp;
							} else {
								lString = myProp;
							}
						}
					}
					myAdr.push(lString);
					for (var j = 1; j < myAdrMap[i][0].length; j++) {
						myAdr.push(aABCard.getProperty(myAdrMap[i][0][j],""));
					}
					if (cardbookUtils.notNull(myAdr, "") != "") {
						myCard.adr.push([myAdr, myAdrMap[i][1], "", []]);
					}
				}
				
				var day = aABCard.getProperty("BirthDay", "");
				var month = aABCard.getProperty("BirthMonth", "");
				var year = aABCard.getProperty("BirthYear", "");
				if (day != "" || month != "" || year != "" ) {
					myCard.bday = cardbookDates.convertDateStringToDateString(day, month, year, aDateFormat)
				}

				var photoURI = aABCard.getProperty("PhotoURI", "");
				var photoType = aABCard.getProperty("PhotoType", "");
				if (photoType == "file") {
					var myFileURI = Services.io.newURI(photoURI, null, null);
					myCard.photo.extension = cardbookUtils.getFileExtension(photoURI);
					myCard.photo.value = cardbookSynchronization.getFileBinary(myFileURI);
				} else if (photoType == "web") {
					myCard.photo.extension = cardbookUtils.getFileExtension(photoURI);
					myCard.photo.URI = photoURI;
				}
				wdw_migrate.getNotNullFn(myCard, aABCard);
				
				cardbookUtils.setCalculatedFields(myCard);
				
				// for nested lists within the same address book, the standard address book creates
				// one unusefull card for the nested lists
				if (myCard.emails == "" || myCard.emails.join("").includes("@")) {
					cardbookRepository.addCardToRepository(myCard, aMode);
					cardbookUtils.formatStringForOutput("cardCreatedOK", [aDirPrefIdTargetName, myCard.fn]);
					wdw_cardbooklog.addActivity("cardCreatedOK", [aDirPrefIdTargetName, myCard.fn], "addItem");
	
					var email = aABCard.getProperty("PrimaryEmail", "");
					var emailValue = aABCard.getProperty("PopularityIndex", "0");
					if (email != "" && emailValue != "0" && emailValue != " ") {
						cardbookRepository.cardbookMailPopularityIndex[email] = emailValue;
					}
				}
							
				cardbookRepository.cardbookServerSyncDone[aDirPrefIdTarget]++;
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_migrate.translateStandardCards error : " + e, "Error");
				cardbookRepository.cardbookServerSyncError[aDirPrefIdTarget]++;
				cardbookRepository.cardbookServerSyncDone[aDirPrefIdTarget]++;
			}
		},

		getSolvedListNumber: function () {
			var result = 0;
			for (i in wdw_migrate.allLists) {
				if (wdw_migrate.allLists[i].solved) {
					result++;
				}
			}
			return result;
		},

		mayTheListBeResolved: function (aABList) {
			try {
				for (var i = 0; i < aABList.addressLists.length; i++) {
					var myABCard = aABList.addressLists.queryElementAt(i, Components.interfaces.nsIAbCard);
					var myEmail = myABCard.primaryEmail;
					var myName = myABCard.getProperty("DisplayName","");
					if ((myName == myEmail) && wdw_migrate.allLists[myName]) {
						if (!wdw_migrate.allLists[myName].solved) {
							return false;
						}
					}
				}
				return true
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_migrate.mayTheListBeResolved error : " + e, "Error");
				return false;
			}
		},

		translateStandardLists: function (aDirPrefIdTarget, aDirPrefIdTargetName, aVersion, aMode) {
			try {
				var myBeforeNumber = wdw_migrate.getSolvedListNumber();
				var myAfterNumber = 0;
				var myCondition = true;
				// loop until all lists may be solved
				while (myCondition) {
					for (listName in wdw_migrate.allLists) {
						if (!wdw_migrate.allLists[listName].solved && wdw_migrate.mayTheListBeResolved(wdw_migrate.allLists[listName].list)) {
							var myList = wdw_migrate.allLists[listName].list;
							var myCard = new cardbookCardParser();
							myCard.dirPrefId = aDirPrefIdTarget;
							cardbookUtils.setCardUUID(myCard);
							myCard.version = aVersion;
							var myMap = [ ["dirName", "fn"], ["listNickName", "nickname"], ["description", "note"] ];
							for (var i = 0; i < myMap.length; i++) {
								myCard[myMap[i][1]] = myList[myMap[i][0]];
							}
							var myTargetMembers = [];
							for (var i = 0; i < myList.addressLists.length; i++) {
								var myABCard = myList.addressLists.queryElementAt(i, Components.interfaces.nsIAbCard);
								var myEmail = myABCard.primaryEmail;
								var myLowerEmail = myEmail.toLowerCase();
								var myName = myABCard.getProperty("DisplayName","");
								try {
									// within a standard list all members are simple cards… weird…
									if ((myName == myEmail) && wdw_migrate.allLists[myName] && wdw_migrate.allLists[myName].solved) {
										myTargetMembers.push(["urn:uuid:" + wdw_migrate.allLists[myName].uid, myName]);
									} else if (cardbookRepository.cardbookCardEmails[aDirPrefIdTarget][myLowerEmail]) {
										var myTargetCard = cardbookRepository.cardbookCardEmails[aDirPrefIdTarget][myLowerEmail][0];
										myTargetMembers.push(["urn:uuid:" + myTargetCard.uid, myTargetCard.fn]);
									}
								}
								catch (e) {}
							}

							cardbookUtils.parseLists(myCard, myTargetMembers, "group");
							cardbookUtils.setCalculatedFields(myCard);
							
							cardbookRepository.addCardToRepository(myCard, aMode);
							cardbookUtils.formatStringForOutput("cardCreatedOK", [aDirPrefIdTargetName, myCard.fn]);
							wdw_cardbooklog.addActivity("cardCreatedOK", [aDirPrefIdTargetName, myCard.fn], "addItem");
							cardbookRepository.cardbookServerSyncDone[aDirPrefIdTarget]++;

							wdw_migrate.allLists[listName].solved = true;
							wdw_migrate.allLists[listName].uid = myCard.uid;
						}
					}
					myAfterNumber = wdw_migrate.getSolvedListNumber();
					myCondition = (myBeforeNumber != myAfterNumber);
					myBeforeNumber = myAfterNumber;
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_migrate.translateStandardLists error : " + e, "Error");
				cardbookRepository.cardbookServerSyncError[aDirPrefIdTarget]++;
				cardbookRepository.cardbookServerSyncDone[aDirPrefIdTarget]++;
			}
		},

		getNotNullFn: function (aCard, aABCard) {
			try {
				if (aCard.fn != "") {
					return;
				}
				if (aCard.org != "") {
					aCard.fn = aCard.org;
					return;
				}
				if (aCard.lastname != "") {
					aCard.fn = aCard.lastname;
					return;
				}
				if (aCard.firstname != "") {
					aCard.fn = aCard.firstname;
					return;
				}
				var myEmail = aABCard.getProperty("PrimaryEmail", "");
				if (myEmail != "") {
					var myTmpArray = myEmail.split("@");
					aCard.fn = myTmpArray[0].replace(/\./g, " ");
					return;
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_migrate.getNotNullFn error : " + e, "Error");
			}
		},

		importCards: function (aDirPrefIdSource, aDirPrefIdTarget, aDirPrefIdTargetName, aVersion, aDateFormat, aMode) {
			var contactManager = MailServices.ab;
			var contacts = contactManager.directories;
			while ( contacts.hasMoreElements() ) {
				var contact = contacts.getNext().QueryInterface(Components.interfaces.nsIAbDirectory);
				if (contact.dirPrefId == aDirPrefIdSource) {
					var abCardsEnumerator = contact.childCards;
					while (abCardsEnumerator.hasMoreElements()) {
						var myABCard = abCardsEnumerator.getNext();
						myABCard = myABCard.QueryInterface(Components.interfaces.nsIAbCard);
						if (!myABCard.isMailList) {
							cardbookRepository.cardbookServerSyncTotal[aDirPrefIdTarget]++;
							Services.tm.currentThread.dispatch({ run: function() {
								wdw_migrate.translateStandardCards(aDirPrefIdTarget, aDirPrefIdTargetName, myABCard, aVersion, aDateFormat, aMode);
							}}, Components.interfaces.nsIEventTarget.DISPATCH_SYNC);
						}
					}
					var abCardsEnumerator = contact.childCards;
					while (abCardsEnumerator.hasMoreElements()) {
						var myABCard = abCardsEnumerator.getNext();
						myABCard = myABCard.QueryInterface(Components.interfaces.nsIAbCard);
						if (myABCard.isMailList) {
							var myABList = contactManager.getDirectory(myABCard.mailListURI);
							wdw_migrate.allLists[myABList.dirName] = {};
							wdw_migrate.allLists[myABList.dirName].solved = false;
							wdw_migrate.allLists[myABList.dirName].list = myABList;
							cardbookRepository.cardbookServerSyncTotal[aDirPrefIdTarget]++;
						}
					}
					wdw_migrate.translateStandardLists(aDirPrefIdTarget, aDirPrefIdTargetName, aVersion, aMode);
					break;
				}
			}
			cardbookMailPopularity.writeMailPopularity();
			wdw_migrate.writeCustomToPreference();
			cardbookRepository.cardbookDirResponse[aDirPrefIdTarget]++;
		}
		
	};

};
