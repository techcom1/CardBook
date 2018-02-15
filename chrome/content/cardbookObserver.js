if ("undefined" == typeof(cardBookObserver)) {
	Components.utils.import("resource://gre/modules/Services.jsm");

	var cardBookPrefObserverRepository = {
		registerAll: function(aPrefObserver) {
			aPrefObserver.branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.cardbook.");
			if (!("addObserver" in aPrefObserver.branch)) {
				aPrefObserver.branch.QueryInterface(Components.interfaces.nsIPrefBranch);
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

	var cardBookEditionPrefObserver = {
		register: function() {
			cardBookPrefObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookPrefObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aData) {
				case "mailPopularityTabView":
				case "advancedTabView":
					wdw_cardEdition.showCorrectTabs();
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

	var cardBookObserverRepository = {
		registerAll: function(aObserver) {
			Services.obs.addObserver(aObserver, "cardbook.catModifiedIndirect", false);
			Services.obs.addObserver(aObserver, "cardbook.catModifiedDirect", false);
			Services.obs.addObserver(aObserver, "cardbook.catRemovedIndirect", false);
			Services.obs.addObserver(aObserver, "cardbook.catRemovedDirect", false);
			Services.obs.addObserver(aObserver, "cardbook.catAddedIndirect", false);
			Services.obs.addObserver(aObserver, "cardbook.catAddedDirect", false);

			Services.obs.addObserver(aObserver, "cardbook.ABAddedDirect", false);
			Services.obs.addObserver(aObserver, "cardbook.ABRemovedDirect", false);
			Services.obs.addObserver(aObserver, "cardbook.ABModifiedDirect", false);

			Services.obs.addObserver(aObserver, "cardbook.cardAddedIndirect", false);
			Services.obs.addObserver(aObserver, "cardbook.cardAddedDirect", false);
			Services.obs.addObserver(aObserver, "cardbook.cardRemovedIndirect", false);
			Services.obs.addObserver(aObserver, "cardbook.cardRemovedDirect", false);
			Services.obs.addObserver(aObserver, "cardbook.cardModifiedIndirect", false);
			Services.obs.addObserver(aObserver, "cardbook.cardModifiedDirect", false);

			Services.obs.addObserver(aObserver, "cardbook.syncRunning", false);
			Services.obs.addObserver(aObserver, "cardbook.cardPasted", false);
			Services.obs.addObserver(aObserver, "cardbook.cardDragged", false);
			Services.obs.addObserver(aObserver, "cardbook.cardImportedFromFile", false);

			Services.obs.addObserver(aObserver, "cardbook.DBOpen", false);
			Services.obs.addObserver(aObserver, "cardbook.complexSearchInitLoaded", false);
			Services.obs.addObserver(aObserver, "cardbook.complexSearchLoaded", false);

			Services.obs.addObserver(aObserver, "cardbook.preferencesChanged", false);
			
			Services.obs.addObserver(aObserver, "cardbook.identityChanged", false);
		},
		
		unregisterAll: function(aObserver) {
			Services.obs.removeObserver(aObserver, "cardbook.catModifiedIndirect");
			Services.obs.removeObserver(aObserver, "cardbook.catModifiedDirect");
			Services.obs.removeObserver(aObserver, "cardbook.catRemovedIndirect");
			Services.obs.removeObserver(aObserver, "cardbook.catRemovedDirect");
			Services.obs.removeObserver(aObserver, "cardbook.catAddedIndirect");
			Services.obs.removeObserver(aObserver, "cardbook.catAddedDirect");

			Services.obs.removeObserver(aObserver, "cardbook.ABAddedDirect");
			Services.obs.removeObserver(aObserver, "cardbook.ABRemovedDirect");
			Services.obs.removeObserver(aObserver, "cardbook.ABModifiedDirect");

			Services.obs.removeObserver(aObserver, "cardbook.cardAddedIndirect");
			Services.obs.removeObserver(aObserver, "cardbook.cardAddedDirect");
			Services.obs.removeObserver(aObserver, "cardbook.cardRemovedIndirect");
			Services.obs.removeObserver(aObserver, "cardbook.cardRemovedDirect");
			Services.obs.removeObserver(aObserver, "cardbook.cardModifiedIndirect");
			Services.obs.removeObserver(aObserver, "cardbook.cardModifiedDirect");

			Services.obs.removeObserver(aObserver, "cardbook.syncRunning");
			Services.obs.removeObserver(aObserver, "cardbook.cardPasted");
			Services.obs.removeObserver(aObserver, "cardbook.cardDragged");
			Services.obs.removeObserver(aObserver, "cardbook.cardImportedFromFile");

			Services.obs.removeObserver(aObserver, "cardbook.DBOpen");
			Services.obs.removeObserver(aObserver, "cardbook.complexSearchInitLoaded");
			Services.obs.removeObserver(aObserver, "cardbook.complexSearchLoaded");

			Services.obs.removeObserver(aObserver, "cardbook.preferencesChanged");

			Services.obs.removeObserver(aObserver, "cardbook.identityChanged");
		}
	};

	var myCardBookLightningObserver = {
		register: function() {
			cardBookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookObserverRepository.unregisterAll(this);
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
			cardBookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
				case "cardbook.ABAddedDirect":
				case "cardbook.ABRemovedDirect":
				case "cardbook.ABModifiedDirect":
					wdw_cardbookContactsSidebar.loadAB();
					break;
				case "cardbook.syncRunning":
					wdw_cardbookContactsSidebar.onABChange(aData);
					break;
				case "cardbook.catAddedIndirect":
				case "cardbook.cardAddedIndirect":
				case "cardbook.cardRemovedIndirect":
				case "cardbook.cardRemovedDirect":
				case "cardbook.cardModifiedIndirect":
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
			cardBookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookObserverRepository.unregisterAll(this);
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

	var cardBookObserver = {
		register: function() {
			cardBookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
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

	var cardBookWindowObserver = {
		register: function() {
			cardBookObserverRepository.registerAll(this);
		},
		
		unregister: function() {
			cardBookObserverRepository.unregisterAll(this);
		},
		
		observe: function(aSubject, aTopic, aData) {
			switch (aTopic) {
				case "cardbook.catAddedIndirect":
					break;
				case "cardbook.syncRunning":
					wdw_cardbook.refreshWindow(aData);
					break;
				case "cardbook.cardAddedIndirect":
				case "cardbook.cardRemovedIndirect":
				case "cardbook.cardRemovedDirect":
				case "cardbook.cardModifiedIndirect":
				case "cardbook.cardPasted":
				case "cardbook.cardDragged":
				case "cardbook.cardImportedFromFile":
					wdw_cardbook.refreshWindow();
					break;
				case "cardbook.preferencesChanged":
					cardbookRepository.loadCustoms();
					wdw_cardbook.loadCssRules();
					var myColumns = cardbookUtils.getColumnsState().split(',');
					wdw_cardbook.addTreeColumns();
					cardbookUtils.setColumnsState(myColumns);
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
					wdw_cardbook.loadCssRules();
					wdw_cardbook.refreshWindow(aData);
					break;
			}
		}
	};

	var cardBookWindowMutationObserver = {
		register: function() {
			var observer = new MutationObserver(function handleMutations(mutations) {
				if (cardbookRepository.cardbookReorderMode == "NOREORDER") {
					cardbookUtils.saveColumnsState();
				}
			});
			observer.observe(document.getElementById("cardsTreecols"), {
				attributes: true,
				subtree: true,
				attributeFilter: ["hidden", "ordinal"]
			});
		}
	};
};
