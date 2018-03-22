if ("undefined" == typeof(cardbookTabType)) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var cardbookTabMonitor = {
		monitorName: "cardbook",
		onTabTitleChanged: function() {},
		onTabOpened: function(aTab) {
			if (aTab.mode.name == "cardbook") {
				// in case of opening a new window without having a reload
				wdw_cardbook.loadFirstWindow();
			}
		},
		onTabClosing: function(aTab) {
			if (aTab.mode.name == "cardbook") {
				document.getElementById("cardboookModeBroadcasterTab").setAttribute("mode", "mail");
				document.getElementById("unreadMessageCount").hidden=false;
			}
		},
		onTabPersist: function() {},
		onTabRestored: function() {},
		onTabSwitched: function(aNewTab, aOldTab) {
			var strBundle = document.getElementById("cardbook-strings");
			if (aNewTab.mode.name == "cardbook") {
				document.getElementById("cardboookModeBroadcasterTab").setAttribute("mode", "cardbook");
				document.getElementById("totalMessageCount").setAttribute("tooltiptext", strBundle.getString("statusProgressInformationTooltip"));
			} else {
				document.getElementById("cardboookModeBroadcasterTab").setAttribute("mode", "mail");
				document.getElementById("totalMessageCount").removeAttribute("tooltiptext");
				wdw_cardbook.setElementLabel('statusText', "");
				document.getElementById("unreadMessageCount").hidden=false;
			}
		}
	};

	var cardbookTabType = {
		name: "cardbook",
		panelId: "cardbookTabPanel",
		modes: {
			cardbook: {
				type: "cardbookTab",
				maxTabs: 1,
				openTab: function(aTab, aArgs) {
					aTab.title = aArgs["title"];
					ovl_cardbookLayout.orientPanes();
				},

				showTab: function(aTab) {
				},

				closeTab: function(aTab) {
				},
				
				persistTab: function(aTab) {
					let tabmail = document.getElementById("tabmail");
					return {
						background: (aTab != tabmail.currentTabInfo)
						};
				},
				
				restoreTab: function(aTabmail, aState) {
					var strBundle = document.getElementById("cardbook-strings");
					aState.title = strBundle.getString("cardbookTitle");
					aTabmail.openTab('cardbook', aState);
				},
				
				onTitleChanged: function(aTab) {
					var strBundle = document.getElementById("cardbook-strings");
					aTab.title = strBundle.getString("cardbookTitle");
				},
				
				supportsCommand: function supportsCommand(aCommand, aTab) {
					switch (aCommand) {
						case "cmd_toggleMessagePane":
						case "cmd_viewClassicMailLayout":
						case "cmd_viewVerticalMailLayout":
						case "cmd_printSetup":
						case "cmd_print":
						case "cmd_printpreview":
						case "cmd_selectAll":
						case "cmd_copy":
						case "cmd_cut":
						case "cmd_paste":
						case "cmd_delete":
						case "cmd_find":
						case "cmd_findAgain":
						case "cmd_showQuickFilterBar":
							return true;
						default:
							return false;
					}
				},
				
				isCommandEnabled: function isCommandEnabled(aCommand, aTab) {
					switch (aCommand) {
						case "cmd_toggleMessagePane":
						case "cmd_viewClassicMailLayout":
						case "cmd_viewVerticalMailLayout":
						case "cmd_printSetup":
						case "cmd_print":
						case "cmd_printpreview":
						case "cmd_selectAll":
						case "cmd_copy":
						case "cmd_cut":
						case "cmd_paste":
						case "cmd_delete":
						case "cmd_find":
						case "cmd_findAgain":
						case "cmd_showQuickFilterBar":
							return true;
						default:
							return false;
					}
				},
				
				doCommand: function doCommand(aCommand, aTab) {
					switch (aCommand) {
						case "cmd_toggleMessagePane":
							ovl_cardbookLayout.changeResizePanes('viewABContact');
							break;
						case "cmd_viewClassicMailLayout":
						case "cmd_viewVerticalMailLayout":
							ovl_cardbookLayout.changeOrientPanes(aCommand);
							break;
						case "cmd_printSetup":
							PrintUtils.showPageSetup();
							break;
						case "cmd_print":
						case "cmd_printpreview":
							wdw_cardbook.print();
							break;
						case "cmd_selectAll":
							wdw_cardbook.selectAllKey();
							break;
						case "cmd_copy":
							wdw_cardbook.copyKey();
							break;
						case "cmd_cut":
							wdw_cardbook.cutKey();
							break;
						case "cmd_paste":
							wdw_cardbook.pasteKey();
							break;
						case "cmd_delete":
							wdw_cardbook.deleteKey();
							break;
						case "cmd_find":
						case "cmd_findAgain":
						case "cmd_showQuickFilterBar":
							wdw_cardbook.findKey();
							break;
					}
				},

				onEvent: function(aEvent, aTab) {}
			}
		},

		saveTabState: function(aTab) {
		}
	};
};

