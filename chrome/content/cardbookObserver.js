if ("undefined" == typeof(cardbookObserver)) {
	Components.utils.import("resource://gre/modules/Services.jsm");

	var cardBookPrefObserverRepository = {
		registerAll: function(aPrefObserver) {
			aPrefObserver.branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.cardbook.");
			if (!("addObserver" in aPrefObserver.branch)) {
				aPrefObserver.branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
			}
			aPrefObserver.branch.addObserver("", aPrefObserver, false);
		},
		
		unregisterAll: function(aPrefObserver) {
			aPrefObserver.branch.removeObserver("", aPrefObserver);
		}
	};

	var cardBookPrefObserver = {
		register: function() {
			cardBookPrefObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookPrefObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aData) {
				case "panesView":
					ovl_cardbookLayout.orientPanes();
					break;
				case "viewABPane":
				case "viewABContact":
					ovl_cardbookLayout.resizePanes();
					break;
				case "mailPopularityTabView":
				case "technicalTabView":
				case "vcardTabView":
					wdw_cardbook.showCorrectTabs();
					break;
			}
		}
	};
	var myCardBookSideBarPrefObserver = {
		register: function() {
			cardBookPrefObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookPrefObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aData) {
				case "exclusive":
					wdw_cardbookContactsSidebar.loadAB();
					break;
				case "preferEmailPref":
					wdw_cardbookContactsSidebar.onABChange();
					break;
			}
		}
	};

	var cardbookObserverRepository = {
		registerAll: function(aObserver) {
			var observerService = Services.obs;
			observerService.addObserver(aObserver, "cardbook.catModifiedIndirect", false);
			observerService.addObserver(aObserver, "cardbook.catModifiedDirect", false);
			observerService.addObserver(aObserver, "cardbook.catRemovedIndirect", false);
			observerService.addObserver(aObserver, "cardbook.catRemovedDirect", false);
			observerService.addObserver(aObserver, "cardbook.catAddedIndirect", false);
			observerService.addObserver(aObserver, "cardbook.catAddedDirect", false);

			observerService.addObserver(aObserver, "cardbook.ABAddedDirect", false);
			observerService.addObserver(aObserver, "cardbook.ABRemovedDirect", false);
			observerService.addObserver(aObserver, "cardbook.ABModifiedDirect", false);

			observerService.addObserver(aObserver, "cardbook.cardAddedIndirect", false);
			observerService.addObserver(aObserver, "cardbook.cardAddedDirect", false);
			observerService.addObserver(aObserver, "cardbook.cardRemovedIndirect", false);
			observerService.addObserver(aObserver, "cardbook.cardRemovedDirect", false);
			observerService.addObserver(aObserver, "cardbook.cardModifiedIndirect", false);
			observerService.addObserver(aObserver, "cardbook.cardModifiedDirect", false);

			observerService.addObserver(aObserver, "cardbook.syncRunning", false);
			observerService.addObserver(aObserver, "cardbook.cardPasted", false);
			observerService.addObserver(aObserver, "cardbook.cardDragged", false);
			observerService.addObserver(aObserver, "cardbook.cardImportedFromFile", false);

			observerService.addObserver(aObserver, "cardbook.DBOpen", false);
			observerService.addObserver(aObserver, "cardbook.complexSearchInitLoaded", false);
			observerService.addObserver(aObserver, "cardbook.complexSearchLoaded", false);

			observerService.addObserver(aObserver, "cardbook.preferencesChanged", false);
		},
		
		unregisterAll: function(aObserver) {
			var observerService = Services.obs;
			observerService.removeObserver(aObserver, "cardbook.catModifiedIndirect");
			observerService.removeObserver(aObserver, "cardbook.catModifiedDirect");
			observerService.removeObserver(aObserver, "cardbook.catRemovedIndirect");
			observerService.removeObserver(aObserver, "cardbook.catRemovedDirect");
			observerService.removeObserver(aObserver, "cardbook.catAddedIndirect");
			observerService.removeObserver(aObserver, "cardbook.catAddedDirect");

			observerService.removeObserver(aObserver, "cardbook.ABAddedDirect");
			observerService.removeObserver(aObserver, "cardbook.ABRemovedDirect");
			observerService.removeObserver(aObserver, "cardbook.ABModifiedDirect");

			observerService.removeObserver(aObserver, "cardbook.cardAddedIndirect");
			observerService.removeObserver(aObserver, "cardbook.cardAddedDirect");
			observerService.removeObserver(aObserver, "cardbook.cardRemovedIndirect");
			observerService.removeObserver(aObserver, "cardbook.cardRemovedDirect");
			observerService.removeObserver(aObserver, "cardbook.cardModifiedIndirect");
			observerService.removeObserver(aObserver, "cardbook.cardModifiedDirect");

			observerService.removeObserver(aObserver, "cardbook.syncRunning");
			observerService.removeObserver(aObserver, "cardbook.cardPasted");
			observerService.removeObserver(aObserver, "cardbook.cardDragged");
			observerService.removeObserver(aObserver, "cardbook.cardImportedFromFile");

			observerService.removeObserver(aObserver, "cardbook.DBOpen");
			observerService.removeObserver(aObserver, "cardbook.complexSearchInitLoaded");
			observerService.removeObserver(aObserver, "cardbook.complexSearchLoaded");

			observerService.removeObserver(aObserver, "cardbook.preferencesChanged");
		}
	};

	var myCardBookLightningObserver = {
		register: function() {
			cardbookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardbookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
				case "cardbook.ABAddedDirect":
				case "cardbook.ABRemovedDirect":
				case "cardbook.ABModifiedDirect":
				case "cardbook.preferencesChanged":
					cardbookAutocomplete.loadCssRules();
					break;
			}
		}
	};

	var myCardBookSideBarObserver = {
		register: function() {
			cardbookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardbookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
				case "cardbook.ABAddedDirect":
				case "cardbook.ABRemovedDirect":
				case "cardbook.ABModifiedDirect":
					wdw_cardbookContactsSidebar.loadAB();
					break;
				case "cardbook.catAddedIndirect":
				case "cardbook.cardAddedIndirect":
				case "cardbook.cardRemovedIndirect":
				case "cardbook.cardRemovedDirect":
				case "cardbook.cardModifiedIndirect":
				case "cardbook.syncRunning":
				case "cardbook.cardPasted":
				case "cardbook.cardDragged":
				case "cardbook.cardImportedFromFile":
				case "cardbook.catAddedDirect":
				case "cardbook.catRemovedIndirect":
				case "cardbook.catRemovedDirect":
				case "cardbook.catModifiedIndirect":
				case "cardbook.catModifiedDirect":
				case "cardbook.cardAddedDirect":
				case "cardbook.cardModifiedDirect":
					wdw_cardbookContactsSidebar.onABChange();
					break;
				case "cardbook.preferencesChanged":
					wdw_cardbookContactsSidebar.onRestrictionsChanged();
					break;
				case "cardbook.identityChanged":
					wdw_cardbookContactsSidebar.onIdentityChanged(aData);
					break;
			}
		}
	};

	var myCardBookComposeMsgObserver = {
		register: function() {
			cardbookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardbookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
				case "cardbook.ABAddedDirect":
				case "cardbook.ABRemovedDirect":
				case "cardbook.ABModifiedDirect":
				case "cardbook.preferencesChanged":
					cardbookAutocomplete.loadCssRules();
					break;
			}
		}
	};

	var cardbookObserver = {
		register: function() {
			cardbookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardbookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
				case "cardbook.catAddedIndirect":
					break;
				case "cardbook.cardAddedIndirect":
				case "cardbook.cardRemovedIndirect":
				case "cardbook.cardRemovedDirect":
				case "cardbook.cardModifiedIndirect":
				case "cardbook.syncRunning":
				case "cardbook.cardPasted":
				case "cardbook.cardDragged":
				case "cardbook.cardImportedFromFile":
					wdw_cardbook.refreshWindow();
					break;
				case "cardbook.preferencesChanged":
					cardbookRepository.loadCustoms();
					wdw_cardbook.loadCssRules();
					wdw_cardbook.addCustomColumns();
					wdw_cardbook.refreshWindow();
					break;
				case "cardbook.catAddedDirect":
				case "cardbook.catRemovedIndirect":
				case "cardbook.catRemovedDirect":
				case "cardbook.catModifiedIndirect":
				case "cardbook.catModifiedDirect":
				case "cardbook.ABAddedDirect":
				case "cardbook.ABRemovedDirect":
				case "cardbook.ABModifiedDirect":
				case "cardbook.cardAddedDirect":
				case "cardbook.cardModifiedDirect":
				case "cardbook.complexSearchLoaded":
					wdw_cardbook.refreshWindow(aData);
					break;
				case "cardbook.DBOpen":
					cardbookSynchronization.loadComplexSearchAccounts();
					break;
				case "cardbook.complexSearchInitLoaded":
					cardbookSynchronization.loadAccounts();
					if (wdw_cardbook) {
						wdw_cardbook.loadFirstWindow();
					}
					break;
			}
		}
	};
};
