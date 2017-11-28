if ("undefined" == typeof(wdw_addressbooksAdd)) {
	Components.utils.import("resource:///modules/mailServices.js");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var wdw_addressbooksAdd = {

		gType : "",
		gTypeFile : "",
		gRunningDirPrefId : "",
		gFile : {},
		gCardDAVURLs : [],
		gFinishParams : [],
		gValidateURL : false,
		gValidateDescription : "Validation module",
		gStandardAddressbooks : [],
		gSearchDefinition : {},
		
		lTimerRefreshTokenAll : {},
		lTimerDiscoveryAll : {},
		
		initSearchDefinition: function () {
			if (cardbookRepository.cardbookComplexSearch[window.arguments[0].dirPrefId]) {
				wdw_addressbooksAdd.gSearchDefinition['searchAB'] = cardbookRepository.cardbookComplexSearch[window.arguments[0].dirPrefId].searchAB;
				wdw_addressbooksAdd.gSearchDefinition['matchAll'] = cardbookRepository.cardbookComplexSearch[window.arguments[0].dirPrefId].matchAll;
				wdw_addressbooksAdd.gSearchDefinition['rules'] = JSON.parse(JSON.stringify(cardbookRepository.cardbookComplexSearch[window.arguments[0].dirPrefId].rules));
			} else {
				wdw_addressbooksAdd.gSearchDefinition['searchAB'] = true;
				wdw_addressbooksAdd.gSearchDefinition['matchAll'] = 'and';
				wdw_addressbooksAdd.gSearchDefinition['rules'] = [["","","",""]];
			}
		},

		initDiscovery: function () {
			wdw_addressbooksAdd.gType = "CARDDAV";
		},

		loadWizard: function () {
			if (window.arguments[0].action == "first") {
				wdw_addressbooksAdd.gType = "STANDARD";
				wdw_addressbooksAdd.loadStandardAddressBooks();
				document.getElementById('addressbook-wizard').goTo("welcomePage");
			} else if (window.arguments[0].action == "search") {
				wdw_addressbooksAdd.initSearchDefinition();
				document.getElementById('addressbook-wizard').goTo("searchPage");
			} else if (window.arguments[0].action == "discovery") {
				wdw_addressbooksAdd.initDiscovery();
				if (cardbookRepository.cardbookServerValidation[window.arguments[0].dirPrefId].length == 1) {
					document.getElementById('addressbook-wizard').goTo("namePage");
				} else {
					document.getElementById('addressbook-wizard').goTo("namesPage");
				}
			} else {
				document.getElementById('addressbook-wizard').goTo("initialPage");
			}
		},

		loadStandardAddressBooks: function () {
			wdw_addressbooksAdd.gStandardAddressbooks = [];
			var contactManager = MailServices.ab;
			var contacts = contactManager.directories;
			while ( contacts.hasMoreElements() ) {
				var contact = contacts.getNext().QueryInterface(Components.interfaces.nsIAbDirectory);
				if (contact.dirPrefId == "ldap_2.servers.history" && window.arguments[0].action == "first") {
					wdw_addressbooksAdd.gStandardAddressbooks.push([contact.dirPrefId, contact.dirName, true]);
				} else {
					wdw_addressbooksAdd.gStandardAddressbooks.push([contact.dirPrefId, contact.dirName, false]);
				}
			}
		},

		checkRequired: function () {
			var canAdvance = true;
			var curPage = document.getElementById('addressbook-wizard').currentPage;
			if (curPage) {
				let eList = curPage.getElementsByAttribute('required', 'true');
				for (let i = 0; i < eList.length && canAdvance; ++i) {
					canAdvance = (eList[i].value != "");
				}
				document.getElementById('addressbook-wizard').canAdvance = canAdvance;
			}
		},

		checkUrlLinesRequired: function () {
			var myArray = [];
			for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
				if (window.arguments[0].action == "discovery" && window.arguments[0].dirPrefId != dirPrefId) {
					continue;
				}
				for (var url in cardbookRepository.cardbookServerValidation[dirPrefId]) {
					if (url == "length" || url == "user") {
						continue;
					}
					if (cardbookRepository.cardbookServerValidation[dirPrefId][url].forget) {
						continue;
					}
					myArray.push([cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName]);
				}
			}
			wdw_addressbooksAdd.checkLinesRequired(myArray);
		},

		checkStandardLinesRequired: function () {
			wdw_addressbooksAdd.checkLinesRequired(wdw_addressbooksAdd.gStandardAddressbooks);
		},

		checkLinesRequired: function (aArray) {
			var canAdvance = true;
			var oneChecked = false;
			for (var i = 0; i < aArray.length; i++) {
				if (document.getElementById('namesCheckbox' + aArray[i][0])) {
					var aCheckbox = document.getElementById('namesCheckbox' + aArray[i][0]);
					var aAddressbookName = document.getElementById('namesTextbox' + aArray[i][0]);
					if (aCheckbox.checked) {
						oneChecked = true;
						 if (aAddressbookName.value == "") {
						 	 canAdvance = false;
						 	 break;
						 }
					}
				} else {
					break;
				}
			}
			document.getElementById('addressbook-wizard').canAdvance = (canAdvance && oneChecked);
		},

		initialAdvance: function () {
			var type = document.getElementById('addressbookType').selectedItem.value;
			var page = document.getElementsByAttribute('pageid', 'initialPage')[0];
			if (type == 'local') {
				page.next = 'localPage';
			} else if (type == 'remote') {
				page.next = 'remotePage';
			} else if (type == 'standard') {
				wdw_addressbooksAdd.gType = "STANDARD";
				wdw_addressbooksAdd.loadStandardAddressBooks();
				page.next = 'namesPage';
			} else if (type == 'search') {
				wdw_addressbooksAdd.initSearchDefinition();
				page.next = 'searchPage';
			}
		},

		localPageTypeSelect: function () {
			document.getElementById('localPageURI').value = "";
			var type = document.getElementById('localPageType').selectedItem.value;
			if (type == "createDB") {
				document.getElementById('localPageURI').setAttribute('required', 'false');
				document.getElementById('localPageURILabel').setAttribute('disabled', 'true');
				document.getElementById('localPageURI').setAttribute('disabled', 'true');
				document.getElementById('localPageURIButton').setAttribute('disabled', 'true');
			} else {
				document.getElementById('localPageURI').setAttribute('required', 'true');
				document.getElementById('localPageURILabel').setAttribute('disabled', 'false');
				document.getElementById('localPageURI').setAttribute('disabled', 'false');
				document.getElementById('localPageURIButton').setAttribute('disabled', 'false');
			}
			wdw_addressbooksAdd.checkRequired();
		},

		localPageTypeAdvance: function () {
			var type = document.getElementById('localPageType').selectedItem.value;
			switch(type) {
				case "createDB":
					wdw_addressbooksAdd.gType = "LOCALDB";
					break;
				case "createDirectory":
					wdw_addressbooksAdd.gType = "DIRECTORY";
					wdw_addressbooksAdd.gTypeFile = "CREATEDIRECTORY";
					break;
				case "createFile":
					wdw_addressbooksAdd.gType = "FILE";
					wdw_addressbooksAdd.gTypeFile = "CREATEFILE";
					break;
				case "openDirectory":
					wdw_addressbooksAdd.gType = "DIRECTORY";
					wdw_addressbooksAdd.gTypeFile = "OPENDIRECTORY";
					break;
				case "openFile":
					wdw_addressbooksAdd.gType = "FILE";
					wdw_addressbooksAdd.gTypeFile = "OPENFILE";
					break;
			}
			var page = document.getElementsByAttribute('pageid', 'localPage')[0];
			page.next = 'namePage';
		},

		searchFile: function () {
			cardbookNotifications.setNotification("localPageURINotifications", "OK");
			var type = document.getElementById('localPageType').selectedItem.value;
			switch(type) {
				case "createDirectory":
				case "openDirectory":
				case "standard":
					cardbookUtils.callDirPicker("dirChooseTitle", wdw_addressbooksAdd.checkFile);
					break;
				case "createFile":
					cardbookUtils.callFilePicker("fileCreationTitle", "SAVE", "VCF", "", wdw_addressbooksAdd.checkFile);
					break;
				case "openFile":
					cardbookUtils.callFilePicker("fileSelectionTitle", "OPEN", "VCF", "", wdw_addressbooksAdd.checkFile);
					break;
			}
		},

		checkFile: function (aFile) {
			var myTextbox = document.getElementById('localPageURI');
			var type = document.getElementById('localPageType').selectedItem.value;
			if (aFile != null && aFile !== undefined && aFile != "") {
				if (type == 'openFile' || type == 'createFile') {
					if (cardbookUtils.isFileAlreadyOpen(aFile.path)) {
						cardbookNotifications.setNotification("localPageURINotifications", "fileAlreadyOpen", aFile.path);
					} else {
						myTextbox.value = aFile.path;
						wdw_addressbooksAdd.gFile = aFile;
					}
				} else {
					if (cardbookUtils.isDirectoryAlreadyOpen(aFile.path)) {
						cardbookNotifications.setNotification("localPageURINotifications", "directoryAlreadyOpen", aFile.path);
					} else {
						myTextbox.value = aFile.path;
						wdw_addressbooksAdd.gFile = aFile;
					}
				}
			}
			wdw_addressbooksAdd.checkRequired();
		},

		checklocationNetwork: function () {
			var canValidate = true;
			var curPage = document.getElementById('addressbook-wizard').currentPage;
			if (curPage) {
				if (wdw_addressbooksAdd.gValidateURL) {
					document.getElementById('addressbook-wizard').canAdvance = wdw_addressbooksAdd.gValidateURL;
					document.getElementById('validateButton').disabled = !wdw_addressbooksAdd.gValidateURL;
				} else {
					document.getElementById('addressbook-wizard').canAdvance = wdw_addressbooksAdd.gValidateURL;
					let eList = curPage.getElementsByAttribute('required', 'true');
					for (let i = 0; i < eList.length && canValidate; ++i) {
						canValidate = (eList[i].value != "");
					}
					document.getElementById('validateButton').disabled = !canValidate;
				}
			}
		},

		remotePageTypeSelect: function () {
			wdw_addressbooksAdd.gValidateURL = false;
			document.getElementById('remotePageURI').value = "";
			document.getElementById('remotePageUsername').value = "";
			document.getElementById('remotePagePassword').value = "";
			
			var type = document.getElementById('remotePageType').selectedItem.value;
			if (type == 'GOOGLE') {
				document.getElementById('remotePageUriLabel').disabled=true;
				document.getElementById('remotePageURI').disabled=true;
				document.getElementById('remotePageURI').setAttribute('required', 'false');
				document.getElementById('remotePagePasswordLabel').disabled=true;
				document.getElementById('remotePagePassword').disabled=true;
				document.getElementById('remotePagePassword').setAttribute('required', 'false');
				document.getElementById('passwordCheckBox').disabled=true;
			} else if (type == 'APPLE') {
				document.getElementById('remotePageUriLabel').disabled=true;
				document.getElementById('remotePageURI').disabled=true;
				document.getElementById('remotePageURI').setAttribute('required', 'false');
				document.getElementById('remotePagePasswordLabel').disabled=false;
				document.getElementById('remotePagePassword').disabled=false;
				document.getElementById('remotePagePassword').setAttribute('required', 'true');
				document.getElementById('passwordCheckBox').disabled=false;
			} else {
				document.getElementById('remotePageUriLabel').disabled=false;
				document.getElementById('remotePageURI').disabled=false;
				document.getElementById('remotePageURI').setAttribute('required', 'true');
				document.getElementById('remotePagePasswordLabel').disabled=false;
				document.getElementById('remotePagePassword').disabled=false;
				document.getElementById('remotePagePassword').setAttribute('required', 'true');
				document.getElementById('passwordCheckBox').disabled=false;
			}
			wdw_addressbooksAdd.checklocationNetwork();
			cardbookNotifications.setNotification("resultNotifications", "OK");
		},

		remotePageTextboxInput: function () {
			wdw_addressbooksAdd.gValidateURL = false;
			wdw_addressbooksAdd.checklocationNetwork();
			cardbookNotifications.setNotification("resultNotifications", "OK");
		},

		remotePageTypeAdvance: function () {
			wdw_addressbooksAdd.gType = document.getElementById('remotePageType').selectedItem.value;
		},

		constructComplexSearch: function () {
			cardbookElementTools.loadAddressBooks("addressbookMenupopup", "addressbookMenulist", wdw_addressbooksAdd.gSearchDefinition.searchAB, true, true, true, false);
			cardbookComplexSearch.loadMatchAll(wdw_addressbooksAdd.gSearchDefinition.matchAll);
			cardbookComplexSearch.constructDynamicRows("searchTerms", wdw_addressbooksAdd.gSearchDefinition.rules, "3.0");
			document.getElementById('searchTerms_0_valueBox').focus();
		},

		checkSearch: function () {
			wdw_addressbooksAdd.constructComplexSearch();
			document.getElementById('addressbook-wizard').canAdvance = false;
			function checkTerms() {
				if (cardbookComplexSearch.getSearch() != "") {
					document.getElementById('addressbook-wizard').canAdvance = true;
				} else {
					document.getElementById('addressbook-wizard').canAdvance = false;
				}
			};
			checkTerms();
			document.getElementById('searchTerms').addEventListener("input", checkTerms, false);
			document.getElementById('searchTerms').addEventListener("command", checkTerms, false);
			document.getElementById('searchTerms').addEventListener("click", checkTerms, false);
		},

		searchPageAdvance: function () {
			wdw_addressbooksAdd.gType = "SEARCH";
			wdw_addressbooksAdd.gTypeFile = cardbookComplexSearch.getSearch();

			var relative = wdw_addressbooksAdd.gTypeFile.match("^searchAB:([^:]*):searchAll:([^:]*)(.*)");
			wdw_addressbooksAdd.gSearchDefinition.searchAB = relative[1];
			if (relative[2] == "true") {
				wdw_addressbooksAdd.gSearchDefinition.matchAll = true;
			} else {
				wdw_addressbooksAdd.gSearchDefinition.matchAll = false;
			}
			var tmpRuleArray = relative[3].split(/:case:/);
			wdw_addressbooksAdd.gSearchDefinition.rules = [];
			for (var i = 1; i < tmpRuleArray.length; i++) {
				var relative = tmpRuleArray[i].match("([^:]*):field:([^:]*):term:([^:]*):value:([^:]*)");
				wdw_addressbooksAdd.gSearchDefinition.rules.push([relative[1], relative[2], relative[3], relative[4]]);
			}
		},

		showPassword: function () {
			var passwordType = document.getElementById('remotePagePassword').type;
			if (passwordType != "password") {
				document.getElementById('remotePagePassword').type = "password";
			} else {
				document.getElementById('remotePagePassword').type = "";
			}
		},

		vCardHidingMenu: function (aMenu) {
			var myId = aMenu.id.replace('vCardVersionPageName', '');
			if (document.getElementById(aMenu.id).selectedItem.value == "3.0") {
				cardbookElementTools.loadDateFormats('dateFormatMenuPopup' + myId, 'dateFormatMenuList' + myId, "YYYY-MM-DD");
			} else {
				cardbookElementTools.loadDateFormats('dateFormatMenuPopup' + myId, 'dateFormatMenuList' + myId, "YYYYMMDD");
			}
		},

		validateURL: function () {
			document.getElementById('addressbook-wizard').canAdvance = false;
			document.getElementById('remotePageURI').value = cardbookUtils.decodeURL(document.getElementById('remotePageURI').value.trim());
			document.getElementById('validateButton').disabled = true;

			var type = document.getElementById('remotePageType').selectedItem.value;
			var username = document.getElementById('remotePageUsername').value;
			var password = document.getElementById('remotePagePassword').value;
			if (type == 'GOOGLE') {
				var url = cardbookRepository.cardbookgdata.GOOGLE_API;
			} else if (type == 'APPLE') {
				var url = cardbookRepository.APPLE_API;
				wdw_addressbooksAdd.gCardDAVURLs.push([cardbookSynchronization.getSlashedUrl(url), true]); // [url, discovery]
			} else {
				var url = document.getElementById('remotePageURI').value;
				if (cardbookSynchronization.getRootUrl(url) == "") {
					cardbookNotifications.setNotification("resultNotifications", "ValidatingURLFailedLabel");
					return;
				}
				wdw_addressbooksAdd.gCardDAVURLs.push([url, false]); // [url, discovery]
				wdw_addressbooksAdd.gCardDAVURLs.push([cardbookSynchronization.getWellKnownUrl(url), true]);
				var carddavURL = cardbookSynchronization.getCardDAVUrl(url, username);
				if (carddavURL != "") {
					wdw_addressbooksAdd.gCardDAVURLs.push([carddavURL, false]);
				}
			}
			
			var dirPrefId = cardbookUtils.getUUID();
			if (type == 'GOOGLE') {
				cardbookNotifications.setNotification("resultNotifications", "ValidatingLabel", url, "PRIORITY_INFO_MEDIUM");
				cardbookSynchronization.initRefreshToken(dirPrefId);
				cardbookRepository.cardbookServerSyncRequest[dirPrefId]++;
				var connection = {connUser: username, connPrefId: dirPrefId, connDescription: wdw_addressbooksAdd.gValidateDescription};
				cardbookSynchronization.requestNewRefreshToken(connection);
				wdw_addressbooksAdd.waitForRefreshTokenFinished(dirPrefId, url);
			} else {
				cardbookSynchronization.initDiscovery();
				wdw_addressbooksAdd.validateCardDAVURL(dirPrefId, username, password, type);
			}
		},

		validateCardDAVURL: function (aDirPrefId, aUsername, aPassword, aType) {
			cardbookPreferences.setId(aDirPrefId, aDirPrefId);
			cardbookPreferences.setUrl(aDirPrefId, wdw_addressbooksAdd.gCardDAVURLs[0][0]);
			cardbookPasswordManager.removeAccount(aUsername, wdw_addressbooksAdd.gCardDAVURLs[0][0]);
			cardbookPasswordManager.addAccount(aUsername, wdw_addressbooksAdd.gCardDAVURLs[0][0], aPassword);
			
			if (wdw_addressbooksAdd.gCardDAVURLs.length > 0) {
				cardbookNotifications.setNotification("resultNotifications", "ValidatingLabel", wdw_addressbooksAdd.gCardDAVURLs[0][0], "PRIORITY_INFO_MEDIUM");
				cardbookSynchronization.initDiscoveryWithPrefId(aDirPrefId);
				cardbookRepository.cardbookServerValidation[aDirPrefId] = {length: 0, user: aUsername};
				cardbookRepository.cardbookServerSyncRequest[aDirPrefId]++;
				wdw_addressbooksAdd.gRunningDirPrefId = aDirPrefId;
				var connection = {connUser: aUsername, connPrefId: aDirPrefId, connUrl: wdw_addressbooksAdd.gCardDAVURLs[0][0], connDescription: wdw_addressbooksAdd.gValidateDescription};
				var params = {aPrefIdType: aType};
				if (wdw_addressbooksAdd.gCardDAVURLs[0][1]) {
					cardbookSynchronization.discoverPhase1(connection, "GETDISPLAYNAME", params);
				} else {
					cardbookSynchronization.validateWithoutDiscovery(connection, "GETDISPLAYNAME", params);
				}
				wdw_addressbooksAdd.waitForDiscoveryFinished(aDirPrefId, aUsername, aPassword, aType);
			}
		},

		waitForDiscoveryFinished: function (aDirPrefId, aUsername, aPassword, aType) {
			wdw_addressbooksAdd.lTimerDiscoveryAll[aDirPrefId] = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			var lTimerDiscovery = wdw_addressbooksAdd.lTimerDiscoveryAll[aDirPrefId];
			lTimerDiscovery.initWithCallback({ notify: function(lTimerDiscovery) {
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(wdw_addressbooksAdd.gValidateDescription + " : debug mode : cardbookRepository.cardbookServerDiscoveryRequest : ", cardbookRepository.cardbookServerDiscoveryRequest[aDirPrefId]);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(wdw_addressbooksAdd.gValidateDescription + " : debug mode : cardbookRepository.cardbookServerDiscoveryResponse : ", cardbookRepository.cardbookServerDiscoveryResponse[aDirPrefId]);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(wdw_addressbooksAdd.gValidateDescription + " : debug mode : cardbookRepository.cardbookServerDiscoveryError : ", cardbookRepository.cardbookServerDiscoveryError[aDirPrefId]);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug1(wdw_addressbooksAdd.gValidateDescription + " : debug mode : cardbookRepository.cardbookServerValidation : ", cardbookRepository.cardbookServerValidation[aDirPrefId]);
						if (cardbookRepository.cardbookServerDiscoveryError[aDirPrefId] >= 1) {
							cardbookPreferences.delBranch(aDirPrefId);
							wdw_addressbooksAdd.gCardDAVURLs.shift();
							if (cardbookRepository.cardbookServerValidation[aDirPrefId] && cardbookRepository.cardbookServerValidation[aDirPrefId].length == 0) {
								cardbookSynchronization.finishMultipleOperations(aDirPrefId);
								if (wdw_addressbooksAdd.gCardDAVURLs.length == 0) {
									cardbookNotifications.setNotification("resultNotifications", "ValidationFailedLabel");
									wdw_addressbooksAdd.gValidateURL = false;
									wdw_addressbooksAdd.checklocationNetwork();
									lTimerDiscovery.cancel();
								} else {
									document.getElementById('validateButton').disabled = true;
									lTimerDiscovery.cancel();
									wdw_addressbooksAdd.validateCardDAVURL(aDirPrefId, aUsername, aPassword, aType);
								}
							} else {
								cardbookSynchronization.finishMultipleOperations(aDirPrefId);
								cardbookNotifications.setNotification("resultNotifications", "ValidationFailedLabel");
								wdw_addressbooksAdd.gValidateURL = false;
								wdw_addressbooksAdd.checklocationNetwork();
								lTimerDiscovery.cancel();
							}
						} else if (cardbookRepository.cardbookServerDiscoveryRequest[aDirPrefId] !== cardbookRepository.cardbookServerDiscoveryResponse[aDirPrefId] || cardbookRepository.cardbookServerDiscoveryResponse[aDirPrefId] === 0) {
							cardbookNotifications.setNotification("resultNotifications", "ValidatingLabel", wdw_addressbooksAdd.gCardDAVURLs[0][0], "PRIORITY_INFO_MEDIUM");
						} else {
							cardbookPreferences.delBranch(aDirPrefId);
							wdw_addressbooksAdd.gCardDAVURLs.shift();
							if (cardbookRepository.cardbookServerValidation[aDirPrefId] && cardbookRepository.cardbookServerValidation[aDirPrefId].length == 0) {
								cardbookSynchronization.finishMultipleOperations(aDirPrefId);
								if (wdw_addressbooksAdd.gCardDAVURLs.length == 0) {
									cardbookNotifications.setNotification("resultNotifications", "ValidationFailedLabel");
									wdw_addressbooksAdd.gValidateURL = false;
									wdw_addressbooksAdd.checklocationNetwork();
									lTimerDiscovery.cancel();
								} else {
									document.getElementById('validateButton').disabled = true;
									lTimerDiscovery.cancel();
									wdw_addressbooksAdd.validateCardDAVURL(aDirPrefId, aUsername, aPassword, aType);
								}
							} else {
								wdw_addressbooksAdd.gCardDAVURLs = [];
								cardbookNotifications.setNotification("resultNotifications", "OK");
								wdw_addressbooksAdd.gValidateURL = true;
								wdw_addressbooksAdd.checklocationNetwork();
								var page = document.getElementsByAttribute('pageid', 'remotePage')[0];
								if (cardbookRepository.cardbookServerValidation[aDirPrefId].length > 1) {
									page.next = 'namesPage';
								} else {
									page.next = 'namePage';
								}
								cardbookSynchronization.finishMultipleOperations(aDirPrefId);
								lTimerDiscovery.cancel();
							}
						}
					}
					}, 1000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
		},

		waitForRefreshTokenFinished: function (aPrefId, aUrl) {
			wdw_addressbooksAdd.lTimerRefreshTokenAll[aPrefId] = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			var lTimerRefreshToken = wdw_addressbooksAdd.lTimerRefreshTokenAll[aPrefId];
			lTimerRefreshToken.initWithCallback({ notify: function(lTimerRefreshToken) {
						if (cardbookRepository.cardbookGoogleRefreshTokenError[aPrefId] >= 1) {
							cardbookNotifications.setNotification("resultNotifications", "ValidationFailedLabel");
							wdw_addressbooksAdd.gValidateURL = false;
							wdw_addressbooksAdd.checklocationNetwork();
							cardbookSynchronization.finishMultipleOperations(aPrefId);
							lTimerRefreshToken.cancel();
						} else if (cardbookRepository.cardbookGoogleRefreshTokenResponse[aPrefId] !== 1) {
							cardbookNotifications.setNotification("resultNotifications", "ValidatingLabel", aUrl, "PRIORITY_INFO_MEDIUM");
						} else {
							cardbookNotifications.setNotification("resultNotifications", "OK");
							wdw_addressbooksAdd.gValidateURL = true;
							wdw_addressbooksAdd.checklocationNetwork();
							cardbookSynchronization.finishMultipleOperations(aPrefId);
							lTimerRefreshToken.cancel();
						}
					}
					}, 1000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
		},

		onSuccessfulAuthentication: function (aResponse) {
			var username = document.getElementById('remotePageUsername').value;
			cardbookPasswordManager.removeAccount(username);
			cardbookPasswordManager.addAccount(username, "", aResponse.refresh_token);
			var wizard = document.getElementById("addressbook-wizard");
			wizard.canAdvance = true;
			wizard.advance();
		},

		loadName: function () {
			var aTextbox = document.getElementById('namePageName');
			if (wdw_addressbooksAdd.gType == 'SEARCH') {
				document.getElementById('colorRow').setAttribute('hidden', 'true');
				document.getElementById('vcardVersionRow').setAttribute('hidden', 'true');
				document.getElementById('dateFormatRow').setAttribute('hidden', 'true');
				document.getElementById('readonlyRow').setAttribute('hidden', 'true');
				document.getElementById('urnuuidRow').setAttribute('hidden', 'true');
				if (window.arguments[0].dirPrefId != null && window.arguments[0].dirPrefId !== undefined && window.arguments[0].dirPrefId != "") {
					aTextbox.value = cardbookPreferences.getName(window.arguments[0].dirPrefId);
				}
			} else {
				document.getElementById('colorRow').removeAttribute('hidden');
				document.getElementById('vcardVersionRow').removeAttribute('hidden');
				document.getElementById('dateFormatRow').removeAttribute('hidden');
				document.getElementById('readonlyRow').removeAttribute('hidden');
				document.getElementById('urnuuidRow').removeAttribute('hidden');
				if (wdw_addressbooksAdd.gType == 'LOCALDB') {
					cardbookElementTools.loadVCardVersions("vCardVersionPageNameMenupopup", "vCardVersionPageName");
				} else if (wdw_addressbooksAdd.gType == 'FILE' || wdw_addressbooksAdd.gType == 'DIRECTORY') {
					aTextbox.value = wdw_addressbooksAdd.gFile.leafName;
					cardbookElementTools.loadVCardVersions("vCardVersionPageNameMenupopup", "vCardVersionPageName");
				} else if (wdw_addressbooksAdd.gType == 'GOOGLE') {
					aTextbox.value = document.getElementById('remotePageUsername').value;
					// does not work with 4.0
					cardbookElementTools.loadVCardVersions("vCardVersionPageNameMenupopup", "vCardVersionPageName", ["3.0"]);
				} else if (wdw_addressbooksAdd.gType == 'APPLE') {
					aTextbox.value = document.getElementById('remotePageUsername').value;
					// list cannot be easily created in 4.0
					cardbookElementTools.loadVCardVersions("vCardVersionPageNameMenupopup", "vCardVersionPageName", ["3.0"]);
				} else {
						if (window.arguments[0].action == "discovery") {
							wdw_addressbooksAdd.setCanRewindFalse();
						}
						for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
						if (window.arguments[0].action == "discovery" && window.arguments[0].dirPrefId != dirPrefId) {
							continue;
						}
						for (var url in cardbookRepository.cardbookServerValidation[dirPrefId]) {
							if (url == "length" || url == "user") {
								continue;
							}
							if (cardbookRepository.cardbookServerValidation[dirPrefId][url].forget) {
								continue;
							}
							aTextbox.value = cardbookUtils.undefinedToBlank(cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName);
							if (window.arguments[0].action == "discovery") {
								document.getElementById('remotePageUsername').value = cardbookRepository.cardbookServerValidation[dirPrefId].user;
							}
						}
					}
					if (cardbookRepository.cardbookServerValidation[dirPrefId][url].version.length > 0) {
						cardbookElementTools.loadVCardVersions("vCardVersionPageNameMenupopup", "vCardVersionPageName", cardbookRepository.cardbookServerValidation[dirPrefId][url].version);
					} else {
						cardbookElementTools.loadVCardVersions("vCardVersionPageNameMenupopup", "vCardVersionPageName");
					}
				}
				var aTextbox = document.getElementById('serverColorInput');
				aTextbox.value = cardbookUtils.randomColor(100);
				if (document.getElementById("vCardVersionPageName").selectedItem.value == "3.0") {
					cardbookElementTools.loadDateFormats("dateFormatMenuPopup", "dateFormatMenuList", "YYYY-MM-DD");
				} else {
					cardbookElementTools.loadDateFormats("dateFormatMenuPopup", "dateFormatMenuList", "YYYYMMDD");
				}
			}
			wdw_addressbooksAdd.checkRequired();
		},

		deleteBoxes: function () {
			var aListRows = document.getElementById('namesRows');
			var childNodes = aListRows.childNodes;
			var toDelete = [];
			for (var i = 0; i < childNodes.length; i++) {
				var child = childNodes[i];
				if (child.getAttribute('id') != "headersRow") {
					toDelete.push(child);
				}
			}
			for (var i = 0; i < toDelete.length; i++) {
				var oldChild = aListRows.removeChild(toDelete[i]);
			}
		},

		createBoxes: function (aId, aName, aVersionList, aCallback) {
			var aListRows = document.getElementById('namesRows');
			var aRow = document.createElement('row');
			aListRows.appendChild(aRow);
			aRow.setAttribute('id', 'namesRow' + aId);
			aRow.setAttribute('flex', '1');
			
			var aCheckbox = document.createElement('checkbox');
			aRow.appendChild(aCheckbox);
			aCheckbox.setAttribute('checked', true);
			aCheckbox.setAttribute('id', 'namesCheckbox' + aId);
			aCheckbox.addEventListener("command", function() {
					var aTextBox = document.getElementById('namesTextbox' + this.id.replace("namesCheckbox",""));
					if (this.checked) {
						aTextBox.setAttribute('required', true);
					} else {
						aTextBox.setAttribute('required', false);
					}
					aCallback();
				}, false);

			var aTextbox = document.createElement('textbox');
			aRow.appendChild(aTextbox);
			aTextbox.setAttribute('id', 'namesTextbox' + aId);
			aTextbox.setAttribute('flex', '1');
			aTextbox.setAttribute('required', true);
			aTextbox.value = aName;
			aTextbox.addEventListener("input", function() {
					aCallback();
				}, false);

			var aColorbox =  document.createElementNS("http://www.w3.org/1999/xhtml","input");
			aRow.appendChild(aColorbox);
			aColorbox.setAttribute('id', 'serverColorInput' + aId);
			aColorbox.setAttribute('class', "small-margin");
			aColorbox.setAttribute('type', "color");
			aColorbox.value = cardbookUtils.randomColor(100);
			
			var aMenuList = document.createElement('menulist');
			aRow.appendChild(aMenuList);
			aMenuList.setAttribute('id', 'vCardVersionPageName' + aId);
			var aMenuPopup = document.createElement('menupopup');
			aMenuList.appendChild(aMenuPopup);
			aMenuPopup.setAttribute('id', 'vCardVersionPageNameMenupopup' + aId);
			cardbookElementTools.loadVCardVersions(aMenuPopup.id, aMenuList.id, aVersionList);
			// different default date formats
			aMenuList.addEventListener("popuphiding", function() {
					var myId = this.id.replace('vCardVersionPageName', '');
					if (document.getElementById(this.id).selectedItem.value == "3.0") {
						cardbookElementTools.loadDateFormats('dateFormatMenuPopup' + myId, 'dateFormatMenuList' + myId, "YYYY-MM-DD");
					} else {
						cardbookElementTools.loadDateFormats('dateFormatMenuPopup' + myId, 'dateFormatMenuList' + myId, "YYYYMMDD");
					}
				}, false);

			var aMenuList = document.createElement('menulist');
			aRow.appendChild(aMenuList);
			aMenuList.setAttribute('id', 'dateFormatMenuList' + aId);
			aMenuList.setAttribute('hidden', 'true');
			var aMenuPopup = document.createElement('menupopup');
			aMenuList.appendChild(aMenuPopup);
			aMenuPopup.setAttribute('id', 'dateFormatMenuPopup' + aId);
			if (document.getElementById('vCardVersionPageName' + aId).selectedItem.value == "3.0") {
				cardbookElementTools.loadDateFormats(aMenuPopup.id, aMenuList.id, "YYYY-MM-DD");
			} else {
				cardbookElementTools.loadDateFormats(aMenuPopup.id, aMenuList.id, "YYYYMMDD");
			}

			var aCheckbox1 = document.createElement('checkbox');
			aRow.appendChild(aCheckbox1);
			aCheckbox1.setAttribute('checked', false);
			aCheckbox1.setAttribute('id', 'readonlyCheckbox' + aId);
			var aCheckbox2 = document.createElement('checkbox');
			aRow.appendChild(aCheckbox2);
			aCheckbox2.setAttribute('checked', false);
			aCheckbox2.setAttribute('id', 'urnuuidCheckbox' + aId);
		},

		loadNames: function () {
			wdw_addressbooksAdd.deleteBoxes();
			if (window.arguments[0].action == "discovery") {
				wdw_addressbooksAdd.setCanRewindFalse();
			}
			for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
				if (window.arguments[0].action == "discovery" && window.arguments[0].dirPrefId != dirPrefId) {
					continue;
				}
				for (var url in cardbookRepository.cardbookServerValidation[dirPrefId]) {
					if (url == "length" || url == "user") {
						continue;
					}
					if (cardbookRepository.cardbookServerValidation[dirPrefId][url].forget) {
						continue;
					}
						
					if (window.arguments[0].action == "discovery") {
						document.getElementById('remotePageUsername').value = cardbookRepository.cardbookServerValidation[dirPrefId].user;
					}
					wdw_addressbooksAdd.createBoxes(cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName, cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName,
													cardbookRepository.cardbookServerValidation[dirPrefId][url].version, wdw_addressbooksAdd.checkUrlLinesRequired);
				}
			}
			for (var i = 0; i < wdw_addressbooksAdd.gStandardAddressbooks.length; i++) {
				wdw_addressbooksAdd.createBoxes(wdw_addressbooksAdd.gStandardAddressbooks[i][0], wdw_addressbooksAdd.gStandardAddressbooks[i][1],
												cardbookRepository.supportedVersion, wdw_addressbooksAdd.checkStandardLinesRequired);
			}
			if (wdw_addressbooksAdd.gStandardAddressbooks.length > 0) {
				wdw_addressbooksAdd.checkStandardLinesRequired();
			} else {
				wdw_addressbooksAdd.checkUrlLinesRequired();
			}
		},

		namesAdvance: function () {
			var page = document.getElementsByAttribute('pageid', 'namesPage')[0];
			wdw_addressbooksAdd.prepareAddressbook();
			if (wdw_addressbooksAdd.gFinishParams.length > 1) {
				page.next = 'finishsPage';
			} else {
				page.next = 'finishPage';
			}
		},

		prepareAddressbook: function () {
			var username = document.getElementById('remotePageUsername').value;

			if (wdw_addressbooksAdd.gType == 'SEARCH') {
				var name = document.getElementById('namePageName').value;
				var color = document.getElementById('serverColorInput').value;
				var vCardVersion = document.getElementById('vCardVersionPageName').value;
				if (window.arguments[0].dirPrefId != null && window.arguments[0].dirPrefId !== undefined && window.arguments[0].dirPrefId != "") {
					var dirPrefId = window.arguments[0].dirPrefId;
					var enabled = cardbookPreferences.getEnabled(window.arguments[0].dirPrefId);
				} else {
					var dirPrefId = cardbookUtils.getUUID();
					var enabled = true;
				}
				wdw_addressbooksAdd.gFinishParams.push({searchDef: wdw_addressbooksAdd.gTypeFile, name: name, username: "", color: color, vcard: vCardVersion, enabled: enabled, dirPrefId: dirPrefId, DBcached: false, firstAction: false});
			} else if (wdw_addressbooksAdd.gType == 'GOOGLE') {
				var url = cardbookRepository.cardbookgdata.GOOGLE_API;
				var name = document.getElementById('namePageName').value;
				var color = document.getElementById('serverColorInput').value;
				var vCardVersion = document.getElementById('vCardVersionPageName').value;
				var readonly = document.getElementById('readonlyPageName').checked;
				var dateFormat = document.getElementById('dateFormatMenuList').value;
				var urnuuid = document.getElementById('urnuuidPageName').checked;
				var dirPrefId = cardbookUtils.getUUID();
				wdw_addressbooksAdd.gFinishParams.push({url: url, name: name, username: username, color: color, vcard: vCardVersion, readonly: readonly, dirPrefId: dirPrefId, dateFormat: dateFormat,
															urnuuid: urnuuid, DBcached: true, firstAction: false});
			} else if (wdw_addressbooksAdd.gType == 'APPLE') {
				var url = cardbookRepository.APPLE_API;
				var name = document.getElementById('namePageName').value;
				var color = document.getElementById('serverColorInput').value;
				var vCardVersion = document.getElementById('vCardVersionPageName').value;
				var readonly = document.getElementById('readonlyPageName').checked;
				var dateFormat = document.getElementById('dateFormatMenuList').value;
				var urnuuid = document.getElementById('urnuuidPageName').checked;
				var dirPrefId = cardbookUtils.getUUID();
				wdw_addressbooksAdd.gFinishParams.push({url: url, name: name, username: username, color: color, vcard: vCardVersion, readonly: readonly, dirPrefId: dirPrefId, dateFormat: dateFormat,
															urnuuid: urnuuid, DBcached: true, firstAction: false});
			} else if (wdw_addressbooksAdd.gType == 'CARDDAV') {
				for (var dirPrefId in cardbookRepository.cardbookServerValidation) {
					if (window.arguments[0].action == "discovery" && window.arguments[0].dirPrefId != dirPrefId) {
						continue;
					}
					for (var url in cardbookRepository.cardbookServerValidation[dirPrefId]) {
						if (url == "length" || url == "user") {
							continue;
						}
						if (cardbookRepository.cardbookServerValidation[dirPrefId][url].forget) {
							continue;
						}
						if (cardbookRepository.cardbookServerValidation[dirPrefId].length > 1) {
							var aCheckbox = document.getElementById('namesCheckbox' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName);
							if (aCheckbox.checked) {
								var aAddressbookId = cardbookUtils.getUUID();
								var aAddressbookName = document.getElementById('namesTextbox' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName).value;
								var aAddressbookColor = document.getElementById('serverColorInput' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName).value;
								var aAddressbookVCard = document.getElementById('vCardVersionPageName' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName).value;
								var aAddressbookReadOnly = document.getElementById('readonlyCheckbox' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName).checked;
								var aAddressbookDateFormat = document.getElementById('dateFormatMenuList' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName).value;
								var aAddressbookUrnuuid = document.getElementById('urnuuidCheckbox' + cardbookRepository.cardbookServerValidation[dirPrefId][url].displayName).checked;
								wdw_addressbooksAdd.gFinishParams.push({url: url, name: aAddressbookName, username: username, color: aAddressbookColor,
																		vcard: aAddressbookVCard, readonly: aAddressbookReadOnly, dirPrefId: aAddressbookId, dateFormat: aAddressbookDateFormat,
																		urnuuid: aAddressbookUrnuuid, DBcached: true, firstAction: false});
							}
						} else {
							var name = document.getElementById('namePageName').value;
							var color = document.getElementById('serverColorInput').value;
							var vCardVersion = document.getElementById('vCardVersionPageName').value;
							var readonly = document.getElementById('readonlyPageName').checked;
							var dateFormat = document.getElementById('dateFormatMenuList').value;
							var urnuuid = document.getElementById('urnuuidPageName').checked;
							wdw_addressbooksAdd.gFinishParams.push({url: url, name: name, username: username, color: color, vcard: vCardVersion, readonly: readonly, dirPrefId: dirPrefId, dateFormat: dateFormat,
																		urnuuid: urnuuid, DBcached: true, firstAction: false});
						}
					}
				}
			} else if (wdw_addressbooksAdd.gType == 'STANDARD') {
				for (var i = 0; i < wdw_addressbooksAdd.gStandardAddressbooks.length; i++) {
					var aCheckbox = document.getElementById('namesCheckbox' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]);
					if (aCheckbox.checked) {
						var aAddressbookId = cardbookUtils.getUUID();
						var aAddressbookName = document.getElementById('namesTextbox' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]).value;
						var aAddressbookColor = document.getElementById('serverColorInput' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]).value;
						var aAddressbookVCard = document.getElementById('vCardVersionPageName' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]).value;
						var aAddressbookReadOnly = document.getElementById('readonlyCheckbox' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]).checked;
						var aAddressbookDateFormat = document.getElementById('dateFormatMenuList' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]).value;
						var aAddressbookUrnuuid = document.getElementById('urnuuidCheckbox' + wdw_addressbooksAdd.gStandardAddressbooks[i][0]).checked;
						if (window.arguments[0].action == "first") {
							var aFirstAction = true;
						} else {
							var aFirstAction = false;
						}
						wdw_addressbooksAdd.gFinishParams.push({sourceDirPrefId: wdw_addressbooksAdd.gStandardAddressbooks[i][0],
																name: aAddressbookName, username: "", color: aAddressbookColor, vcard: aAddressbookVCard, readonly: aAddressbookReadOnly,
																dirPrefId: aAddressbookId, collected: wdw_addressbooksAdd.gStandardAddressbooks[i][2], dateFormat: aAddressbookDateFormat,
																urnuuid: aAddressbookUrnuuid, DBcached: true, firstAction: aFirstAction});
					}
				}
			} else if (wdw_addressbooksAdd.gType == 'LOCALDB') {
				var name = document.getElementById('namePageName').value;
				var color = document.getElementById('serverColorInput').value;
				var vCardVersion = document.getElementById('vCardVersionPageName').value;
				var readonly = document.getElementById('readonlyPageName').checked;
				var dateFormat = document.getElementById('dateFormatMenuList').value;
				var urnuuid = document.getElementById('urnuuidPageName').checked;
				var dirPrefId = cardbookUtils.getUUID();
				wdw_addressbooksAdd.gFinishParams.push({name: name, username: "", color: color, vcard: vCardVersion, readonly: readonly, dirPrefId: dirPrefId, dateFormat: dateFormat,
															urnuuid: urnuuid, DBcached: true, firstAction: false});
			} else if (wdw_addressbooksAdd.gType == 'FILE' || wdw_addressbooksAdd.gType == 'DIRECTORY') {
				var dirname = document.getElementById('localPageURI').value;
				var name = document.getElementById('namePageName').value;
				var color = document.getElementById('serverColorInput').value;
				var vCardVersion = document.getElementById('vCardVersionPageName').value;
				var readonly = document.getElementById('readonlyPageName').checked;
				var dateFormat = document.getElementById('dateFormatMenuList').value;
				var urnuuid = document.getElementById('urnuuidPageName').checked;
				var dirPrefId = cardbookUtils.getUUID();
				wdw_addressbooksAdd.gFinishParams.push({actionType: wdw_addressbooksAdd.gTypeFile, file: wdw_addressbooksAdd.gFile, dirname: dirname, name: name, username: "",
														color: color, vcard: vCardVersion, readonly: readonly, dirPrefId: dirPrefId, dateFormat: dateFormat, urnuuid: urnuuid, DBcached: false, firstAction: false});
			}
		},

		setCanRewindFalse: function () {
			document.getElementById('addressbook-wizard').canRewind = false;
		},

		cancelWizard: function () {
			wdw_addressbooksAdd.gType = "";
			wdw_addressbooksAdd.closeWizard();
		},

		createAddressbook: function () {
			for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
				if (cardbookPreferences.getType(wdw_addressbooksAdd.gFinishParams[i].dirPrefId) === "SEARCH" && wdw_addressbooksAdd.gType === "SEARCH") {
					wdw_cardbook.modifySearchAddressbook(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gFinishParams[i].color, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].readonly,
													wdw_addressbooksAdd.gFinishParams[i].dateFormat, wdw_addressbooksAdd.gFinishParams[i].urnuuid, wdw_addressbooksAdd.gFinishParams[i].searchDef);
					return;
				}
			}
			if (wdw_addressbooksAdd.gType === "GOOGLE" || wdw_addressbooksAdd.gType === "CARDDAV" || wdw_addressbooksAdd.gType === "APPLE") {
				for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
					cardbookRepository.addAccountToRepository(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gType, wdw_addressbooksAdd.gFinishParams[i].url, wdw_addressbooksAdd.gFinishParams[i].username, wdw_addressbooksAdd.gFinishParams[i].color,
																true, true, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].readonly, wdw_addressbooksAdd.gFinishParams[i].dateFormat, wdw_addressbooksAdd.gFinishParams[i].urnuuid, wdw_addressbooksAdd.gFinishParams[i].DBcached, true);
					cardbookUtils.formatStringForOutput("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name]);
					wdw_cardbooklog.addActivity("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name], "addItem");
					cardbookUtils.notifyObservers("cardbook.ABAddedDirect", "accountid:" + wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookSynchronization.initSync();
					cardbookSynchronization.initSyncWithPrefId(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookSynchronization.syncAccount(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
				}
			} else if (wdw_addressbooksAdd.gType === "SEARCH") {
				for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
					var myFile = cardbookRepository.getRuleFile(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					if (myFile.exists()) {
						myFile.remove(true);
					}
					myFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
					cardbookSynchronization.writeContentToFile(myFile.path, wdw_addressbooksAdd.gFinishParams[i].searchDef, "UTF8");
					cardbookRepository.addAccountToRepository(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gType, myFile.path, wdw_addressbooksAdd.gFinishParams[i].username, wdw_addressbooksAdd.gFinishParams[i].color,
																wdw_addressbooksAdd.gFinishParams[i].enabled, true, wdw_addressbooksAdd.gFinishParams[i].vcard, false, null, null, wdw_addressbooksAdd.gFinishParams[i].DBcached, true);
					cardbookComplexSearch.loadComplexSearchAccount(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, true, "WINDOW");
					cardbookUtils.formatStringForOutput("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name]);
					wdw_cardbooklog.addActivity("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name], "addItem");
					cardbookUtils.notifyObservers("cardbook.ABAddedDirect", "accountid:" + wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
				}
			} else if (wdw_addressbooksAdd.gType === "STANDARD") {
				for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
					if (wdw_addressbooksAdd.gFinishParams[i].collected) {
						cardbookRepository.addAccountToCollected(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					}
					cardbookRepository.addAccountToRepository(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, "LOCALDB", "", wdw_addressbooksAdd.gFinishParams[i].username, wdw_addressbooksAdd.gFinishParams[i].color,
																true, true, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].readonly, wdw_addressbooksAdd.gFinishParams[i].dateFormat, wdw_addressbooksAdd.gFinishParams[i].urnuuid, wdw_addressbooksAdd.gFinishParams[i].DBcached, true);
					cardbookUtils.formatStringForOutput("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name]);
					wdw_cardbooklog.addActivity("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name], "addItem");
					cardbookUtils.notifyObservers("cardbook.ABAddedDirect", "accountid:" + wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookSynchronization.initSyncWithPrefId(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookRepository.cardbookDirRequest[wdw_addressbooksAdd.gFinishParams[i].dirPrefId]++;
					var myMode = "WINDOW";
					wdw_migrate.importCards(wdw_addressbooksAdd.gFinishParams[i].sourceDirPrefId, wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].dateFormat, myMode);
					cardbookSynchronization.waitForDirFinished(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, myMode);
					// if the first proposed import of standard address books is finished OK
					// then set CardBook as exclusive
					if (wdw_addressbooksAdd.gFinishParams[i].firstAction) {
						cardbookPreferences.setBoolPref("extensions.cardbook.exclusive", true);
					}
				}
			} else if (wdw_addressbooksAdd.gType === "LOCALDB") {
				cardbookRepository.cardbookSyncMode = "NOSYNC";
				for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
					cardbookRepository.addAccountToRepository(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gType, "", wdw_addressbooksAdd.gFinishParams[i].username, wdw_addressbooksAdd.gFinishParams[i].color,
																true, true, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].readonly, wdw_addressbooksAdd.gFinishParams[i].dateFormat, wdw_addressbooksAdd.gFinishParams[i].urnuuid, wdw_addressbooksAdd.gFinishParams[i].DBcached, true);
					cardbookUtils.formatStringForOutput("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name]);
					wdw_cardbooklog.addActivity("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name], "addItem");
					cardbookUtils.notifyObservers("cardbook.ABAddedDirect", "accountid:" + wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
				}
			} else if (wdw_addressbooksAdd.gType === "FILE") {
				for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
					cardbookRepository.addAccountToRepository(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gType, wdw_addressbooksAdd.gFinishParams[i].dirname, wdw_addressbooksAdd.gFinishParams[i].username, wdw_addressbooksAdd.gFinishParams[i].color,
																true, true, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].readonly, wdw_addressbooksAdd.gFinishParams[i].dateFormat, wdw_addressbooksAdd.gFinishParams[i].urnuuid, wdw_addressbooksAdd.gFinishParams[i].DBcached, true);
					cardbookUtils.formatStringForOutput("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name]);
					wdw_cardbooklog.addActivity("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name], "addItem");
					cardbookUtils.notifyObservers("cardbook.ABAddedDirect", "accountid:" + wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookSynchronization.initSyncWithPrefId(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookRepository.cardbookFileRequest[wdw_addressbooksAdd.gFinishParams[i].dirPrefId]++;
					var myFile = wdw_addressbooksAdd.gFinishParams[i].file;
					if (wdw_addressbooksAdd.gFinishParams[i].actionType === "CREATEFILE") {
						if (myFile.exists()) {
							myFile.remove(true);
						}
						myFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
					}
					var myMode = "WINDOW";
					cardbookSynchronization.loadFile(myFile, "", wdw_addressbooksAdd.gFinishParams[i].dirPrefId, myMode, "");
					cardbookSynchronization.waitForDirFinished(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, myMode);
				}
			} else if (wdw_addressbooksAdd.gType === "DIRECTORY") {
				for (var i = 0; i < wdw_addressbooksAdd.gFinishParams.length; i++) {
					var myDir = wdw_addressbooksAdd.gFinishParams[i].file;
					if (wdw_addressbooksAdd.gFinishParams[i].actionType === "CREATEDIRECTORY") {
						if (myDir.exists()) {
							var aListOfFileName = [];
							aListOfFileName = cardbookSynchronization.getFilesFromDir(myDir.path);
							if (aListOfFileName.length > 0) {
								var prompts = Services.prompt;
								var strBundle = document.getElementById("cardbook-strings");
								var confirmTitle = strBundle.getString("confirmTitle");
								var confirmMsg = strBundle.getFormattedString("directoryDeletionConfirmMessage", [myDir.leafName]);
								if (prompts.confirm(window, confirmTitle, confirmMsg)) {
									myDir.remove(true);
									try {
										myDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o774);
									}
									catch (e) {
										wdw_cardbooklog.updateStatusProgressInformation("cannot create directory : " + myDir.path + " : error : " + e, "Error");
										cardbookRepository.cardbookSyncMode = "NOSYNC";
										return;
									}
								} else {
									cardbookRepository.cardbookSyncMode = "NOSYNC";
									return;
								}
							}
						} else {
							try {
								myDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o774);
							}
							catch (e) {
								wdw_cardbooklog.updateStatusProgressInformation("cannot create directory : " + myDir.path + " : error : " + e, "Error");
								cardbookRepository.cardbookSyncMode = "NOSYNC";
								return;
							}
						}
					}
					cardbookRepository.addAccountToRepository(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, wdw_addressbooksAdd.gType, wdw_addressbooksAdd.gFinishParams[i].dirname, wdw_addressbooksAdd.gFinishParams[i].username, wdw_addressbooksAdd.gFinishParams[i].color,
																true, true, wdw_addressbooksAdd.gFinishParams[i].vcard, wdw_addressbooksAdd.gFinishParams[i].readonly, wdw_addressbooksAdd.gFinishParams[i].dateFormat, wdw_addressbooksAdd.gFinishParams[i].urnuuid, wdw_addressbooksAdd.gFinishParams[i].DBcached, true);
					cardbookUtils.formatStringForOutput("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name]);
					wdw_cardbooklog.addActivity("addressbookCreated", [wdw_addressbooksAdd.gFinishParams[i].name], "addItem");
					cardbookUtils.notifyObservers("cardbook.ABAddedDirect", "accountid:" + wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookSynchronization.initSyncWithPrefId(wdw_addressbooksAdd.gFinishParams[i].dirPrefId);
					cardbookRepository.cardbookDirRequest[wdw_addressbooksAdd.gFinishParams[i].dirPrefId]++;
					var myMode = "WINDOW";
					cardbookSynchronization.loadDir(myDir, "", wdw_addressbooksAdd.gFinishParams[i].dirPrefId, myMode, "");
					cardbookSynchronization.waitForDirFinished(wdw_addressbooksAdd.gFinishParams[i].dirPrefId, wdw_addressbooksAdd.gFinishParams[i].name, myMode);
				}
			} else {
				var total = cardbookSynchronization.getRequest() + cardbookSynchronization.getTotal() + cardbookSynchronization.getResponse() + cardbookSynchronization.getDone();
				if (total === 0) {
					cardbookRepository.cardbookSyncMode = "NOSYNC";
				}
			}
		},

		closeWizard: function () {
			if (wdw_addressbooksAdd.gRunningDirPrefId != "") {
				cardbookSynchronization.finishMultipleOperations(wdw_addressbooksAdd.gRunningDirPrefId);
			}
			for (var dirPrefId in wdw_addressbooksAdd.lTimerRefreshTokenAll) {
				try {
					wdw_addressbooksAdd.lTimerRefreshTokenAll[dirPrefId].cancel();
				} catch(e) {}
			}
			for (var dirPrefId in wdw_addressbooksAdd.lTimerDiscoveryAll) {
				try {
					wdw_addressbooksAdd.lTimerDiscoveryAll[dirPrefId].cancel();
				} catch(e) {}
			}
			document.getElementById('addressbook-wizard').canAdvance = false;
			wdw_addressbooksAdd.createAddressbook();
		},

	};

};