if ("undefined" == typeof(ovl_cardbook)) {
	var ovl_cardbook = {
		// if Lightning is not installed the CardBook toolbar is shown this way
		// if Lightning is installed the CardBook toolbar is shown in the file ovl_lightningMenus.js
		overrideToolbarMenu: function(addon) {
			if (!(addon && addon.isActive)) {
				var menus = [ 'toolbar-context-menu', 'menu_Toolbars' ];
				for (var i in menus) {
					if (document.getElementById(menus[i])) {
						var myMenu = document.getElementById(menus[i]);
						myMenu.removeEventListener('popupshowing', arguments.callee, true);
						myMenu.addEventListener("popupshowing", function(event) {
							if (cardbookUtils.getBroadcasterOnCardBook()) {
								onViewToolbarsPopupShowing(event, ["navigation-toolbox", "cardbook-toolbox"]);
							}
						});
					}
				}
			}
		},

		open: function() {
			var tabmail = document.getElementById("tabmail");
			if (!tabmail) {
				// Try opening new tabs in an existing 3pane window
				let mail3PaneWindow = Services.wm.getMostRecentWindow("mail:3pane");
				if (mail3PaneWindow) {
					tabmail = mail3PaneWindow.document.getElementById("tabmail");
					mail3PaneWindow.focus();
				}
			}
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			tabmail.openTab('cardbook', {title: strBundle.GetStringFromName("cardbookTitle")});
		}
	};
};

window.addEventListener("load", function(e) {
	let tabmail = document.getElementById('tabmail');
	if (tabmail) {
		tabmail.registerTabType(cardbookTabType);
		tabmail.registerTabMonitor(cardbookTabMonitor);
	}

	var firstRun = cardbookPreferences.getBoolPref("extensions.cardbook.firstRun");
	if (firstRun) {
		var toolbar = document.getElementById("mail-bar3");
		if (toolbar) {
			var toolbarItems = toolbar.currentSet.split(",");
			var found = false;
			for (var i=0; i<toolbarItems.length; i++) {
				if (toolbarItems[i] == "cardbookToolbarButton") {
					found = true;
					break;
				}
			}
			if (!found) {
				toolbar.insertItem("cardbookToolbarButton");
				toolbar.setAttribute("currentset", toolbar.currentSet);
				document.persist(toolbar.id, "currentset");
			}
		}
		cardbookPreferences.setBoolPref("extensions.cardbook.firstRun", false);
	}

	if (document.getElementById("addressBook")) {
		document.getElementById("addressBook").removeAttribute("key");
	}
	if (document.getElementById("appmenu_addressBook")) {
		document.getElementById("appmenu_addressBook").removeAttribute("key");
	}
	if (document.getElementById("key_addressbook")) {
		document.getElementById("key_addressbook").setAttribute("key", "");
	}

	// for CardBook toolbar if Lightning is not installed
	AddonManager.getAddonByID(cardbookRepository.LIGHTNING_ID, ovl_cardbook.overrideToolbarMenu);
	
	window.removeEventListener('load', arguments.callee, true);
}, false);
