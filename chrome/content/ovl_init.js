if ("undefined" == typeof(ovl_synchro)) {
	Components.utils.import("resource://gre/modules/Services.jsm");

	var ovl_synchro = {

		lTimerSync: null,
		
		initPrefs: function () {
			var prefs = Services.prefs.getDefaultBranch("extensions.cardbook.");
			
			prefs.setBoolPref("autocompletion", true);
			prefs.setBoolPref("autocompleteSortByPopularity", true);
			prefs.setBoolPref("autocompleteShowAddressbook", false);
			prefs.setBoolPref("autocompleteWithColor", true);
			prefs.setCharPref("useColor", "background");
			prefs.setBoolPref("exclusive", false);
			prefs.setCharPref("requestsTimeout", "120");
			prefs.setCharPref("statusInformationLineNumber", "250");
			prefs.setBoolPref("debugMode", false);
			
			prefs.setBoolPref("preferEmailEdition", true);
			prefs.setBoolPref("mailPopularityTabView", false);
			prefs.setBoolPref("technicalTabView", false);
			prefs.setBoolPref("vcardTabView", false);
			prefs.setBoolPref("advancedTabView", false);
			
			prefs.setCharPref("panesView", "modern");
			prefs.setBoolPref("initialSync", true);
			prefs.setCharPref("initialSyncDelay", "0");
			prefs.setCharPref("solveConflicts", "User");
			prefs.setBoolPref("autoSync", true);
			prefs.setCharPref("autoSyncInterval", "30");
			prefs.setCharPref("multiget", "40");
			prefs.setBoolPref("decodeReport", true);
			
			prefs.setBoolPref("preferEmailPref", true);
			prefs.setBoolPref("preferIMPPPref", true);
			prefs.setBoolPref("warnEmptyEmails", true);
			prefs.setBoolPref("useOnlyEmail", false);
			
			prefs.setBoolPref("usePreferenceValue", false);
			prefs.setCharPref("preferenceValueLabel", "");
			
			prefs.setBoolPref("firstRun", true);
			prefs.setBoolPref("firstOpen", true);
			prefs.setBoolPref("firstOpenModern", true);
			prefs.setBoolPref("iconsMigrated", false);
			
			prefs.setCharPref("kindCustom", "X-ADDRESSBOOKSERVER-KIND");
			prefs.setCharPref("memberCustom", "X-ADDRESSBOOKSERVER-MEMBER");
			prefs.setCharPref("customColumnsShown", "");
			
			prefs.setCharPref("orgStructure", "");
			
			prefs.setCharPref("localizeEngine", "OpenStreetMap");
			prefs.setCharPref("localizeTarget", "out");
			prefs.setCharPref("showNameAs", "LF");
			prefs.setCharPref("fnFormula", "({{1}} |)({{2}} |)({{3}} |)({{4}} |)({{5}} |)({{6}} |)");
			prefs.setCharPref("dateDisplayedFormat", "0");
			
			prefs.setCharPref("addressBooksNameList", "allAddressBooks");
			prefs.setCharPref("calendarsNameList", "");
			prefs.setBoolPref("searchInNote", true);
			prefs.setCharPref("numberOfDaysForSearching", "30");
			prefs.setBoolPref("showPopupOnStartup", false);
			prefs.setBoolPref("showPeriodicPopup", false);
			prefs.setCharPref("periodicPopupIime", "08:00");
			prefs.setBoolPref("showPopupEvenIfNoBirthday", true);
			prefs.setBoolPref("syncWithLightningOnStartup", false);
			prefs.setCharPref("numberOfDaysForWriting", "30");
			prefs.setCharPref("eventEntryTitle", "");
			prefs.setCharPref("eventEntryTime", "00:00");
			prefs.setBoolPref("eventEntryWholeDay", false);
			prefs.setCharPref("calendarEntryAlarm", "7");
			prefs.setCharPref("calendarEntryCategories", "");
			
			prefs.setBoolPref("viewABPane", true);
			prefs.setBoolPref("viewABContact", true);
			
			prefs.setCharPref("accountsShown", "all");
			prefs.setCharPref("uncategorizedCards", "");
			prefs.setCharPref("addonVersion", "24.2");
		},

		lEventTimerSync : { notify: function(lTimerSync) {
			if (!cardbookRepository.firstLoad) {
				// setting uncategorizedCards
				var prefs = Services.prefs;
				try {
					cardbookRepository.cardbookUncategorizedCards = prefs.getComplexValue("extensions.cardbook.uncategorizedCards", Components.interfaces.nsISupportsString).data;
					if (cardbookRepository.cardbookUncategorizedCards == "") {
						throw "CardBook no uncategorizedCards";
					}
				}
				catch (e) {
					let stringBundleService = Services.strings;
					let strBundle = stringBundleService.createBundle("chrome://cardbook/locale/cardbook.properties");
					cardbookRepository.cardbookUncategorizedCards = strBundle.GetStringFromName("uncategorizedCards");
					var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
					str.data = cardbookRepository.cardbookUncategorizedCards;
					prefs.setComplexValue("extensions.cardbook.uncategorizedCards", Components.interfaces.nsISupportsString, str);
				}
				// setting preferEmailPref and preferIMPPPref for getting usefull emails and impps
				cardbookRepository.preferEmailPref = prefs.getBoolPref("extensions.cardbook.preferEmailPref");
				cardbookRepository.preferIMPPPref = prefs.getBoolPref("extensions.cardbook.preferIMPPPref");

				// setting addonVersion, userAgent and prodid
				cardbookRepository.addonVersion = prefs.getComplexValue("extensions.cardbook.addonVersion", Components.interfaces.nsISupportsString).data;
				cardbookRepository.userAgent = "Thunderbird CardBook/" + cardbookRepository.addonVersion;
				cardbookRepository.prodid = "-//Thunderbird.org/NONSGML Thunderbird CardBook V"+ cardbookRepository.addonVersion + "//EN";

				// setting currentTypes for having lookups
				var cardbookPrefService = new cardbookPreferenceService();
				cardbookRepository.currentTypes = cardbookPrefService.getAllTypesCurrent();

				// migration functions (should be removed)
				// removed : cardbookRepository.setSolveConflicts();
				cardbookRepository.setCollected();
				cardbookRepository.setTypes();
				cardbookRepository.loadCustoms();
				
				// observers are needed not only UI but also for synchro
				// there is no unregister launched
				cardBookPrefObserver.register();
				cardbookObserver.register();
				
				// once openDB is finished, it will fire an event
				// and then load the cache and maybe sync the accounts
				cardbookIndexedDB.openDB();
				cardbookRepository.firstLoad = true;
			}
			}
		},
		
		runBackgroundSync: function () {
			ovl_synchro.lTimerSync = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
			ovl_synchro.lTimerSync.initWithCallback(ovl_synchro.lEventTimerSync, 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
		}

	};

	// need to launch it a bit later
	if (!cardbookRepository.firstLoad) {
		ovl_synchro.initPrefs();
	}
	ovl_synchro.runBackgroundSync();

};
