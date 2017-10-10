if ("undefined" == typeof(wdw_cardbookConfiguration)) {
	Components.utils.import("resource:///modules/mailServices.js");
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var wdw_cardbookConfiguration = {

		allTypes: {},
		allCustomFields: {},
		allIMPPs: {},
		allOrg: [],
		allRestrictions: [],
		allEmailsCollections: [],
		allVCards: [],
		preferEmailPrefOld: false,
		
		customFieldCheck: function (aTextBox) {
			var myValue = aTextBox.value.trim();
			if (myValue == "") {
				aTextBox.value = "X-";
			} else {
				aTextBox.value = myValue.toUpperCase();
			}
		},

		sortTreesFromCol: function (aEvent, aColumn, aTreeName) {
			if (aEvent.button == 0) {
				wdw_cardbookConfiguration.sortTrees(aColumn, aTreeName);
			}
		},

		sortTrees: function (aColumn, aTreeName) {
			var myTree = document.getElementById(aTreeName);
			if (aColumn) {
				if (myTree.currentIndex !== -1) {
					var mySelectedValue = myTree.view.getCellText(myTree.currentIndex, {id: aColumn.id});
				}
			}

			var columnName;
			var columnArray;
			var order = myTree.getAttribute("sortDirection") == "ascending" ? 1 : -1;
			
			// if the column is passed and it's already sorted by that column, reverse sort
			if (aColumn) {
				columnName = aColumn.id;
				if (myTree.getAttribute("sortResource") == columnName) {
					order *= -1;
				}
			} else {
				columnName = myTree.getAttribute("sortResource");
			}
			switch(columnName) {
				case "typesCode":
					columnArray=0;
					break;
				case "typesLabel":
					columnArray=1;
					break;
				case "accountsRestrictionsMailName":
					columnArray=2;
					break;
				case "accountsRestrictionsABName":
					columnArray=4;
					break;
				case "accountsRestrictionsCatName":
					columnArray=6;
					break;
				case "accountsRestrictionsIncludeName":
					columnArray=8;
					break;
				case "emailsCollectionMailName":
					columnArray=2;
					break;
				case "emailsCollectionABName":
					columnArray=4;
					break;
				case "emailsCollectionCatName":
					columnArray=6;
					break;
				case "emailsCollectionIncludeName":
					columnArray=8;
					break;
				case "accountsVCardsMailName":
					columnArray=2;
					break;
				case "accountsVCardsFn":
					columnArray=4;
					break;
				case "accountsVCardsFileName":
					columnArray=7;
					break;
				case "IMPPCode":
					columnArray=0;
					break;
				case "IMPPLabel":
					columnArray=1;
					break;
				case "IMPPProtocol":
					columnArray=2;
					break;
				case "customFieldsCode":
					columnArray=0;
					break;
				case "customFieldsLabel":
					columnArray=1;
					break;
				case "customFieldsRank":
					columnArray=2;
					break;
			}
			if (aTreeName == "accountsVCardsTree") {
				var myData = wdw_cardbookConfiguration.allVCards;
			} else if (aTreeName == "accountsRestrictionsTree") {
				var myData = wdw_cardbookConfiguration.allRestrictions;
			} else if (aTreeName == "emailsCollectionTree") {
				var myData = wdw_cardbookConfiguration.allEmailsCollections;
			} else if (aTreeName == "IMPPsTree") {
				var myData = wdw_cardbookConfiguration.allIMPPs[document.getElementById('imppsCategoryRadiogroup').selectedItem.value];
			} else if (aTreeName == "customFields") {
				var myData = wdw_cardbookConfiguration.allCustomFields[document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value];
			} else {
				var myData = wdw_cardbookConfiguration.allTypes[document.getElementById('typesCategoryRadiogroup').selectedItem.value];
			}
			
			if (myData && myData.length) {
				if (columnName != 'customFieldsRank') {
					myData = cardbookUtils.sortArrayByString(myData,columnArray,order);
				} else {
					myData = cardbookUtils.sortArrayByNumber(myData,columnArray,order);
				}
			}

			//setting these will make the sort option persist
			myTree.setAttribute("sortDirection", order == 1 ? "ascending" : "descending");
			myTree.setAttribute("sortResource", columnName);
			
			if (aTreeName == "accountsVCardsTree") {
				wdw_cardbookConfiguration.displayVCards();
			} else if (aTreeName == "accountsRestrictionsTree") {
				wdw_cardbookConfiguration.displayRestrictions();
			} else if (aTreeName == "emailsCollectionTree") {
				wdw_cardbookConfiguration.displayEmailsCollection();
			} else if (aTreeName == "IMPPsTree") {
				wdw_cardbookConfiguration.displayIMPPs();
			} else if (aTreeName == "customFields") {
				wdw_cardbookConfiguration.displayCustomFields();
			} else {
				wdw_cardbookConfiguration.displayTypes();
			}
			
			//set the appropriate attributes to show to indicator
			var cols = myTree.getElementsByTagName("treecol");
			for (var i = 0; i < cols.length; i++) {
				cols[i].removeAttribute("sortDirection");
			}
			document.getElementById(columnName).setAttribute("sortDirection", order == 1 ? "ascending" : "descending");

			// select back
			if (aColumn && mySelectedValue) {
				for (var i = 0; i < myTree.view.rowCount; i++) {
					if (myTree.view.getCellText(i, {id: aColumn.id}) == mySelectedValue) {
						myTree.view.selection.rangedSelect(i,i,true);
						found = true
						foundIndex = i;
						break;
					}
				}
			}
		},

		doubleClickTree: function (aEvent, aTreeName) {
			var myTree = document.getElementById(aTreeName);
			if (myTree.currentIndex != -1) {
				var row = { }, col = { }, child = { };
				myTree.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, child);
				if (row.value != -1) {
					if (aTreeName == "accountsVCardsTree") {
						wdw_cardbookConfiguration.renameVCard();
					} else if (aTreeName == "accountsRestrictionsTree") {
						wdw_cardbookConfiguration.renameRestriction();
					} else if (aTreeName == "emailsCollectionTree") {
						wdw_cardbookConfiguration.renameEmailsCollection();
					} else if (aTreeName == "IMPPsTree") {
						wdw_cardbookConfiguration.renameIMPP();
					} else if (aTreeName == "customFields") {
						wdw_cardbookConfiguration.renameCustomFields();
					} else {
						wdw_cardbookConfiguration.renameType();
					}
				}
			}
		},

		loadTitle: function () {
			var prefs = Services.prefs;
			var strBundle = document.getElementById("cardbook-strings");
			document.title = strBundle.getString("cardbookPrefTitle") + " (" + cardbookRepository.addonVersion + ")";
		},

		loadPrefEmailPref: function () {
			var prefs = Services.prefs;
			wdw_cardbookConfiguration.preferEmailPrefOld = prefs.getBoolPref("extensions.cardbook.preferEmailPref");
		},

		validatePrefEmailPref: function () {
			var myNewCheck = document.getElementById('preferEmailPrefCheckBox').checked;
			if (myNewCheck !== wdw_cardbookConfiguration.preferEmailPrefOld) {
				for (j in cardbookRepository.cardbookCards) {
					let myCard = cardbookRepository.cardbookCards[j];
					if (!myCard.isAList) {
						myCard.emails = cardbookUtils.getPrefAddressFromCard(myCard, "email", myNewCheck);
					}
				}
				cardbookRepository.preferEmailPref = myNewCheck;
			}
		},

		validatePrefIMPPPref: function () {
			cardbookRepository.preferIMPPPref = document.getElementById('preferIMPPPrefCheckBox').checked;
		},

		loadFnFormula: function () {
			var strBundle = document.getElementById("cardbook-strings");
			var myLabel = "";
			myLabel = myLabel + "{{1}} : " + strBundle.getString("prefixnameLabel") + "    ";
			myLabel = myLabel + "{{2}} : " + strBundle.getString("firstnameLabel") + "    ";
			myLabel = myLabel + "{{3}} : " + strBundle.getString("othernameLabel") + "    ";
			myLabel = myLabel + "{{4}} : " + strBundle.getString("lastnameLabel") + "    ";
			myLabel = myLabel + "{{5}} : " + strBundle.getString("suffixnameLabel");
			document.getElementById('fnFormulaDescriptionLabel1').value = myLabel.trim();
			myLabel = "";
			var count = 6;
			if (wdw_cardbookConfiguration.allOrg.length === 0) {
				myLabel = "{{6}} : " + strBundle.getString("orgLabel");
			} else {
				for (var i = 0; i < wdw_cardbookConfiguration.allOrg.length; i++) {
					var index = count + i;
					myLabel = myLabel + "{{" + index + "}} : " + wdw_cardbookConfiguration.allOrg[i] + "    ";
				}
			}
			document.getElementById('fnFormulaDescriptionLabel2').value = myLabel.trim();
		},

		resetFnFormula: function () {
			document.getElementById('fnFormulaTextBox').value = cardbookRepository.defaultFnFormula;
		},

		validateFnFormula: function () {
			if (document.getElementById('fnFormulaTextBox').value == "") {
				wdw_cardbookConfiguration.resetFnFormula();
			}
			// to be sure the pref is saved (resetting its value does not save the preference)
			var prefs = Services.prefs;
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = document.getElementById('fnFormulaTextBox').value;
			prefs.setComplexValue("extensions.cardbook.fnFormula", Components.interfaces.nsISupportsString, str);
		},

		loadEventEntryTitle: function () {
			var prefs = Services.prefs;
			var eventEntryTitle = prefs.getComplexValue("extensions.cardbook.eventEntryTitle", Components.interfaces.nsISupportsString).data;
			if (eventEntryTitle == "") {
				var strBundle = document.getElementById("cardbook-strings");
				document.getElementById('calendarEntryTitleTextBox').value=strBundle.getString("eventEntryTitleMessage");
			}
		},

		showTab: function () {
			if (window.arguments) {
				if (window.arguments[0].showTab != null && window.arguments[0].showTab !== undefined && window.arguments[0].showTab != "") {
					document.getElementById('advancedPrefs').selectedTab = document.getElementById(window.arguments[0].showTab);
				}
			}
		},

		cardbookAutoComplete: function () {
			if (document.getElementById('autocompletionCheckBox').checked) {
				document.getElementById('autocompleteSortByPopularityCheckBox').disabled=false;
				document.getElementById('autocompleteShowAddressbookCheckBox').disabled=false;
				document.getElementById('autocompleteWithColorCheckBox').disabled=false;
			} else {
				document.getElementById('autocompleteSortByPopularityCheckBox').disabled=true;
				document.getElementById('autocompleteShowAddressbookCheckBox').disabled=true;
				document.getElementById('autocompleteWithColorCheckBox').disabled=true;
			}
		},

		remindViaPopup: function () {
			if (document.getElementById('showPopupOnStartupCheckBox').checked || document.getElementById('showPeriodicPopupCheckBox').checked) {
				document.getElementById('showPopupEvenIfNoBirthdayCheckBox').disabled=false;
			} else {
				document.getElementById('showPopupEvenIfNoBirthdayCheckBox').disabled=true;
			}
			if (document.getElementById('showPeriodicPopupCheckBox').checked) {
				document.getElementById('periodicPopupTimeTextBox').disabled=false;
				document.getElementById('periodicPopupTimeLabel').disabled=false;
			} else {
				document.getElementById('periodicPopupTimeTextBox').disabled=true;
				document.getElementById('periodicPopupTimeLabel').disabled=true;
			}
		},

		wholeDay: function () {
			if (document.getElementById('calendarEntryWholeDayCheckBox').checked) {
				document.getElementById('calendarEntryTimeTextBox').disabled=true;
				document.getElementById('calendarEntryTimeLabel').disabled=true;
			} else {
				document.getElementById('calendarEntryTimeTextBox').disabled=false;
				document.getElementById('calendarEntryTimeLabel').disabled=false;
			}
		},

		LightningInstallation: function (aValue) {
			document.getElementById('calendarsGoupbox').disabled = aValue;
			document.getElementById('calendarsCheckbox').disabled = aValue;
			document.getElementById('calendarsListbox').disabled = aValue;
			document.getElementById('numberOfDaysForWritingLabel').disabled = aValue;
			document.getElementById('numberOfDaysForWritingTextBox').disabled = aValue;
			document.getElementById('syncWithLightningOnStartupCheckBox').disabled = aValue;
			document.getElementById('calendarEntryTitleLabel').disabled = aValue;
			document.getElementById('calendarEntryTitleTextBox').disabled = aValue;
			if (!aValue) {
				if (document.getElementById('calendarEntryWholeDayCheckBox').checked) {
					document.getElementById('calendarEntryTimeTextBox').disabled=true;
					document.getElementById('calendarEntryTimeLabel').disabled=true;
				} else {
					document.getElementById('calendarEntryTimeTextBox').disabled=false;
					document.getElementById('calendarEntryTimeLabel').disabled=false;
				}
			} else {
				document.getElementById('calendarEntryWholeDayCheckBox').disabled = aValue;
				document.getElementById('calendarEntryTimeLabel').disabled = aValue;
				document.getElementById('calendarEntryTimeTextBox').disabled = aValue;
			}
			document.getElementById('calendarEntryAlarmLabel').disabled = aValue;
			document.getElementById('calendarEntryAlarmTextBox').disabled = aValue;
			document.getElementById('calendarEntryCategoriesLabel').disabled = aValue;
			document.getElementById('calendarEntryCategoriesTextBox').disabled = aValue;
		},

		changeCalendarsPref: function () {
			var aCheckBox = document.getElementById('calendarsCheckbox');
			var aListBox = document.getElementById('calendarsListbox');
			var calendarsNameList = [];
			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				aItem.setAttribute('checked', aCheckBox.checked);
				if (aCheckBox.checked) {
					calendarsNameList.push(aItem.getAttribute('value'));
				}
			}
			var aPref = document.getElementById('extensions.cardbook.calendarsNameList');
			aPref.value = calendarsNameList.join(',');
		},

		changeCalendarPref: function () {
			var aCheckBox = document.getElementById('calendarsCheckbox');
			var aListBox = document.getElementById('calendarsListbox');
			var calendarsNameList = [];
			var totalChecked = 0;
			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				var aItemChecked = aItem.getAttribute('checked');
				aItemChecked = typeof aItemChecked == "boolean" ? aItemChecked : (aItemChecked == 'true' ? true : false);
				if (aItemChecked) {
					totalChecked++;
					calendarsNameList.push(aItem.getAttribute('value'));
				}
			}
			if (totalChecked === aListBox.itemCount) {
				aCheckBox.checked = true;
			} else {
				aCheckBox.checked = false;
			}
			var aPref = document.getElementById('extensions.cardbook.calendarsNameList');
			aPref.value = calendarsNameList.join(',');
		},
		
		loadCalendars: function (addon) {
			if (addon && addon.isActive) {
				var aCheckBox = document.getElementById('calendarsCheckbox');
				var aListBox = document.getElementById('calendarsListbox');
				var aPref = document.getElementById('extensions.cardbook.calendarsNameList');
		
				var sortedCalendars = [];
				var calendarManager = Components.classes["@mozilla.org/calendar/manager;1"].getService(Components.interfaces.calICalendarManager);
				var calendars = calendarManager.getCalendars({});
				for (var prop in calendars) {
					var cal = calendars[prop];
					sortedCalendars.push([cal.name, cal.id]);
				}
				sortedCalendars = cardbookUtils.sortArrayByString(sortedCalendars,0,1);
		
				var totalChecked = 0;
				for (var i = 0; i < sortedCalendars.length; i++) {
					var aItem = aListBox.appendItem(sortedCalendars[i][0], sortedCalendars[i][1]);
					aItem.setAttribute('type', 'checkbox');
					if (aPref.value.includes(sortedCalendars[i][1])) {
						totalChecked++;
						aItem.setAttribute('checked', true);
					} else {
						aItem.setAttribute('checked', false);
					}
					aItem.addEventListener("command", function(event) {
							wdw_cardbookConfiguration.changeCalendarPref();
						}, false);
					}
				if (totalChecked === aListBox.itemCount) {
					aCheckBox.checked = true;
				} else {
					aCheckBox.checked = false;
				}
				wdw_cardbookConfiguration.LightningInstallation(false);
			} else {
				wdw_cardbookConfiguration.LightningInstallation(true);
			}
		},
	
		changeAddressBooksPref: function (aCheckboxName) {
			var aCheckBox = document.getElementById(aCheckboxName);
			var aListBox = document.getElementById(aCheckboxName.replace('Checkbox', 'Listbox'));
			var addressBooksNameList = [];

			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				aItem.setAttribute('checked', aCheckBox.checked);
				if (aCheckBox.checked) {
					addressBooksNameList.push(aItem.getAttribute('value'));
				}
			}

			var aPref = document.getElementById('extensions.cardbook.' + aCheckboxName.replace('Checkbox', ''));
			aPref.value = addressBooksNameList.join(',');
		},

		changeAddressBookPref: function (aCheckboxName) {
			var aCheckBox = document.getElementById(aCheckboxName);
			var aListBox = document.getElementById(aCheckboxName.replace('Checkbox', 'Listbox'));
			var addressBooksNameList = [];
			var totalChecked = 0;

			for (var i=0; i<aListBox.itemCount; i++) {
				var aItem = aListBox.getItemAtIndex(i);
				var aItemChecked = aItem.getAttribute('checked');
				aItemChecked = typeof aItemChecked == "boolean" ? aItemChecked : (aItemChecked == 'true' ? true : false);
				if (aItemChecked) {
					totalChecked++;
					addressBooksNameList.push(aItem.getAttribute('value'));
				}
			}
			
			if (totalChecked === aListBox.itemCount) {
				aCheckBox.checked = true;
			} else {
				aCheckBox.checked = false;
			}

			var aPref = document.getElementById('extensions.cardbook.' + aCheckboxName.replace('Checkbox', ''));
			aPref.value = addressBooksNameList.join(',');
		},
		
		loadAddressBooks: function (aType, aNotReadOnly) {
			var aCheckBox = document.getElementById(aType + 'Checkbox');
			var aListBox = document.getElementById(aType + 'Listbox');
			var aPref = document.getElementById('extensions.cardbook.' + aType);

			var sortedAddressBooks = [];
			for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
				if (aNotReadOnly) {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && !cardbookRepository.cardbookAccounts[i][7] && (cardbookRepository.cardbookAccounts[i][6] !== "SEARCH")) {
						sortedAddressBooks.push([cardbookRepository.cardbookAccounts[i][0], cardbookRepository.cardbookAccounts[i][4]]);
					}
				} else {
					if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && (cardbookRepository.cardbookAccounts[i][6] !== "SEARCH")) {
						sortedAddressBooks.push([cardbookRepository.cardbookAccounts[i][0], cardbookRepository.cardbookAccounts[i][4]]);
					}
				}
			}
			sortedAddressBooks = cardbookUtils.sortArrayByString(sortedAddressBooks,0,1);

			var totalChecked = 0;
			for (var i = 0; i < sortedAddressBooks.length; i++) {
				var aItem = aListBox.appendItem(sortedAddressBooks[i][0], sortedAddressBooks[i][1]);
				aItem.setAttribute('id', aCheckBox.id + '_' + i);
				aItem.setAttribute('type', 'checkbox');
				if ( (aPref.value.includes(sortedAddressBooks[i][1])) || (aPref.value === "allAddressBooks") ) {
					totalChecked++;
					aItem.setAttribute('checked', true);
				} else {
					aItem.setAttribute('checked', false);
				}
				aItem.addEventListener("command", function(event) {
						var myCheckBoxIdArray = this.id.split('_');
						wdw_cardbookConfiguration.changeAddressBookPref(myCheckBoxIdArray[0]);
					}, false);
			}
			if (totalChecked === aListBox.itemCount) {
				aCheckBox.checked = true;
			} else {
				aCheckBox.checked = false;
			}
			if (aNotReadOnly) {
			}
		},

		validateEventEntryTitle: function () {
			var checkTest = document.getElementById('calendarEntryTitleTextBox').value.split("%S").length - 1;
			if (checkTest != 2) {
				var strBundle = document.getElementById("cardbook-strings");
				var prompts = Services.prompt;
				var errorTitle = strBundle.getString("eventEntryTitleProblemTitle");
				var errorMsg = strBundle.getString("eventEntryTitleProblemMessage") + ' (' + strBundle.getString("eventEntryTitleMessage") + ').';
				prompts.alert(null, errorTitle, errorMsg);
				var prefs = Services.prefs;
				var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
				str.data = strBundle.getString("eventEntryTitleMessage");
				prefs.setComplexValue("extensions.cardbook.eventEntryTitle", Components.interfaces.nsISupportsString, str);
			}
		},

		//needed for linux
		addAcceptButton: function(e) {
			var buttonAccept = document.documentElement.getButton('accept');
			buttonAccept.hidden = false;
			buttonAccept.disabled = false;
		},

		selectOrg: function() {
			var btnEdit = document.getElementById("renameOrgLabel");
			var btnUp = document.getElementById("upOrgLabel");
			var btnDown = document.getElementById("downOrgLabel");
			var myListBox = document.getElementById("orgListbox");
			if (myListBox.selectedCount > 0) {
				btnEdit.disabled = false;
				if (wdw_cardbookConfiguration.allOrg.length > 1) {
					if (myListBox.selectedIndex == 0) {
						btnUp.disabled = true;
					} else {
						btnUp.disabled = false;
					}
					if (myListBox.selectedIndex == wdw_cardbookConfiguration.allOrg.length-1) {
						btnDown.disabled = true;
					} else {
						btnDown.disabled = false;
					}
				} else {
					btnUp.disabled = true;
					btnDown.disabled = true;
				}
			} else {
				btnEdit.disabled = true;
				btnUp.disabled = true;
				btnDown.disabled = true;
			}
			document.getElementById("deleteOrgLabel").disabled = btnEdit.disabled;
		},

		refreshListBoxOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			var count = myListBox.itemCount;
			while(count-- > 0){
				myListBox.removeItemAt(0);
			}
			
			if (wdw_cardbookConfiguration.allOrg.length != 0) {
				for (var i = 0; i < wdw_cardbookConfiguration.allOrg.length; i++) {
					var aItem = myListBox.appendItem(wdw_cardbookConfiguration.allOrg[i], wdw_cardbookConfiguration.allOrg[i]);
				}
			}
		},

		loadOrg: function () {
			var prefs = Services.prefs;
			var orgStructure = prefs.getComplexValue("extensions.cardbook.orgStructure", Components.interfaces.nsISupportsString).data;
			if (orgStructure != "") {
				wdw_cardbookConfiguration.allOrg = cardbookUtils.unescapeArray(cardbookUtils.escapeString(orgStructure).split(";"));
			} else {
				wdw_cardbookConfiguration.allOrg = [];
			}
		},
		
		displayOrg: function () {
			wdw_cardbookConfiguration.refreshListBoxOrg();
		},
		
		upOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			if (myListBox.selectedIndex == -1) {
				return;
			} else {
				var temp = wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex-1];
				wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex-1] = wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex];
				wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex] = temp;
				wdw_cardbookConfiguration.refreshListBoxOrg();
				wdw_cardbookConfiguration.loadFnFormula();
			}
		},

		downOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			if (myListBox.selectedIndex == -1) {
				return;
			} else {
				var temp = wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex+1];
				wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex+1] = wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex];
				wdw_cardbookConfiguration.allOrg[myListBox.selectedIndex] = temp;
				wdw_cardbookConfiguration.refreshListBoxOrg();
				wdw_cardbookConfiguration.loadFnFormula();
			}
		},

		addOrg: function () {
			var myValidationList = JSON.parse(JSON.stringify(wdw_cardbookConfiguration.allOrg));
			var myArgs = {type: "", context: "Org", typeAction: "", validationList: myValidationList};
			var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookRenameField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE" && myArgs.type != "") {
				var myListBox = document.getElementById('orgListbox');
				wdw_cardbookConfiguration.allOrg = [];
				for (var i = 0; i < myListBox.itemCount; i++) {
					wdw_cardbookConfiguration.allOrg.push(myListBox.getItemAtIndex(i).getAttribute("value"));
				}
				wdw_cardbookConfiguration.allOrg.push(myArgs.type);
				wdw_cardbookConfiguration.refreshListBoxOrg();
				wdw_cardbookConfiguration.loadFnFormula();
			}
		},
		
		renameOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			if (myListBox.selectedIndex == -1) {
				return;
			} else {
				var myValue = myListBox.getSelectedItem(0).getAttribute("value");
				var myValidationList = JSON.parse(JSON.stringify(wdw_cardbookConfiguration.allOrg));
				function filterOriginal(element) {
					return (element != myValue);
				}
				myValidationList = myValidationList.filter(filterOriginal);
				var myArgs = {type: myValue, context: "Org", typeAction: "", validationList: myValidationList};
				var myWindow = window.openDialog("chrome://cardbook/content/wdw_cardbookRenameField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE" && myArgs.type != "") {
					wdw_cardbookConfiguration.allOrg = [];
					for (let i = 0; i < myListBox.itemCount; i++) {
						if (i === myListBox.selectedIndex) {
							wdw_cardbookConfiguration.allOrg.push(myArgs.type);
						} else {
							wdw_cardbookConfiguration.allOrg.push(myListBox.getItemAtIndex(i).getAttribute("value"));
						}
					}
					wdw_cardbookConfiguration.refreshListBoxOrg();
					wdw_cardbookConfiguration.loadFnFormula();
				}
			}
		},
		
		deleteOrg: function () {
			var myListBox = document.getElementById('orgListbox');
			if (myListBox.selectedIndex == -1) {
				return;
			} else {
				wdw_cardbookConfiguration.allOrg = [];
				for (let i = 0; i < myListBox.itemCount; i++) {
					if (i !== myListBox.selectedIndex) {
						wdw_cardbookConfiguration.allOrg.push(myListBox.getItemAtIndex(i).getAttribute("value"));
					}
				}
				wdw_cardbookConfiguration.refreshListBoxOrg();
				wdw_cardbookConfiguration.loadFnFormula();
			}
		},
		
		validateOrg: function () {
			var prefs = Services.prefs;
			var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
			str.data = cardbookUtils.unescapeStringSemiColon(cardbookUtils.escapeArraySemiColon(wdw_cardbookConfiguration.allOrg).join(";"));
			prefs.setComplexValue("extensions.cardbook.orgStructure", Components.interfaces.nsISupportsString, str);
		},

		loadPref: function () {
			if (document.getElementById('preferenceValueTextbox').value == "") {
				var cardbookPrefService = new cardbookPreferenceService();
				document.getElementById('preferenceValueTextbox').value = cardbookPrefService.getPrefValueLabel();
			}
		},

		getEmailAccountName: function(aEmailAccountId) {
			if (aEmailAccountId == "allMailAccounts") {
				var strBundle = document.getElementById("cardbook-strings");
				return strBundle.getString(aEmailAccountId);
			}
			var accounts = MailServices.accounts.accounts;
			var accountsLength = (typeof accounts.Count === 'undefined') ? accounts.length : accounts.Count();
			for (var i = 0; i < accountsLength; i++) {
				var account = accounts.queryElementAt ? accounts.queryElementAt(i, Components.interfaces.nsIMsgAccount) : accounts.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgAccount);
				if (!account.incomingServer) {
					continue;
				}
				var identitiesLength = (typeof account.identities.Count === 'undefined') ? account.identities.length : account.identities.Count();
				for (var j = 0; j < identitiesLength; j++) {
					var identity = account.identities.queryElementAt ? account.identities.queryElementAt(j, Components.interfaces.nsIMsgIdentity) : account.identities.GetElementAt(j).QueryInterface(Components.interfaces.nsIMsgIdentity);
					var mailAccountServer = account.incomingServer;
					if (mailAccountServer.type == "pop3" || mailAccountServer.type == "imap") {
						if (aEmailAccountId == identity.key) {
							return identity.email;
						}
					}
				}
			}
			return "";			
		},

		getABName: function(dirPrefId) {
			var prefs = Services.prefs;
			if (!prefs.getBoolPref("extensions.cardbook.exclusive")) {
				var contactManager = MailServices.ab;
				var contacts = contactManager.directories;
				while ( contacts.hasMoreElements() ) {
					var contact = contacts.getNext().QueryInterface(Components.interfaces.nsIAbDirectory);
					if (contact.dirPrefId == dirPrefId) {
						return contact.dirName;
					}
				}
			}
			return cardbookUtils.getPrefNameFromPrefId(dirPrefId);
		},

		selectVCard: function() {
			var btnEdit = document.getElementById("renameVCardLabel");
			var myTree = document.getElementById("accountsVCardsTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteVCardLabel").disabled = btnEdit.disabled;
		},

		loadVCards: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			var result = [];
			result = cardbookPrefService.getAllVCards();
			var count = 0;
			for (var i = 0; i < result.length; i++) {
				var resultArray = result[i].split("::");
				var emailAccountName = wdw_cardbookConfiguration.getEmailAccountName(resultArray[1]);
				if (emailAccountName != "") {
					if (cardbookRepository.cardbookCards[resultArray[2]+"::"+resultArray[3]]) {
						var index = count++;
						var myFn = cardbookRepository.cardbookCards[resultArray[2]+"::"+resultArray[3]].fn;
						wdw_cardbookConfiguration.allVCards.push([(resultArray[0] == "true"), index.toString(), emailAccountName, resultArray[1], myFn, resultArray[2], resultArray[3], resultArray[4]]);
					}
				}
			}
		},
		
		displayVCards: function () {
			var accountsVCardsTreeView = {
				get rowCount() { return wdw_cardbookConfiguration.allVCards.length; },
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) {
					if (column.id == "accountsVCardsEnabled") return true;
					else return false;
				},
				getCellText: function(idx, column) {
					if (column.id == "accountsVCardsEnabled") return wdw_cardbookConfiguration.allVCards[idx][0];
					else if (column.id == "accountsVCardsId") return wdw_cardbookConfiguration.allVCards[idx][1];
					else if (column.id == "accountsVCardsMailName") return wdw_cardbookConfiguration.allVCards[idx][2];
					else if (column.id == "accountsVCardsMailId") return wdw_cardbookConfiguration.allVCards[idx][3];
					else if (column.id == "accountsVCardsFn") return wdw_cardbookConfiguration.allVCards[idx][4];
					else if (column.id == "accountsVCardsAddressBookId") return wdw_cardbookConfiguration.allVCards[idx][5];
					else if (column.id == "accountsVCardsContactId") return wdw_cardbookConfiguration.allVCards[idx][6];
					else if (column.id == "accountsVCardsFileName") return wdw_cardbookConfiguration.allVCards[idx][7];
				},
				getCellValue: function(idx, column) {
					if (column.id == "accountsVCardsEnabled") return wdw_cardbookConfiguration.allVCards[idx][0];
				},
				setCellValue: function(idx, column) {
					if (column.id == "accountsVCardsEnabled") {
						wdw_cardbookConfiguration.allVCards[idx][0] = !wdw_cardbookConfiguration.allVCards[idx][0];
					}
				}
			}
			document.getElementById('accountsVCardsTree').view = accountsVCardsTreeView;
			wdw_cardbookConfiguration.selectVCard();
		},
		
		addVCard: function () {
			var myArgs = {emailAccountName: "", emailAccountId: "", fn: "", addressBookId: "", contactId: "", fileName: "",  typeAction: ""};
			var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddVcards.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				wdw_cardbookConfiguration.allVCards.push([true, wdw_cardbookConfiguration.allVCards.length.toString(), myArgs.emailAccountName, myArgs.emailAccountId, myArgs.fn, myArgs.addressBookId, myArgs.contactId, myArgs.fileName]);
				wdw_cardbookConfiguration.allVCards = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allVCards,1,1);
				wdw_cardbookConfiguration.sortTrees(null, "accountsVCardsTree");
			}
		},
		
		renameVCard: function () {
			var myTree = document.getElementById('accountsVCardsTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myEnabled = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsEnabled"});
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsId"});
				var myMailName = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsMailName"});
				var myMailId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsMailId"});
				var myFn = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsFn"});
				var myABDirPrefId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsAddressBookId"});
				var myContactId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsContactId"});
				var myFileName = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsFileName"});
				var myArgs = {emailAccountName: myMailName, emailAccountId: myMailId, fn: myFn, addressBookId: myABDirPrefId, contactId: myContactId, fileName: myFileName, typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddVcards.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					for (let i = 0; i < wdw_cardbookConfiguration.allVCards.length; i++) {
						if (myId === wdw_cardbookConfiguration.allVCards[i][1]) {
							result.push([myEnabled, myId, myArgs.emailAccountName, myArgs.emailAccountId, myArgs.fn, myArgs.addressBookId, myArgs.contactId, myArgs.fileName]);
						} else {
							result.push(wdw_cardbookConfiguration.allVCards[i]);
						}
					}
					wdw_cardbookConfiguration.allVCards = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.allVCards = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allVCards,1,1);
					wdw_cardbookConfiguration.sortTrees(null, "accountsVCardsTree");
				}
			}
		},
		
		deleteVCard: function () {
			var myTree = document.getElementById('accountsVCardsTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsVCardsId"});
				var result = [];
				for (let i = 0; i < wdw_cardbookConfiguration.allVCards.length; i++) {
					if (myId !== wdw_cardbookConfiguration.allVCards[i][1]) {
						result.push(wdw_cardbookConfiguration.allVCards[i]);
					}
				}
				wdw_cardbookConfiguration.allVCards = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "accountsVCardsTree");
			}
		},
		
		validateVCards: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delVCards();
			for (var i = 0; i < wdw_cardbookConfiguration.allVCards.length; i++) {
				cardbookPrefService.setVCard(i.toString(), wdw_cardbookConfiguration.allVCards[i][0].toString() + "::" + wdw_cardbookConfiguration.allVCards[i][3]
													+ "::" + wdw_cardbookConfiguration.allVCards[i][5] + "::" + wdw_cardbookConfiguration.allVCards[i][6] + "::" + wdw_cardbookConfiguration.allVCards[i][7]);
			}
		},

		selectRestriction: function() {
			var btnEdit = document.getElementById("renameRestrictionLabel");
			var myTree = document.getElementById("accountsRestrictionsTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteRestrictionLabel").disabled = btnEdit.disabled;
		},

		loadRestrictions: function () {
			var strBundle = document.getElementById("cardbook-strings");
			var cardbookPrefService = new cardbookPreferenceService();
			var result = [];
			result = cardbookPrefService.getAllRestrictions();
			var count = 0;
			for (var i = 0; i < result.length; i++) {
				var resultArray = result[i].split("::");
				var emailAccountName = wdw_cardbookConfiguration.getEmailAccountName(resultArray[2]);
				if (emailAccountName != "") {
					var ABName = wdw_cardbookConfiguration.getABName(resultArray[3]);
					if (ABName != "") {
						var index = count++;
						if (resultArray[4] && resultArray[4] != null && resultArray[4] !== undefined && resultArray[4] != "") {
							var categoryId = resultArray[3] + "::" + resultArray[4];
							var categoryName = resultArray[4];
						} else {
							var categoryId = "";
							var categoryName = "";
						}
						wdw_cardbookConfiguration.allRestrictions.push([(resultArray[0] == "true"), index.toString(), emailAccountName, resultArray[2],
																		ABName, resultArray[3], categoryName, categoryId, strBundle.getString(resultArray[1] + "Label"), resultArray[1]]);
					}
				}
			}
		},
		
		displayRestrictions: function () {
			var accountsRestrictionsTreeView = {
				get rowCount() { return wdw_cardbookConfiguration.allRestrictions.length; },
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) {
					if (column.id == "accountsRestrictionsEnabled") return true;
					else return false;
				},
				getCellText: function(idx, column) {
					if (column.id == "accountsRestrictionsEnabled") return wdw_cardbookConfiguration.allRestrictions[idx][0];
					else if (column.id == "accountsRestrictionsId") return wdw_cardbookConfiguration.allRestrictions[idx][1];
					else if (column.id == "accountsRestrictionsMailName") return wdw_cardbookConfiguration.allRestrictions[idx][2];
					else if (column.id == "accountsRestrictionsMailId") return wdw_cardbookConfiguration.allRestrictions[idx][3];
					else if (column.id == "accountsRestrictionsABName") return wdw_cardbookConfiguration.allRestrictions[idx][4];
					else if (column.id == "accountsRestrictionsDirPrefId") return wdw_cardbookConfiguration.allRestrictions[idx][5];
					else if (column.id == "accountsRestrictionsCatName") return wdw_cardbookConfiguration.allRestrictions[idx][6];
					else if (column.id == "accountsRestrictionsCatId") return wdw_cardbookConfiguration.allRestrictions[idx][7];
					else if (column.id == "accountsRestrictionsIncludeName") return wdw_cardbookConfiguration.allRestrictions[idx][8];
					else if (column.id == "accountsRestrictionsIncludeCode") return wdw_cardbookConfiguration.allRestrictions[idx][9];
				},
				getCellValue: function(idx, column) {
					if (column.id == "accountsRestrictionsEnabled") return wdw_cardbookConfiguration.allRestrictions[idx][0];
				},
				setCellValue: function(idx, column) {
					if (column.id == "accountsRestrictionsEnabled") {
						wdw_cardbookConfiguration.allRestrictions[idx][0] = !wdw_cardbookConfiguration.allRestrictions[idx][0];
					}
				}
			}
			document.getElementById('accountsRestrictionsTree').view = accountsRestrictionsTreeView;
			wdw_cardbookConfiguration.selectRestriction();
		},
		
		addRestriction: function () {
			var myArgs = {emailAccountId: "", emailAccountName: "", addressBookId: "", addressBookName: "", categoryName: "", includeName: "",  includeCode: "", typeAction: "", context: "Restriction"};
			var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddEmails.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				wdw_cardbookConfiguration.allRestrictions.push([true, wdw_cardbookConfiguration.allRestrictions.length.toString(), myArgs.emailAccountName, myArgs.emailAccountId,
																myArgs.addressBookName, myArgs.addressBookId, myArgs.categoryName, myArgs.categoryId, myArgs.includeName, myArgs.includeCode]);
				wdw_cardbookConfiguration.allRestrictions = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allRestrictions,1,1);
				wdw_cardbookConfiguration.sortTrees(null, "accountsRestrictionsTree");
			}
		},
		
		renameRestriction: function () {
			var myTree = document.getElementById('accountsRestrictionsTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myEnabled = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsEnabled"});
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsId"});
				var myMailId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsMailId"});
				var myMailName = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsMailName"});
				var myABName = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsABName"});
				var myABDirPrefId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsDirPrefId"});
				var myCatName = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsCatName"});
				var myCatId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsCatId"});
				var myIncludeName = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsIncludeName"});
				var myIncludeCode = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsIncludeCode"});
				var myArgs = {emailAccountId: myMailId, emailAccountName: myMailName, addressBookId: myABDirPrefId, addressBookName: myABName, categoryId: myCatId, categoryName: myCatName,
								includeName: myIncludeName, includeCode: myIncludeCode, typeAction: "", context: "Restriction"};
				var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddEmails.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					for (let i = 0; i < wdw_cardbookConfiguration.allRestrictions.length; i++) {
						if (myId === wdw_cardbookConfiguration.allRestrictions[i][1]) {
							result.push([myEnabled, myId, myArgs.emailAccountName, myArgs.emailAccountId, myArgs.addressBookName, myArgs.addressBookId, myArgs.categoryName, myArgs.categoryId,
										myArgs.includeName, myArgs.includeCode]);
						} else {
							result.push(wdw_cardbookConfiguration.allRestrictions[i]);
						}
					}
					wdw_cardbookConfiguration.allRestrictions = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.allRestrictions = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allRestrictions,1,1);
					wdw_cardbookConfiguration.sortTrees(null, "accountsRestrictionsTree");
				}
			}
		},
		
		deleteRestriction: function () {
			var myTree = document.getElementById('accountsRestrictionsTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "accountsRestrictionsId"});
				var result = [];
				for (let i = 0; i < wdw_cardbookConfiguration.allRestrictions.length; i++) {
					if (myId !== wdw_cardbookConfiguration.allRestrictions[i][1]) {
						result.push(wdw_cardbookConfiguration.allRestrictions[i]);
					}
				}
				wdw_cardbookConfiguration.allRestrictions = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "accountsRestrictionsTree");
			}
		},
		
		validateRestrictions: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delRestrictions();
			for (var i = 0; i < wdw_cardbookConfiguration.allRestrictions.length; i++) {
				cardbookPrefService.setRestriction(i.toString(), wdw_cardbookConfiguration.allRestrictions[i][0].toString() + "::" + wdw_cardbookConfiguration.allRestrictions[i][9]
													+ "::" + wdw_cardbookConfiguration.allRestrictions[i][3] + "::" + wdw_cardbookConfiguration.allRestrictions[i][5] + "::" + wdw_cardbookConfiguration.allRestrictions[i][6]);
			}
		},

		selectEmailsCollection: function() {
			var btnEdit = document.getElementById("renameEmailsCollectionLabel");
			var myTree = document.getElementById("emailsCollectionTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteEmailsCollectionLabel").disabled = btnEdit.disabled;
		},

		loadEmailsCollection: function () {
			var strBundle = document.getElementById("cardbook-strings");
			var cardbookPrefService = new cardbookPreferenceService();
			var result = [];
			result = cardbookPrefService.getAllEmailsCollections();
			var count = 0;
			for (var i = 0; i < result.length; i++) {
				var resultArray = result[i].split("::");
				var emailAccountName = wdw_cardbookConfiguration.getEmailAccountName(resultArray[2]);
				if (emailAccountName != "") {
					var ABName = wdw_cardbookConfiguration.getABName(resultArray[3]);
					if (ABName != "") {
						var index = count++;
						if (resultArray[4] && resultArray[4] != null && resultArray[4] !== undefined && resultArray[4] != "") {
							var categoryId = resultArray[3] + "::" + resultArray[4];
							var categoryName = resultArray[4];
						} else {
							var categoryId = "";
							var categoryName = "";
						}
						wdw_cardbookConfiguration.allEmailsCollections.push([(resultArray[0] == "true"), index.toString(), emailAccountName, resultArray[2],
																		ABName, resultArray[3], categoryName, categoryId, strBundle.getString(resultArray[1] + "Label"), resultArray[1]]);
					}
				}
			}
		},
		
		displayEmailsCollection: function () {
			var emailsCollectionTreeView = {
				get rowCount() { return wdw_cardbookConfiguration.allEmailsCollections.length; },
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) {
					if (column.id == "emailsCollectionEnabled") return true;
					else return false;
				},
				getCellText: function(idx, column) {
					if (column.id == "emailsCollectionEnabled") return wdw_cardbookConfiguration.allEmailsCollections[idx][0];
					else if (column.id == "emailsCollectionId") return wdw_cardbookConfiguration.allEmailsCollections[idx][1];
					else if (column.id == "emailsCollectionMailName") return wdw_cardbookConfiguration.allEmailsCollections[idx][2];
					else if (column.id == "emailsCollectionMailId") return wdw_cardbookConfiguration.allEmailsCollections[idx][3];
					else if (column.id == "emailsCollectionABName") return wdw_cardbookConfiguration.allEmailsCollections[idx][4];
					else if (column.id == "emailsCollectionDirPrefId") return wdw_cardbookConfiguration.allEmailsCollections[idx][5];
					else if (column.id == "emailsCollectionCatName") return wdw_cardbookConfiguration.allEmailsCollections[idx][6];
					else if (column.id == "emailsCollectionCatId") return wdw_cardbookConfiguration.allEmailsCollections[idx][7];
					else if (column.id == "emailsCollectionIncludeName") return wdw_cardbookConfiguration.allEmailsCollections[idx][8];
					else if (column.id == "emailsCollectionIncludeCode") return wdw_cardbookConfiguration.allEmailsCollections[idx][9];
				},
				getCellValue: function(idx, column) {
					if (column.id == "emailsCollectionEnabled") return wdw_cardbookConfiguration.allEmailsCollections[idx][0];
				},
				setCellValue: function(idx, column) {
					if (column.id == "emailsCollectionEnabled") {
						wdw_cardbookConfiguration.allEmailsCollections[idx][0] = !wdw_cardbookConfiguration.allEmailsCollections[idx][0];
					}
				}
			}
			document.getElementById('emailsCollectionTree').view = emailsCollectionTreeView;
			wdw_cardbookConfiguration.selectEmailsCollection();
		},
		
		addEmailsCollection: function () {
			var myArgs = {emailAccountId: "", emailAccountName: "", addressBookId: "", addressBookName: "", categoryName: "", includeName: "",  includeCode: "", typeAction: "", context: "Collection"};
			var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddEmails.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				wdw_cardbookConfiguration.allEmailsCollections.push([true, wdw_cardbookConfiguration.allEmailsCollections.length.toString(), myArgs.emailAccountName, myArgs.emailAccountId,
																myArgs.addressBookName, myArgs.addressBookId, myArgs.categoryName, myArgs.categoryId, myArgs.includeName, myArgs.includeCode]);
				wdw_cardbookConfiguration.allEmailsCollections = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allEmailsCollections,1,1);
				wdw_cardbookConfiguration.sortTrees(null, "emailsCollectionTree");
			}
		},
		
		renameEmailsCollection: function () {
			var myTree = document.getElementById('emailsCollectionTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myEnabled = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionEnabled"});
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionId"});
				var myMailId = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionMailId"});
				var myMailName = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionMailName"});
				var myABName = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionABName"});
				var myABDirPrefId = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionDirPrefId"});
				var myCatName = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionCatName"});
				var myCatId = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionCatId"});
				var myIncludeName = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionIncludeName"});
				var myIncludeCode = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionIncludeCode"});
				var myArgs = {emailAccountId: myMailId, emailAccountName: myMailName, addressBookId: myABDirPrefId, addressBookName: myABName, categoryId: myCatId, categoryName: myCatName,
								includeName: myIncludeName, includeCode: myIncludeCode, typeAction: "", context: "Collection"};
				var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddEmails.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					for (let i = 0; i < wdw_cardbookConfiguration.allEmailsCollections.length; i++) {
						if (myId === wdw_cardbookConfiguration.allEmailsCollections[i][1]) {
							result.push([myEnabled, myId, myArgs.emailAccountName, myArgs.emailAccountId, myArgs.addressBookName, myArgs.addressBookId, myArgs.categoryName, myArgs.categoryId,
										myArgs.includeName, myArgs.includeCode]);
						} else {
							result.push(wdw_cardbookConfiguration.allEmailsCollections[i]);
						}
					}
					wdw_cardbookConfiguration.allEmailsCollections = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.allEmailsCollections = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allEmailsCollections,1,1);
					wdw_cardbookConfiguration.sortTrees(null, "emailsCollectionTree");
				}
			}
		},
		
		deleteEmailsCollection: function () {
			var myTree = document.getElementById('emailsCollectionTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "emailsCollectionId"});
				var result = [];
				for (let i = 0; i < wdw_cardbookConfiguration.allEmailsCollections.length; i++) {
					if (myId !== wdw_cardbookConfiguration.allEmailsCollections[i][1]) {
						result.push(wdw_cardbookConfiguration.allEmailsCollections[i]);
					}
				}
				wdw_cardbookConfiguration.allEmailsCollections = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "emailsCollectionTree");
			}
		},
		
		validateEmailsCollection: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delEmailsCollection();
			for (var i = 0; i < wdw_cardbookConfiguration.allEmailsCollections.length; i++) {
				cardbookPrefService.setEmailsCollection(i.toString(), wdw_cardbookConfiguration.allEmailsCollections[i][0].toString() + "::" + wdw_cardbookConfiguration.allEmailsCollections[i][9]
													+ "::" + wdw_cardbookConfiguration.allEmailsCollections[i][3] + "::" + wdw_cardbookConfiguration.allEmailsCollections[i][5] + "::" + wdw_cardbookConfiguration.allEmailsCollections[i][6]);
			}
		},
		
		selectTypes: function() {
			var btnEdit = document.getElementById("renameTypeLabel");
			var myTree = document.getElementById("typesTree");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteTypeLabel").disabled = btnEdit.disabled;
		},

		loadTypes: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			wdw_cardbookConfiguration.allTypes = cardbookPrefService.getAllTypes();
		},
		
		displayTypes: function () {
			var typesTreeView = {
				typeField: document.getElementById('typesCategoryRadiogroup').selectedItem.value,
				get rowCount() {
					if (wdw_cardbookConfiguration.allTypes[this.typeField]) {
						return wdw_cardbookConfiguration.allTypes[this.typeField].length;
					} else {
						return 0;
					}
				},
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) { return false },
				getCellText: function(idx, column) {
					if (column.id == "typesCode") return wdw_cardbookConfiguration.allTypes[this.typeField][idx][0];
					else if (column.id == "typesLabel") return wdw_cardbookConfiguration.allTypes[this.typeField][idx][1];
					else if (column.id == "typesId") return wdw_cardbookConfiguration.allTypes[this.typeField][idx][2];
				}
			}
			document.getElementById('typesTree').view = typesTreeView;
			wdw_cardbookConfiguration.selectTypes();
		},
		
		addType: function () {
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			var myArgs = {code: "", label: "", typeAction: ""};
			var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddType.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				var result = [];
				var already = false;
				for (let i = 0; i < wdw_cardbookConfiguration.allTypes[type].length; i++) {
					if (myArgs.code.toLowerCase() === wdw_cardbookConfiguration.allTypes[type][i][0].toLowerCase()) {
						result.push([myArgs.code, myArgs.label, i]);
						already = true;
					} else {
						result.push([wdw_cardbookConfiguration.allTypes[type][i][0], wdw_cardbookConfiguration.allTypes[type][i][1], i]);
					}
				}
				if (!already) {
					result.push([myArgs.code, myArgs.label, wdw_cardbookConfiguration.allTypes[type].length]);
				}
				wdw_cardbookConfiguration.allTypes[type] = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.allTypes[type] = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allTypes[type],1,1);
				wdw_cardbookConfiguration.sortTrees(null, "typesTree");
			}
		},
		
		renameType: function () {
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('typesTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myCode = myTree.view.getCellText(myTree.currentIndex, {id: "typesCode"});
				var myLabel = myTree.view.getCellText(myTree.currentIndex, {id: "typesLabel"});
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "typesId"});
				var myArgs = {code: myCode, label: myLabel, typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddType.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					var already = false;
					for (let i = 0; i < wdw_cardbookConfiguration.allTypes[type].length; i++) {
						if (myArgs.code.toLowerCase() === wdw_cardbookConfiguration.allTypes[type][i][0].toLowerCase()) {
							result.push([myArgs.code, myArgs.label, i]);
							already = true;
						} else {
							result.push([wdw_cardbookConfiguration.allTypes[type][i][0], wdw_cardbookConfiguration.allTypes[type][i][1], i]);
						}
					}
					if (!already) {
						result = [];
						for (let i = 0; i < wdw_cardbookConfiguration.allTypes[type].length; i++) {
							if (myId == wdw_cardbookConfiguration.allTypes[type][i][2]) {
								result.push([myArgs.code, myArgs.label, i]);
							} else {
								result.push([wdw_cardbookConfiguration.allTypes[type][i][0], wdw_cardbookConfiguration.allTypes[type][i][1], i]);
							}
						}
					}
					wdw_cardbookConfiguration.allTypes[type] = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.allTypes[type] = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allTypes[type],1,1);
					wdw_cardbookConfiguration.sortTrees(null, "typesTree");
				}
			}
		},
		
		deleteType: function () {
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('typesTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "typesId"});
				var result = [];
				for (let i = 0; i < wdw_cardbookConfiguration.allTypes[type].length; i++) {
					if (myId != wdw_cardbookConfiguration.allTypes[type][i][2]) {
						result.push(wdw_cardbookConfiguration.allTypes[type][i]);
					}
				}
				wdw_cardbookConfiguration.allTypes[type] = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "typesTree");
			}
		},
		
		resetType: function () {
			var result = [];
			var strBundle = document.getElementById("cardbook-strings");
			var type = document.getElementById('typesCategoryRadiogroup').selectedItem.value;
			for (var i = 0; i < cardbookRepository.typesSeed[type].length; i++) {
				var myCode = cardbookRepository.typesSeed[type][i];
				var myLabel = strBundle.getString("types." + type + "." + myCode.toLowerCase());
				result.push([myCode, myLabel, i]);
			}
			wdw_cardbookConfiguration.allTypes[type] = JSON.parse(JSON.stringify(result));
			wdw_cardbookConfiguration.sortTrees(null, "typesTree");
		},
		
		validateTypes: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delTypes();
			for (var i in wdw_cardbookConfiguration.allTypes) {
				for (var j = 0; j < wdw_cardbookConfiguration.allTypes[i].length; j++) {
					cardbookPrefService.setTypes(i, j, wdw_cardbookConfiguration.allTypes[i][j][0] + ":" + wdw_cardbookConfiguration.allTypes[i][j][1]);
				}
			}
		},

		selectIMPPsCategory: function () {
			wdw_cardbookConfiguration.selectIMPPs();
			wdw_cardbookConfiguration.sortTrees(null, 'IMPPsTree');
		},
		
		selectIMPPs: function() {
			var myTree = document.getElementById("IMPPsTree");
			var type = document.getElementById('imppsCategoryRadiogroup').selectedItem.value;
			var btnAdd = document.getElementById("addIMPPLabel");
			btnAdd.disabled = false;
			if (type == "tel" && wdw_cardbookConfiguration.allIMPPs['tel'].length == 1) {
				btnAdd.disabled = true;
			}
			var btnEdit = document.getElementById("renameIMPPLabel");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
			} else {
				btnEdit.disabled = true;
			}
			document.getElementById("deleteIMPPLabel").disabled = btnEdit.disabled;
		},

		loadIMPPs: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			wdw_cardbookConfiguration.allIMPPs['impp'] = [];
			wdw_cardbookConfiguration.allIMPPs['impp'] = cardbookPrefService.getAllIMPPs();
			wdw_cardbookConfiguration.allIMPPs['tel'] = [];
			wdw_cardbookConfiguration.allIMPPs['tel'] = cardbookPrefService.getAllTels();
		},
		
		displayIMPPs: function () {
			var IMPPsTreeView = {
				typeField: document.getElementById('imppsCategoryRadiogroup').selectedItem.value,
				get rowCount() {
					if (wdw_cardbookConfiguration.allIMPPs[this.typeField]) {
						return wdw_cardbookConfiguration.allIMPPs[this.typeField].length;
					} else {
						return 0;
					}
				},
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) { return false },
				getCellText: function(idx, column) {
					if (column.id == "IMPPCode") return wdw_cardbookConfiguration.allIMPPs[this.typeField][idx][0];
					else if (column.id == "IMPPLabel") return wdw_cardbookConfiguration.allIMPPs[this.typeField][idx][1];
					else if (column.id == "IMPPProtocol") return wdw_cardbookConfiguration.allIMPPs[this.typeField][idx][2];
					else if (column.id == "IMPPId") return wdw_cardbookConfiguration.allIMPPs[this.typeField][idx][3];
				}
			}
			document.getElementById('IMPPsTree').view = IMPPsTreeView;
			wdw_cardbookConfiguration.selectIMPPs();
		},

		addIMPP: function () {
			var type = document.getElementById('imppsCategoryRadiogroup').selectedItem.value;
			var myArgs = {code: "", label: "", protocol: "", typeAction: ""};
			var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddIMPP.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				wdw_cardbookConfiguration.allIMPPs[type].push([myArgs.code, myArgs.label, myArgs.protocol, wdw_cardbookConfiguration.allIMPPs[type].length]);
				wdw_cardbookConfiguration.allIMPPs[type] = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allIMPPs[type],1,1);
				wdw_cardbookConfiguration.sortTrees(null, "IMPPsTree");
			}
		},
		
		renameIMPP: function () {
			var type = document.getElementById('imppsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('IMPPsTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myCode = myTree.view.getCellText(myTree.currentIndex, {id: "IMPPCode"});
				var myLabel = myTree.view.getCellText(myTree.currentIndex, {id: "IMPPLabel"});
				var myProtocol = myTree.view.getCellText(myTree.currentIndex, {id: "IMPPProtocol"});
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "IMPPId"});
				var myArgs = {code: myCode, label: myLabel, protocol: myProtocol, typeAction: ""};
				var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddIMPP.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					for (let i = 0; i < wdw_cardbookConfiguration.allIMPPs[type].length; i++) {
						if (myId == wdw_cardbookConfiguration.allIMPPs[type][i][3]) {
							result.push([myArgs.code, myArgs.label, myArgs.protocol, myId]);
						} else {
							result.push(wdw_cardbookConfiguration.allIMPPs[type][i]);
						}
					}
					wdw_cardbookConfiguration.allIMPPs[type] = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.allIMPPs[type] = cardbookUtils.sortArrayByString(wdw_cardbookConfiguration.allIMPPs[type],1,1);
					wdw_cardbookConfiguration.sortTrees(null, "IMPPsTree");
				}
			}
		},
		
		deleteIMPP: function () {
			var type = document.getElementById('imppsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('IMPPsTree');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "IMPPId"});
				var result = [];
				for (let i = 0; i < wdw_cardbookConfiguration.allIMPPs[type].length; i++) {
					if (myId != wdw_cardbookConfiguration.allIMPPs[type][i][3]) {
						result.push(wdw_cardbookConfiguration.allIMPPs[type][i]);
					}
				}
				wdw_cardbookConfiguration.allIMPPs[type] = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "IMPPsTree");
			}
		},
		
		validateIMPPs: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delIMPPs();
			for (var i in wdw_cardbookConfiguration.allIMPPs['impp']) {
				cardbookPrefService.setIMPPs(i, wdw_cardbookConfiguration.allIMPPs['impp'][i][0] + ":" + wdw_cardbookConfiguration.allIMPPs['impp'][i][1] + ":" + wdw_cardbookConfiguration.allIMPPs['impp'][i][2]);
			}
			cardbookPrefService.delTels();
			for (var i in wdw_cardbookConfiguration.allIMPPs['tel']) {
				cardbookPrefService.setTels(i, wdw_cardbookConfiguration.allIMPPs['tel'][i][0] + ":" + wdw_cardbookConfiguration.allIMPPs['tel'][i][1] + ":" + wdw_cardbookConfiguration.allIMPPs['tel'][i][2]);
			}
		},

		selectCustomFields: function() {
			var btnEdit = document.getElementById("renameCustomFieldsLabel");
			var btnUp = document.getElementById("upCustomFieldsLabel");
			var btnDown = document.getElementById("downCustomFieldsLabel");
			var type = document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById("customFields");
			if (myTree.view.selection.getRangeCount() > 0) {
				btnEdit.disabled = false;
				if (wdw_cardbookConfiguration.allCustomFields[type].length > 1) {
					if (myTree.currentIndex == 0) {
						btnUp.disabled = true;
					} else {
						btnUp.disabled = false;
					}
					if (myTree.currentIndex == wdw_cardbookConfiguration.allCustomFields[type].length-1) {
						btnDown.disabled = true;
					} else {
						btnDown.disabled = false;
					}
				} else {
					btnUp.disabled = true;
					btnDown.disabled = true;
				}
			} else {
				btnEdit.disabled = true;
				btnUp.disabled = true;
				btnDown.disabled = true;
			}
			document.getElementById("deleteCustomFieldsLabel").disabled = btnEdit.disabled;
		},

		loadCustomFields: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			wdw_cardbookConfiguration.allCustomFields = cardbookPrefService.getAllCustomFields();
		},
		
		displayCustomFields: function () {
			var customFieldsTreeView = {
				typeField: document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value,
				get rowCount() {
					if (wdw_cardbookConfiguration.allCustomFields[this.typeField]) {
						return wdw_cardbookConfiguration.allCustomFields[this.typeField].length;
					} else {
						return 0;
					}
				},
				isContainer: function(idx) { return false },
				cycleHeader: function(idx) { return false },
				isEditable: function(idx, column) { return false },
				getCellText: function(idx, column) {
					if (column.id == "customFieldsCode") return wdw_cardbookConfiguration.allCustomFields[this.typeField][idx][0];
					else if (column.id == "customFieldsLabel") return wdw_cardbookConfiguration.allCustomFields[this.typeField][idx][1];
					else if (column.id == "customFieldsRank") return wdw_cardbookConfiguration.allCustomFields[this.typeField][idx][2];
				}
			}
			document.getElementById('customFields').view = customFieldsTreeView;
			wdw_cardbookConfiguration.selectCustomFields();
		},
		
		upCustomFields: function () {
			var type = document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('customFields');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "customFieldsRank"})*1;
				var temp = [wdw_cardbookConfiguration.allCustomFields[type][myId-1][0], wdw_cardbookConfiguration.allCustomFields[type][myId-1][1], parseInt(myId)];
				wdw_cardbookConfiguration.allCustomFields[type][myId-1] = [wdw_cardbookConfiguration.allCustomFields[type][myId][0], wdw_cardbookConfiguration.allCustomFields[type][myId][1], parseInt(myId-1)];
				wdw_cardbookConfiguration.allCustomFields[type][myId] = temp;
				wdw_cardbookConfiguration.sortTrees(null, "customFields");
			}
		},

		downCustomFields: function () {
			var type = document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('customFields');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "customFieldsRank"})*1;
				var temp = [wdw_cardbookConfiguration.allCustomFields[type][myId+1][0], wdw_cardbookConfiguration.allCustomFields[type][myId+1][1], parseInt(myId)];
				wdw_cardbookConfiguration.allCustomFields[type][myId+1] = [wdw_cardbookConfiguration.allCustomFields[type][myId][0], wdw_cardbookConfiguration.allCustomFields[type][myId][1], parseInt(myId+1)];
				wdw_cardbookConfiguration.allCustomFields[type][myId] = temp;
				wdw_cardbookConfiguration.sortTrees(null, "customFields");
			}
		},

		addCustomFields: function () {
			var type = document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value;
			var myValidationList = wdw_cardbookConfiguration.getAllCustomsFields();
			var myArgs = {code: "", label: "", typeAction: "", validationList: myValidationList};
			var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddCustomField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
			if (myArgs.typeAction == "SAVE") {
				var result = [];
				var already = false;
				for (let i = 0; i < wdw_cardbookConfiguration.allCustomFields[type].length; i++) {
					if (myArgs.code.toLowerCase() === wdw_cardbookConfiguration.allCustomFields[type][i][0].toLowerCase()) {
						result.push([myArgs.code, myArgs.label, i]);
						already = true;
					} else {
						result.push([wdw_cardbookConfiguration.allCustomFields[type][i][0], wdw_cardbookConfiguration.allCustomFields[type][i][1], i]);
					}
				}
				if (!already) {
					result.push([myArgs.code, myArgs.label, wdw_cardbookConfiguration.allCustomFields[type].length]);
				}
				wdw_cardbookConfiguration.allCustomFields[type] = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "customFields");
			}
		},
		
		renameCustomFields: function () {
			var type = document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('customFields');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myCode = myTree.view.getCellText(myTree.currentIndex, {id: "customFieldsCode"});
				var myLabel = myTree.view.getCellText(myTree.currentIndex, {id: "customFieldsLabel"});
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "customFieldsRank"});
				var myValidationList = wdw_cardbookConfiguration.getAllCustomsFields();
				function filterOriginal(element) {
					return (element != myCode);
				}
				myValidationList = myValidationList.filter(filterOriginal);
				var myArgs = {code: myCode, label: myLabel, typeAction: "", validationList: myValidationList};
				var myWindow = window.openDialog("chrome://cardbook/content/configuration/wdw_cardbookConfigurationAddCustomField.xul", "", "chrome,modal,resizable,centerscreen", myArgs);
				if (myArgs.typeAction == "SAVE") {
					var result = [];
					var already = false;
					for (let i = 0; i < wdw_cardbookConfiguration.allCustomFields[type].length; i++) {
						if (myArgs.code.toLowerCase() === wdw_cardbookConfiguration.allCustomFields[type][i][0].toLowerCase()) {
							result.push([myArgs.code, myArgs.label, i]);
							already = true;
						} else {
							result.push([wdw_cardbookConfiguration.allCustomFields[type][i][0], wdw_cardbookConfiguration.allCustomFields[type][i][1], i]);
						}
					}
					if (!already) {
						result = [];
						for (let i = 0; i < wdw_cardbookConfiguration.allCustomFields[type].length; i++) {
							if (myId == wdw_cardbookConfiguration.allCustomFields[type][i][2]) {
								result.push([myArgs.code, myArgs.label, i]);
							} else {
								result.push([wdw_cardbookConfiguration.allCustomFields[type][i][0], wdw_cardbookConfiguration.allCustomFields[type][i][1], i]);
							}
						}
					}
					wdw_cardbookConfiguration.allCustomFields[type] = JSON.parse(JSON.stringify(result));
					wdw_cardbookConfiguration.sortTrees(null, "customFields");
				}
			}
		},
		
		deleteCustomFields: function () {
			var type = document.getElementById('customFieldsCategoryRadiogroup').selectedItem.value;
			var myTree = document.getElementById('customFields');
			if (myTree.currentIndex == -1) {
				return;
			} else {
				var myId = myTree.view.getCellText(myTree.currentIndex, {id: "customFieldsRank"});
				var result = [];
				var myCount = 0;
				for (let i = 0; i < wdw_cardbookConfiguration.allCustomFields[type].length; i++) {
					if (myId != wdw_cardbookConfiguration.allCustomFields[type][i][2]) {
						result.push([wdw_cardbookConfiguration.allCustomFields[type][i][0], wdw_cardbookConfiguration.allCustomFields[type][i][1], myCount]);
						myCount++;
					}
				}
				wdw_cardbookConfiguration.allCustomFields[type] = JSON.parse(JSON.stringify(result));
				wdw_cardbookConfiguration.sortTrees(null, "customFields");
			}
		},
		
		validateCustomFields: function () {
			var cardbookPrefService = new cardbookPreferenceService();
			cardbookPrefService.delCustomFields();
			for (var i in wdw_cardbookConfiguration.allCustomFields) {
				for (var j = 0; j < wdw_cardbookConfiguration.allCustomFields[i].length; j++) {
					cardbookPrefService.setCustomFields(i, wdw_cardbookConfiguration.allCustomFields[i][j][2], wdw_cardbookConfiguration.allCustomFields[i][j][0] + ":" + wdw_cardbookConfiguration.allCustomFields[i][j][1]);
				}
			}
		},

		getAllCustomsFields: function () {
			var allcustomFieldNames = [];
			for (var i in wdw_cardbookConfiguration.allCustomFields) {
				for (var j = 0; j < wdw_cardbookConfiguration.allCustomFields[i].length; j++) {
					allcustomFieldNames.push(wdw_cardbookConfiguration.allCustomFields[i][j][0]);
				}
			}
			var customLists = ['kindCustom', 'memberCustom'];
			for (var i in customLists) {
				var nameValue = document.getElementById(customLists[i] + 'TextBox').value;
				allcustomFieldNames.push(nameValue);
			}
			return allcustomFieldNames;
		},
		
		validateCustomValues: function () {
			var customLists = ['kindCustom', 'memberCustom'];
			var returnFlag = true;
			for (var i in customLists) {
				var myValue = document.getElementById(customLists[i] + 'TextBox').value;
				var myValidationListOrig = wdw_cardbookConfiguration.getAllCustomsFields();
				var myValidationList = cardbookRepository.arrayUnique(myValidationListOrig);
				if (myValidationList.length != myValidationListOrig.length) {
					cardbookNotifications.setNotification("errorListNotifications", "customFieldsErrorUNIQUE");
					returnFlag = false;
				} else if (myValue.toUpperCase() !== myValue) {
					cardbookNotifications.setNotification("errorListNotifications", "customFieldsErrorUPPERCASE", myValue);
					returnFlag = false;
				} else if (!(myValue.toUpperCase().startsWith("X-"))) {
					cardbookNotifications.setNotification("errorListNotifications", "customFieldsErrorX", myValue);
					returnFlag = false;
				} else if (myValue.toUpperCase() === "X-THUNDERBIRD-ETAG") {
					cardbookNotifications.setNotification("errorListNotifications", "customFieldsErrorETAG", myValue);
					returnFlag = false;
				} else if (myValue.includes(":") || myValue.includes(",") || myValue.includes(";") || myValue.includes(".")) {
					cardbookNotifications.setNotification("errorListNotifications", "customFieldsErrorCHAR", myValue);
					returnFlag = false;
				}
			}
			if (returnFlag) {
				cardbookNotifications.setNotification("errorListNotifications", "OK");
			}
			return returnFlag;
		},

		resetList: function () {
			document.getElementById('kindCustomTextBox').value = cardbookRepository.defaultKindCustom;
			document.getElementById('memberCustomTextBox').value = cardbookRepository.defaultMemberCustom;
			// should also change preferences (not automatically saved)
			document.getElementById('extensions.cardbook.kindCustom').value = cardbookRepository.defaultKindCustom;
			document.getElementById('extensions.cardbook.memberCustom').value = cardbookRepository.defaultMemberCustom;
			wdw_cardbookConfiguration.validateCustomValues();
		},

		loadPeriodicSync: function () {
			var prefs = Services.prefs;
			var autoSync = prefs.getBoolPref("extensions.cardbook.autoSync");
			if (!(autoSync)) {
				document.getElementById('autoSyncInterval').disabled = true;
				document.getElementById('autoSyncIntervalTextBox').disabled = true;
			}
		},

		validateStatusInformationLineNumber: function () {
			if (document.getElementById('statusInformationLineNumberTextBox').value < 10) {
				document.getElementById('statusInformationLineNumberTextBox').value = 10;
			}
			while (cardbookRepository.statusInformation.length > document.getElementById('statusInformationLineNumberTextBox').value) {
				cardbookRepository.statusInformation.splice(0,1);
			}
		},

		showautoSyncInterval: function () {
			if (document.getElementById('autoSyncCheckBox').checked) {
				document.getElementById('autoSyncInterval').disabled = false;
				document.getElementById('autoSyncIntervalTextBox').disabled = false;
			} else {
				document.getElementById('autoSyncInterval').disabled = true;
				document.getElementById('autoSyncIntervalTextBox').disabled = true;
			}
		},

		load: function () {
			wdw_cardbookConfiguration.loadTitle();
			wdw_cardbookConfiguration.addAcceptButton();
			wdw_cardbookConfiguration.loadTypes();
			wdw_cardbookConfiguration.sortTrees(null, "typesTree");
			wdw_cardbookConfiguration.loadIMPPs();
			wdw_cardbookConfiguration.sortTrees(null, "IMPPsTree");
			wdw_cardbookConfiguration.loadCustomFields();
			wdw_cardbookConfiguration.sortTrees(null, "customFields");
			wdw_cardbookConfiguration.loadPref();
			wdw_cardbookConfiguration.loadOrg();
			wdw_cardbookConfiguration.displayOrg();
			wdw_cardbookConfiguration.loadPeriodicSync();
			wdw_cardbookConfiguration.loadAddressBooks("addressBooksNameList", false);
			wdw_cardbookConfiguration.loadVCards();
			wdw_cardbookConfiguration.sortTrees(null, "accountsVCardsTree");
			wdw_cardbookConfiguration.loadRestrictions();
			wdw_cardbookConfiguration.sortTrees(null, "accountsRestrictionsTree");
			wdw_cardbookConfiguration.loadEmailsCollection();
			wdw_cardbookConfiguration.sortTrees(null, "emailsCollectionTree");
			wdw_cardbookConfiguration.loadPrefEmailPref();
			// loadFnFormula() depends on loadOrg()
			wdw_cardbookConfiguration.loadFnFormula();
			AddonManager.getAddonByID(cardbookRepository.LIGHTNING_ID, wdw_cardbookConfiguration.loadCalendars);
			wdw_cardbookConfiguration.remindViaPopup();
			wdw_cardbookConfiguration.cardbookAutoComplete();
			wdw_cardbookConfiguration.loadEventEntryTitle();
			wdw_cardbookConfiguration.showTab();
		},
		
		accept: function () {
			wdw_cardbookConfiguration.validateStatusInformationLineNumber();
			wdw_cardbookConfiguration.validateTypes();
			wdw_cardbookConfiguration.validateIMPPs();
			wdw_cardbookConfiguration.validateOrg();
			wdw_cardbookConfiguration.validateVCards();
			wdw_cardbookConfiguration.validateRestrictions();
			wdw_cardbookConfiguration.validateEmailsCollection();
			wdw_cardbookConfiguration.validatePrefEmailPref();
			wdw_cardbookConfiguration.validatePrefIMPPPref();
			wdw_cardbookConfiguration.validateEventEntryTitle();
			wdw_cardbookConfiguration.validateFnFormula();
			if (!(wdw_cardbookConfiguration.validateCustomValues())) {
				// don't work
				// return false;
				throw "CardBook validation error";
			}
			wdw_cardbookConfiguration.validateCustomFields();
			cardbookUtils.notifyObservers("cardbook.preferencesChanged");
		},
		

		cancel: function () {
			close();
		}
	};
};
