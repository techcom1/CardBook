if ("undefined" == typeof(wdw_addressbooksEdit)) {
	try {
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var wdw_addressbooksEdit = {
		
		initialDateFormat: "",

		loadFnFormula: function () {
			document.getElementById("fnFormulaTextBox").value = cardbookPreferences.getFnFormula(window.arguments[0].dirPrefId);
			var strBundle = document.getElementById("cardbook-strings");
			var orgStructure = cardbookPreferences.getStringPref("extensions.cardbook.orgStructure");
			if (orgStructure != "") {
				var allOrg = cardbookUtils.unescapeArray(cardbookUtils.escapeString(orgStructure).split(";"));
			} else {
				var allOrg = [];
			}
			var myLabel = "";
			myLabel = myLabel + "{{1}} : " + strBundle.getString("prefixnameLabel") + "    ";
			myLabel = myLabel + "{{2}} : " + strBundle.getString("firstnameLabel") + "    ";
			myLabel = myLabel + "{{3}} : " + strBundle.getString("othernameLabel") + "    ";
			myLabel = myLabel + "{{4}} : " + strBundle.getString("lastnameLabel");
			document.getElementById('fnFormulaDescriptionLabel1').value = myLabel.trim();
			myLabel = "";
			myLabel = myLabel + "{{5}} : " + strBundle.getString("suffixnameLabel") + "    ";
			myLabel = myLabel + "{{6}} : " + strBundle.getString("nicknameLabel") + "    ";
			var count = 7;
			if (allOrg.length === 0) {
				myLabel = myLabel + "{{" + count + "}} : " + strBundle.getString("orgLabel");
				count++;
			} else {
				for (var i = 0; i < allOrg.length; i++) {
					myLabel = myLabel + "{{" + count + "}} : " + allOrg[i] + "    ";
					count++;
				}
			}
			document.getElementById('fnFormulaDescriptionLabel2').value = myLabel.trim();
			myLabel = "";
			myLabel = myLabel + "{{" + count + "}} : " + strBundle.getString("titleLabel") + "    ";
			count++;
			myLabel = myLabel + "{{" + count + "}} : " + strBundle.getString("roleLabel") + "    ";
			document.getElementById('fnFormulaDescriptionLabel3').value = myLabel.trim();
		},

		resetFnFormula: function () {
			document.getElementById('fnFormulaTextBox').value = cardbookRepository.defaultFnFormula;
		},

		showAutoSyncInterval: function () {
			if (document.getElementById('autoSyncCheckBox').checked) {
				document.getElementById('autoSyncInterval').disabled = false;
				document.getElementById('autoSyncIntervalTextBox').disabled = false;
			} else {
				document.getElementById('autoSyncInterval').disabled = true;
				document.getElementById('autoSyncIntervalTextBox').disabled = true;
			}
		},

		load: function () {
			wdw_addressbooksEdit.initialDateFormat = cardbookPreferences.getDateFormat(window.arguments[0].dirPrefId);

			document.getElementById("colorInput").value = cardbookPreferences.getColor(window.arguments[0].dirPrefId);
			document.getElementById("nameTextBox").value = cardbookPreferences.getName(window.arguments[0].dirPrefId);
			document.getElementById("typeTextBox").value = cardbookPreferences.getType(window.arguments[0].dirPrefId);
			document.getElementById("urlTextBox").value = cardbookPreferences.getUrl(window.arguments[0].dirPrefId);
			document.getElementById("usernameTextBox").value = cardbookPreferences.getUser(window.arguments[0].dirPrefId);
			document.getElementById("readonlyCheckBox").setAttribute('checked', cardbookPreferences.getReadOnly(window.arguments[0].dirPrefId));
			document.getElementById("vCardVersionTextBox").value = cardbookPreferences.getVCardVersion(window.arguments[0].dirPrefId);
			cardbookElementTools.loadDateFormats("dateFormatMenuPopup", "dateFormatMenuList", wdw_addressbooksEdit.initialDateFormat);
			document.getElementById("urnuuidCheckBox").setAttribute('checked', cardbookPreferences.getUrnuuid(window.arguments[0].dirPrefId));

			if (document.getElementById("typeTextBox").value == "GOOGLE" || document.getElementById("typeTextBox").value == "APPLE"
					|| document.getElementById("typeTextBox").value == "CARDDAV" || document.getElementById("typeTextBox").value == "YAHOO") {
				document.getElementById('syncTab').setAttribute("collapsed", false);
				document.getElementById("autoSyncCheckBox").setAttribute('checked', cardbookPreferences.getAutoSyncEnabled(window.arguments[0].dirPrefId));
				document.getElementById("autoSyncIntervalTextBox").value = cardbookPreferences.getAutoSyncInterval(window.arguments[0].dirPrefId);
				wdw_addressbooksEdit.showAutoSyncInterval();
			} else {
				document.getElementById('syncTab').setAttribute("collapsed", true);
			}
			
			wdw_addressbooksEdit.loadFnFormula();
		},

		save: function () {
			if (document.getElementById('dateFormatMenuList').value != wdw_addressbooksEdit.initialDateFormat) {
				cardbookDates.convertAddressBookDate(window.arguments[0].dirPrefId, document.getElementById('nameTextBox').value,
														wdw_addressbooksEdit.initialDateFormat, document.getElementById('dateFormatMenuList').value);
			}
			cardbookPreferences.setName(window.arguments[0].dirPrefId, document.getElementById('nameTextBox').value);
			cardbookPreferences.setColor(window.arguments[0].dirPrefId, document.getElementById('colorInput').value);
			cardbookPreferences.setVCardVersion(window.arguments[0].dirPrefId, document.getElementById('vCardVersionTextBox').value);
			cardbookPreferences.setReadOnly(window.arguments[0].dirPrefId, document.getElementById('readonlyCheckBox').checked);
			cardbookPreferences.setDateFormat(window.arguments[0].dirPrefId, document.getElementById('dateFormatMenuList').value);
			cardbookPreferences.setUrnuuid(window.arguments[0].dirPrefId, document.getElementById('urnuuidCheckBox').checked);
			cardbookPreferences.setAutoSyncEnabled(window.arguments[0].dirPrefId, document.getElementById('autoSyncCheckBox').checked);
			cardbookPreferences.setAutoSyncInterval(window.arguments[0].dirPrefId, document.getElementById('autoSyncIntervalTextBox').value);
			cardbookPreferences.setFnFormula(window.arguments[0].dirPrefId, document.getElementById('fnFormulaTextBox').value);
			
			if (document.getElementById('autoSyncCheckBox').checked) {
				if (!(cardbookRepository.autoSyncId[window.arguments[0].dirPrefId] != null && cardbookRepository.autoSyncId[window.arguments[0].dirPrefId] !== undefined && cardbookRepository.autoSyncId[window.arguments[0].dirPrefId] != "")) {
					cardbookSynchronization.addPeriodicSync(window.arguments[0].dirPrefId, document.getElementById('nameTextBox').value, document.getElementById('autoSyncIntervalTextBox').value);
				}
			} else {
				if (cardbookRepository.autoSyncId[window.arguments[0].dirPrefId] != null && cardbookRepository.autoSyncId[window.arguments[0].dirPrefId] !== undefined && cardbookRepository.autoSyncId[window.arguments[0].dirPrefId] != "") {
					cardbookSynchronization.removePeriodicSync(window.arguments[0].dirPrefId, document.getElementById('nameTextBox').value);
				}
			}
			
			window.arguments[0].serverCallback("SAVE", window.arguments[0].dirPrefId, document.getElementById('nameTextBox').value,
												document.getElementById('readonlyCheckBox').checked);
			close();
		},

		cancel: function () {
			window.arguments[0].serverCallback("CANCEL", window.arguments[0].dirPrefId);
			close();
		}

	};

};
