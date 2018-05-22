if ("undefined" == typeof(cardbookAutocomplete)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var cardbookAutocomplete = {
		
		iconRuleStrings: {},
		celltextRuleStrings: {},
		textRuleStrings: {},
		
		createCssMsgIconsRules: function (aStyleSheet, aOSName) {
			var ruleIndex = aStyleSheet.insertRule(cardbookAutocomplete.iconRuleStrings["local"][aOSName], aStyleSheet.cssRules.length);
			cardbookRepository.cardbookDynamicCssRules[aStyleSheet.href].push(ruleIndex);
			var ruleIndex = aStyleSheet.insertRule(cardbookAutocomplete.iconRuleStrings["remote"][aOSName], aStyleSheet.cssRules.length);
			cardbookRepository.cardbookDynamicCssRules[aStyleSheet.href].push(ruleIndex);
			var ruleIndex = aStyleSheet.insertRule(cardbookAutocomplete.iconRuleStrings["standard-abook"][aOSName], aStyleSheet.cssRules.length);
			cardbookRepository.cardbookDynamicCssRules[aStyleSheet.href].push(ruleIndex);
		},

		createCssMsgAccountRules: function (aStyleSheet, aStyle, aColor, aOSName, aUseColor, aTreeCellProperty, aColorProperty) {
			cardbookAutocomplete.celltextRuleStrings["LINUX"] = "treechildren::-moz-tree-cell-text(" + aStyle + ") {\
				}";
			cardbookAutocomplete.celltextRuleStrings["WIN"] = "treechildren::-moz-tree-cell-text(" + aStyle + ") {\
				}";
			cardbookAutocomplete.celltextRuleStrings["OSX"] = "treechildren::-moz-tree-cell-text(" + aStyle + ") {\
				margin-top: 2px;\
				margin-bottom: 2px;\
				margin-inline-start: 15px;\
				margin-inline-end: -3px;\
				border: none;\
				}";
			var ruleIndex = aStyleSheet.insertRule(cardbookAutocomplete.celltextRuleStrings[aOSName], aStyleSheet.cssRules.length);
			cardbookRepository.cardbookDynamicCssRules[aStyleSheet.href].push(ruleIndex);
			if (aUseColor) {
				cardbookAutocomplete.textRuleStrings["LINUX"] = "treechildren::" + aTreeCellProperty + "(" + aStyle + ") {\
					" + aColorProperty + ": " + aColor + ";\
					}";
				cardbookAutocomplete.textRuleStrings["WIN"] = "treechildren::" + aTreeCellProperty + "(" + aStyle + ") {\
					" + aColorProperty + ": " + aColor + ";\
					}";
				cardbookAutocomplete.textRuleStrings["OSX"] = "treechildren::" + aTreeCellProperty + "(" + aStyle + ") {\
					" + aColorProperty + ": " + aColor + ";\
					}";
				var ruleIndex = aStyleSheet.insertRule(cardbookAutocomplete.textRuleStrings[aOSName], aStyleSheet.cssRules.length);
				cardbookRepository.cardbookDynamicCssRules[aStyleSheet.href].push(ruleIndex);
			}
		},

		createCssMsgAccountRules60: function (aStyleSheet, aStyle, aColor, aOSName, aUseColor, aTreeCellProperty, aColorProperty) {
			if (aUseColor) {
				cardbookAutocomplete.textRuleStrings["LINUX"] = ".autocomplete-richlistitem[type=\"" + aStyle + "\"]{\
					" + aColorProperty + ": " + aColor + ";\
					}";
				cardbookAutocomplete.textRuleStrings["WIN"] = ".autocomplete-richlistitem[type=\"" + aStyle + "\"]{\
					" + aColorProperty + ": " + aColor + ";\
					}";
				cardbookAutocomplete.textRuleStrings["OSX"] = ".autocomplete-richlistitem[type=\"" + aStyle + "\"]{\
					" + aColorProperty + ": " + aColor + ";\
					}";
				var ruleIndex = aStyleSheet.insertRule(cardbookAutocomplete.textRuleStrings[aOSName], aStyleSheet.cssRules.length);
				cardbookRepository.cardbookDynamicCssRules[aStyleSheet.href].push(ruleIndex);
			}
		},

		loadCssRules: function () {
			try {
				if (navigator.appVersion.includes("Win")) {
					var OSName="WIN";
				} else if (navigator.appVersion.includes("Mac")) {
					var OSName="OSX";
				} else {
					var OSName="LINUX";
				}
				var autocompleteWithColor = cardbookPreferences.getBoolPref("extensions.cardbook.autocompleteWithColor");
				var useColor = cardbookPreferences.getStringPref("extensions.cardbook.useColor");
				if (useColor == "text") {
					var colorProperty = "color";
					var treeCellProperty="-moz-tree-cell-text";
				} else {
					var colorProperty = "background-color";
					var treeCellProperty="-moz-tree-cell";
				}
				for (var prop in document.styleSheets) {
					var styleSheet = document.styleSheets[prop];
					if (styleSheet.href == "chrome://cardbook/skin/cardbookAutocomplete.css") {
						if (!(cardbookRepository.cardbookDynamicCssRules[styleSheet.href])) {
							cardbookRepository.cardbookDynamicCssRules[styleSheet.href] = [];
						}
						cardbookRepository.deleteCssAllRules(styleSheet);
						for (var i = 0; i < cardbookRepository.cardbookAccounts.length; i++) {
							if (cardbookRepository.cardbookAccounts[i][1] && cardbookRepository.cardbookAccounts[i][5] && cardbookRepository.cardbookAccounts[i][6] != "SEARCH") {
								var dirPrefId = cardbookRepository.cardbookAccounts[i][4];
								var myColor = cardbookPreferences.getColor(dirPrefId)
								var myStyle = cardbookRepository.getABIconType(cardbookRepository.cardbookAccounts[i][6]) + "_color_" + dirPrefId;
								if (Services.vc.compare(Services.appinfo.version, "60") >= 0) {
									cardbookAutocomplete.createCssMsgAccountRules60(styleSheet, myStyle, myColor, OSName, autocompleteWithColor, treeCellProperty, colorProperty);
								} else {
									cardbookAutocomplete.createCssMsgAccountRules(styleSheet, myStyle, myColor, OSName, autocompleteWithColor, treeCellProperty, colorProperty);
								}
							}
						}
						cardbookAutocomplete.createCssMsgIconsRules(styleSheet, OSName);
						cardbookRepository.reloadCss(styleSheet.href);
					}
				}
			}
			catch (e) {}
		},

		setCompletion: function(aTextBox) {
			try {
				if (cardbookPreferences.getBoolPref("extensions.cardbook.autocompletion")) {
					aTextBox.setAttribute('autocompletesearch', 'addrbook-cardbook');
				} else {
					aTextBox.setAttribute('autocompletesearch', 'addrbook ldap');
				}
				if (cardbookPreferences.getBoolPref("extensions.cardbook.debugMode") || cardbookPreferences.getBoolPref("extensions.cardbook.autocompleteShowAddressbook")) {
					aTextBox.showCommentColumn = true;
				} else {
					aTextBox.showCommentColumn = false;
				}
			} catch(e) {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookAutocomplete.setCompletion error : " + e, "Error");
			};
		},

		setLightningCompletion: function() {
			cardbookAutocomplete.setCompletion(document.getElementById("attendeeCol3#1"));
		},

		setMsgCompletion: function() {
			cardbookAutocomplete.setCompletion(document.getElementById("addressCol2#1"));
		}

	};
};
