if ("undefined" == typeof(cardbookTypes)) {
	Components.utils.import("resource://gre/modules/Services.jsm");

	var cardbookTypes = {
		
		allIMPPs: [],
		
		getIMPPLineForCode: function (aCode) {
			var serviceLine = [];
			myPrefResults = cardbookPreferences.getAllIMPPs();
			for (var i = 0; i < myPrefResults.length; i++) {
				if (aCode.toLowerCase() == myPrefResults[i][0].toLowerCase()) {
					serviceLine = [myPrefResults[i][0], myPrefResults[i][1], myPrefResults[i][2]];
					break;
				}
			}
			return serviceLine;
		},

		getIMPPLineForProtocol: function (aProtocol) {
			var serviceLine = [];
			myPrefResults = cardbookPreferences.getAllIMPPs();
			for (var i = 0; i < myPrefResults.length; i++) {
				if (aProtocol.toLowerCase() == myPrefResults[i][2].toLowerCase()) {
					serviceLine = [myPrefResults[i][0], myPrefResults[i][1], myPrefResults[i][2]];
					break;
				}
			}
			return serviceLine;
		},

		getIMPPCode: function (aInputTypes) {
			var serviceCode = "";
			for (var j = 0; j < aInputTypes.length; j++) {
				serviceCode = aInputTypes[j].replace(/^X-SERVICE-TYPE=/i, "");
				if (serviceCode != aInputTypes[j]) {
					break;
				} else {
					serviceCode = "";
				}
			}
			return serviceCode;
		},

		getIMPPProtocol: function (aCardValue) {
			var serviceProtocol = "";
			if (aCardValue[0].indexOf(":") >= 0) {
				serviceProtocol = aCardValue[0].split(":")[0];
			}
			return serviceProtocol;
		},

		loadIMPPs: function (aArray) {
			var myPrefResults = [];
			myPrefResults = cardbookPreferences.getAllIMPPs();
			var serviceCode = "";
			var serviceProtocol = "";
			for (var i = 0; i < aArray.length; i++) {
				serviceCode = cardbookTypes.getIMPPCode(aArray[i][1]);
				serviceProtocol = cardbookTypes.getIMPPProtocol(aArray[i][0]);
				if (serviceCode != "" || serviceProtocol != "") {
					var found = false;
					for (var j = 0; j < myPrefResults.length; j++) {
						if (serviceCode != "") {
							if (myPrefResults[j][0].toLowerCase() == serviceCode.toLowerCase()) {
								found = true;
								break;
							}
						} else if (serviceProtocol != "") {
							if (myPrefResults[j][2].toLowerCase() == serviceProtocol.toLowerCase()) {
								found = true;
								break;
							}
						}
					}
					if (!found) {
						if (serviceCode == "") {
							myPrefResults.push([serviceProtocol, serviceProtocol, serviceProtocol]);
						} else if (serviceProtocol == "") {
							myPrefResults.push([serviceCode, serviceCode, serviceCode]);
						} else {
							myPrefResults.push([serviceCode, serviceCode, serviceProtocol]);
						}
					}
				}
			}
			cardbookTypes.allIMPPs = JSON.parse(JSON.stringify(myPrefResults));
			cardbookTypes.allIMPPs = cardbookUtils.sortArrayByString(cardbookTypes.allIMPPs,1,1);
		},

		validateDynamicTypes: function () {
			var limit = 100;
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				if (document.getElementById(typesList[i] + 'Groupbox')) {
					var aListRows = document.getElementById(typesList[i] + 'Groupbox');
					var j = 0;
					while (true) {
						if (document.getElementById(typesList[i] + '_' + j + '_prefWeightBox')) {
							var field = document.getElementById(typesList[i] + '_' + j + '_prefWeightBoxLabel').value.toLowerCase();
							var data = document.getElementById(typesList[i] + '_' + j + '_prefWeightBox').value;
							var dummy = data.replace(/[0-9]*/g, "");
							if (data == "") {
								j++;
								continue;
							} else if (dummy == "") {
								if (data >=1 && data <= limit) {
									j++;
									continue;
								}
							}
							var strBundle = document.getElementById("cardbook-strings");
							var errorTitle = strBundle.getString("errorTitle");
							var validateIntegerMsg = strBundle.getFormattedString("validateIntegerMsg", [field, limit, data]);
							Services.prompt.alert(null, errorTitle, validateIntegerMsg);
							return false;
						} else {
							break;
						}
					}
				}
			}
			return true;
		},

		validateMailPopularity: function () {
			var limit = 100000;
			var i = 0;
			while (true) {
				if (document.getElementById('mailPopularity_' + i + '_row')) {
					var field = document.getElementById('mailPopularityTab').label.toLowerCase();
					var data = document.getElementById('popularity_' + i + '_Textbox').value;
					var dummy = data.replace(/[0-9]*/g, "");
					if (data == "") {
						i++;
						continue;
					} else if (dummy == "") {
						if (data >=1 && data <= limit) {
							i++;
							continue;
						}
					}
					var strBundle = document.getElementById("cardbook-strings");
					var errorTitle = strBundle.getString("errorTitle");
					var validateIntegerMsg = strBundle.getFormattedString("validateIntegerMsg", [field, limit, data]);
					Services.prompt.alert(null, errorTitle, validateIntegerMsg);
					return false;
				} else {
					break;
				}
			}
			return true;
		},

		getTypeForLine: function (aType, aIndex) {
			var myLineResult = [];
			var myLineTypeResult = [];
			
			var myPrefButton = document.getElementById(aType + '_' + aIndex + '_PrefImage');
			if (document.getElementById('versionTextBox').value === "4.0") {
				if (myPrefButton.getAttribute('haspref')) {
					var aPrefWeightBoxValue = document.getElementById(aType + '_' + aIndex + '_prefWeightBox').value;
					if (aPrefWeightBoxValue != null && aPrefWeightBoxValue !== undefined && aPrefWeightBoxValue != "") {
						myLineTypeResult.push("PREF=" + aPrefWeightBoxValue);
					} else {
						myLineTypeResult.push("PREF");
					}
				}
			} else {
				if (myPrefButton.getAttribute('haspref')) {
					myLineTypeResult.push("TYPE=PREF");
				}
			}

			var myLineOtherType = document.getElementById(aType + '_' + aIndex + '_othersTypesBox').value;
			if (myLineOtherType != null && myLineOtherType !== undefined && myLineOtherType != "") {
				myLineTypeResult = myLineTypeResult.concat(myLineOtherType.split(','));
			}
			
			var myLineTypeType = [];
			var myLinepgTypeType = [];
			var myPanel = document.getElementById(aType + '_' + aIndex + '_PanelType');
			if (myPanel) {
				if (myPanel.types) {
					for (var i = 0; i < myPanel.types.length; i++) {
						myLineTypeType.push("TYPE=" + myPanel.types[i]);
					}
				}
				if (myPanel.pg) {
					for (var i = 0; i < myPanel.pg.length; i++) {
						myLinepgTypeType = JSON.parse(JSON.stringify(myPanel.pg));
					}
				}
			}
			if (myLineTypeType.length > 0) {
				myLineTypeResult = myLineTypeResult.concat(myLineTypeType);
				myLineTypeResult = cardbookUtils.unescapeArray(cardbookUtils.formatTypes(cardbookUtils.escapeArray(myLineTypeResult)));
				var myOutputPg = [];
				var myPgName = "";
			} else if (myLinepgTypeType.length > 0) {
				var myOutputPg = [myLinepgTypeType[0][1]];
				var myPgName = myLinepgTypeType[0][0];
			} else {
				var myOutputPg = [];
				var myPgName = "";
			}
			
			if (aType == "adr") {
				var j = 0;
				var myLineTypeValue = [];
				while (true) {
					if (document.getElementById(aType + '_' + aIndex + '_valueBox_' + j)) {
						var myTypeValue = document.getElementById(aType + '_' + aIndex + '_valueBox_' + j).value.replace(/\\n/g, "\n").trim();
						myLineTypeValue.push(myTypeValue);
						j++;
					} else {
						break;
					}
				}
			} else {
				var myLineTypeValue = [document.getElementById(aType + '_' + aIndex + '_valueBox').value.trim()];
			}
			
			if (aType == "impp" && document.getElementById(aType + '_' + aIndex + '_menulistIMPP').selectedItem) {
				return [myLineTypeValue, myLineTypeResult, myPgName, myOutputPg, document.getElementById(aType + '_' + aIndex + '_menulistIMPP').selectedItem.value];
			} else {
				return [myLineTypeValue, myLineTypeResult, myPgName, myOutputPg, ""];
			}
		},

		getIMPPTypes: function () {
			var i = 0;
			var myResult = [];
			while (true) {
				if (document.getElementById('impp_' + i + '_hbox')) {
					var lineResult = cardbookTypes.getTypeForLine('impp', i);
					if (lineResult[0].join("") != "") {
						function removeServiceType(element) {
							return (element == element.replace(/^X-SERVICE-TYPE=/i, ""));
						}
						lineResult[1] = lineResult[1].filter(removeServiceType);
						lineResult[1].push("X-SERVICE-TYPE=" + lineResult[4]);

						var myValue = lineResult[0].join(" ");
						serviceLine = cardbookTypes.getIMPPLineForCode(lineResult[4])
						if (serviceLine[0]) {
							var myRegexp = new RegExp("^" + serviceLine[2] + ":");
							myValue = myValue.replace(myRegexp, "");
							myValue = serviceLine[2] + ":" + myValue;
						}
						myResult.push([[myValue], lineResult[1], "", []]);
					}
					i++;
				} else {
					break;
				}
			}
			return myResult;
		},

		getAllTypes: function (aType, aRemoveNull) {
			var i = 0;
			var myResult = [];
			while (true) {
				if (document.getElementById(aType + '_' + i + '_hbox')) {
					var lineResult = cardbookTypes.getTypeForLine(aType, i);
					if (lineResult[0].join("") != "" || !aRemoveNull) {
						myResult.push(lineResult);
					}
					i++;
				} else {
					break;
				}
			}
			return myResult;
		},

		disableButtons: function (aType, aIndex, aVersion) {
			if (aIndex == 0) {
				if (document.getElementById(aType + '_' + aIndex + '_valueBox').value == "") {
					document.getElementById(aType + '_' + aIndex + '_' + aVersion + '_cardbookremoveButton').disabled = true;
					document.getElementById(aType + '_' + aIndex + '_' + aVersion + '_cardbookaddButton').disabled = true;
				} else {
					document.getElementById(aType + '_' + aIndex + '_' + aVersion + '_cardbookaddButton').disabled = false;
					document.getElementById(aType + '_' + aIndex + '_' + aVersion + '_cardbookremoveButton').disabled = false;
				}
			} else {
				document.getElementById(aType + '_0_' + aVersion + '_cardbookremoveButton').disabled = false;
				for (var i = 0; i < aIndex; i++) {
					document.getElementById(aType + '_' + i + '_' + aVersion + '_cardbookaddButton').disabled = true;
					document.getElementById(aType + '_' + i + '_' + aVersion + '_cardbookdownButton').disabled = false;
				}
			}
			document.getElementById(aType + '_' + aIndex + '_' + aVersion + '_cardbookdownButton').disabled = true;
			document.getElementById(aType + '_0_' + aVersion + '_cardbookupButton').disabled = true;
		},

		findNextLine: function (aType) {
			var i = 0;
			while (true) {
				if (document.getElementById(aType + '_' + i + '_hbox') || document.getElementById(aType + '_' + i + '_row')) {
					i++;
				} else {
					return i;
				}
			}
		},

		constructDynamicRows: function (aType, aArray, aVersion) {
			var start = cardbookTypes.findNextLine(aType);
			for (var i = 0; i < aArray.length; i++) {
				cardbookTypes.loadDynamicTypes(aType, i+start, aArray[i][1], aArray[i][2], aArray[i][3], aArray[i][0], aVersion);
			}
			if (aArray.length == 0) {
				cardbookTypes.loadDynamicTypes(aType, start, [], "", [], [""], aVersion);
			}
		},

		constructStaticRows: function (aType, aArray, aVersion, aFollowLink) {
			for (var i = 0; i < aArray.length; i++) {
				cardbookTypes.loadStaticTypes(aType, i, aArray[i][1], aArray[i][2], aArray[i][3], aArray[i][0], aVersion, aFollowLink);
			}
		},

		display40: function (aVersion) {
			var usePreferenceValue = cardbookPreferences.getBoolPref("extensions.cardbook.usePreferenceValue");
			var typesList = [ 'email', 'tel', 'impp', 'url', 'adr' ];
			for (var i in typesList) {
				if (document.getElementById(typesList[i] + 'Groupbox')) {
					var j = 0;
					while (true) {
						if (document.getElementById(typesList[i] + '_' + j + '_prefWeightBox')) {
							var myPrefWeightBoxLabel = document.getElementById(typesList[i] + '_' + j + '_prefWeightBoxLabel');
							var myPrefWeightBox = document.getElementById(typesList[i] + '_' + j + '_prefWeightBox');
							if (aVersion === "4.0" && usePreferenceValue) {
								myPrefWeightBoxLabel.removeAttribute('hidden');
								myPrefWeightBox.removeAttribute('hidden');
							} else {
								myPrefWeightBoxLabel.setAttribute('hidden', 'true');
								myPrefWeightBox.setAttribute('hidden', 'true');
							}
							if (document.getElementById(typesList[i] + '_' + j + '_PrefImage').getAttribute('haspref')) {
								myPrefWeightBoxLabel.removeAttribute('readonly');
							} else {
								myPrefWeightBoxLabel.setAttribute('readonly', 'true');
							}
							j++;
						} else {
							break;
						}
					}
				}
			}
		},

		constructOrg: function (aReadOnly, aOrgValue, aTitleValue, aRoleValue) {
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById('orgRows');
			var orgStructure = cardbookPreferences.getStringPref("extensions.cardbook.orgStructure");
			var currentRow;
			if (orgStructure != "") {
				var myOrgStructure = cardbookUtils.unescapeArray(cardbookUtils.escapeString(orgStructure).split(";"));
				var myOrgValue = cardbookUtils.unescapeArray(cardbookUtils.escapeString(aOrgValue).split(";"));
				for (var i = 0; i < myOrgStructure.length; i++) {
					var myValue = "";
					if (myOrgValue[i]) {
						myValue = myOrgValue[i];
					}
					if (aReadOnly) {
						if (myValue != "") {
							currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow_' + i);
							cardbookTypes.addLabel(currentRow, 'orgLabel_' + i, myOrgStructure[i], 'orgTextBox_' + i, {class: 'header'});
							cardbookElementTools.addTextbox(currentRow, 'orgTextBox_' + i, myValue, {flex: '1', readonly: 'true'});
						}
					} else {
						currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow_' + i);
						cardbookTypes.addLabel(currentRow, 'orgLabel_' + i, myOrgStructure[i], 'orgTextBox_' + i, {class: 'header'});
						var myTextBox = cardbookElementTools.addTextbox(currentRow, 'orgTextBox_' + i, myValue, {flex: '1', type: 'autocomplete', autocompletesearch: 'form-history', autocompletesearchparam: 'orgTextBox_' + i, class:'padded'});
						myTextBox.addEventListener("input", wdw_cardEdition.setDisplayName, false);
					}
				}
			} else {
				var myOrgValue = cardbookUtils.unescapeString(cardbookUtils.escapeString(aOrgValue));
				if (aReadOnly) {
					if (myOrgValue != "") {
						currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow_0');
						cardbookTypes.addLabel(currentRow, 'orgLabel', strBundle.getString("orgLabel"), 'orgTextBox_0', {class: 'header'});
						cardbookElementTools.addTextbox(currentRow, 'orgTextBox_0', myOrgValue, {flex: '1', readonly: 'true'});
					}
				} else {
					currentRow = cardbookTypes.addRow(aOrigBox, 'orgRow_0');
					cardbookTypes.addLabel(currentRow, 'orgLabel', strBundle.getString("orgLabel"), 'orgTextBox_0', {class: 'header'});
					var myTextBox = cardbookElementTools.addTextbox(currentRow, 'orgTextBox_0', myOrgValue, {flex: '1', type: 'autocomplete', autocompletesearch: 'form-history', autocompletesearchparam: 'orgTextBox_0', class:'padded'});
					myTextBox.addEventListener("input", wdw_cardEdition.setDisplayName, false);
				}
			}
			if (aReadOnly) {
				if (aTitleValue != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'titleRow');
					cardbookTypes.addLabel(currentRow, 'titleLabel', strBundle.getString("titleLabel"), 'titleTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'titleTextBox', aTitleValue, {flex: '1', readonly: 'true'});
				}
				if (aRoleValue != "") {
					currentRow = cardbookTypes.addRow(aOrigBox, 'roleRow');
					cardbookTypes.addLabel(currentRow, 'roleLabel', strBundle.getString("roleLabel"), 'roleTextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, 'roleTextBox', aRoleValue, {flex: '1', readonly: 'true'});
				}
			} else {
				currentRow = cardbookTypes.addRow(aOrigBox, 'titleRow');
				cardbookTypes.addLabel(currentRow, 'titleLabel', strBundle.getString("titleLabel"), 'titleTextBox', {class: 'header'});
				var myTextBox = cardbookElementTools.addTextbox(currentRow, 'titleTextBox', aTitleValue, {flex: '1', type: 'autocomplete', autocompletesearch: 'form-history', autocompletesearchparam: 'titleTextBox', class:'padded'});
				myTextBox.addEventListener("input", wdw_cardEdition.setDisplayName, false);
				currentRow = cardbookTypes.addRow(aOrigBox, 'roleRow');
				cardbookTypes.addLabel(currentRow, 'roleLabel', strBundle.getString("roleLabel"), 'roleTextBox', {class: 'header'});
				var myTextBox = cardbookElementTools.addTextbox(currentRow, 'roleTextBox', aRoleValue, {flex: '1', type: 'autocomplete', autocompletesearch: 'form-history', autocompletesearchparam: 'roleTextBox', class:'padded'});
				myTextBox.addEventListener("input", wdw_cardEdition.setDisplayName, false);
			}
		},

		constructCustom: function (aReadOnly, aType, aOtherValue) {
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById(aType + 'Rows');

			var othersTemp = JSON.parse(JSON.stringify(aOtherValue));
			var result = [];
			result = cardbookRepository.customFields[aType];
			for (let i = 0; i < result.length; i++) {
				var myCode = result[i][0];
				var myLabel = result[i][1];
				var myField = 'customField' + i + aType;
				var myValue = '';
				for (var j = 0; j < othersTemp.length; j++) {
					var othersTempArray = othersTemp[j].split(":");
					if (myCode == othersTempArray[0]) {
						var myValue = othersTempArray[1];
						break;
					}
				}
				var dummy = othersTemp.splice(j,1);
				j--;
				if (aReadOnly) {
					if (myValue != "") {
						currentRow = cardbookTypes.addRow(aOrigBox, myField + 'Row');
						cardbookTypes.addLabel(currentRow, myField + 'Label', myLabel, myField + 'TextBox', {class: 'header'});
						cardbookElementTools.addTextbox(currentRow, myField + 'TextBox', myValue, {flex: '1', readonly: 'true'});
					}
				} else {
					currentRow = cardbookTypes.addRow(aOrigBox, myField + 'Row');
					cardbookTypes.addLabel(currentRow, myField + 'Label', myLabel, myField + 'TextBox', {class: 'header'});
					cardbookElementTools.addTextbox(currentRow, myField + 'TextBox', myValue, {flex: '1'});
				}
			}
			return othersTemp;
		},

		addRow: function (aOrigBox, aId) {
			var aRow = document.createElement('row');
			aOrigBox.appendChild(aRow);
			aRow.setAttribute('id', aId);
			aRow.setAttribute('align', 'center');
			return aRow;
		},

		addLabel: function (aOrigBox, aId, aValue, aControl, aParameters) {
			var aLabel = document.createElement('label');
			aOrigBox.appendChild(aLabel);
			aLabel.setAttribute('id', aId);
			aLabel.setAttribute('value', aValue);
			aLabel.setAttribute('control', aControl);
			for (var prop in aParameters) {
				aLabel.setAttribute(prop, aParameters[prop]);
			}
		},

		loadDynamicTypes: function (aType, aIndex, aInputTypes, aPgName, aPgType, aCardValue, aVersion) {
			var strBundle = document.getElementById("cardbook-strings");
			var aOrigBox = document.getElementById(aType + 'Groupbox');
			
			if (aIndex == 0) {
				cardbookElementTools.addCaption(aType, aOrigBox);
			}
			
			var aHBox = cardbookElementTools.addHBox(aType, aIndex, aOrigBox);

			var myPrefTypes = [];
			myPrefTypes = cardbookPreferences.getAllTypesByType(aType);
			var myInputTypes = [];
			myInputTypes = cardbookUtils.getOnlyTypesFromTypes(aInputTypes);
			var myOthersTypes = cardbookUtils.getNotTypesFromTypes(aInputTypes);
			
			var aPrefButton = cardbookElementTools.addPrefStar(aHBox, aType, aIndex, cardbookUtils.getPrefBooleanFromTypes(aInputTypes))
			
			cardbookTypes.addLabel(aHBox, aType + '_' + aIndex + '_prefWeightBoxLabel', cardbookPreferences.getPrefValueLabel(), aType + '_' + aIndex + '_prefWeightBox', {tooltip: strBundle.getString("prefWeightTooltip")});
			cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_prefWeightBox', cardbookUtils.getPrefValueFromTypes(aInputTypes, document.getElementById('versionTextBox').value), {size: "5"});
			if (aPrefButton.getAttribute('haspref')) {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').disabled = false;
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').disabled = false;
			} else {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').disabled = true;
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').disabled = true;
			}

			var usePreferenceValue = cardbookPreferences.getBoolPref("extensions.cardbook.usePreferenceValue");
			if (document.getElementById('versionTextBox').value === "4.0" && usePreferenceValue) {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').removeAttribute('hidden');
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').removeAttribute('hidden');
			} else {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBoxLabel').setAttribute('hidden', 'true');
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('hidden', 'true');
			}

			cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_othersTypesBox', myOthersTypes, {hidden: "true"});

			var myArrayTypes = [];
			var myCheckedArrayTypes = [];
			for (var i = 0; i < myPrefTypes.length; i++) {
				myArrayTypes.push([myPrefTypes[i][1], myPrefTypes[i][0]]);
				for (var j = 0; j < myInputTypes.length; j++) {
					if (myInputTypes[j].toLowerCase() == myPrefTypes[i][0].toLowerCase()) {
						myCheckedArrayTypes.push(myPrefTypes[i][0]);
						var removed = myInputTypes.splice(j, 1);
						break;
					}
				}
				for (var j = 0; j < aPgType.length; j++) {
					if (aPgType[j].toLowerCase() == myPrefTypes[i][0].toLowerCase()) {
						myCheckedArrayTypes.push(myPrefTypes[i][0]);
						break;
					}
				}
			}
			for (var j = 0; j < myInputTypes.length; j++) {
				myArrayTypes.push([myInputTypes[j], myInputTypes[j]]);
				myCheckedArrayTypes.push(myInputTypes[j]);
			}
			if (aPgType.length != 0 && aPgName != "") {
				myArrayTypes.push([aPgType[0], aPgName, aPgName]);
				myCheckedArrayTypes.push(aPgName);
			}
			cardbookElementTools.addMenuTypelist(aHBox, aType, aIndex, myArrayTypes, myCheckedArrayTypes);

			if (aType == "impp") {
				var serviceCode = cardbookTypes.getIMPPCode(aInputTypes);
				var serviceProtocol = cardbookTypes.getIMPPProtocol(aCardValue);
				cardbookElementTools.addMenuIMPPlist(aHBox, aType, aIndex, cardbookTypes.allIMPPs, serviceCode, serviceProtocol);
				var myValue = aCardValue.join(" ");
				if (serviceCode != "") {
					var serviceLine = [];
					serviceLine = cardbookTypes.getIMPPLineForCode(serviceCode)
					if (serviceLine[0]) {
						var myRegexp = new RegExp("^" + serviceLine[2] + ":");
						myValue = myValue.replace(myRegexp, "");
					}
				} else if (serviceProtocol != "") {
					var serviceLine = [];
					serviceLine = cardbookTypes.getIMPPLineForProtocol(serviceProtocol)
					if (serviceLine[0]) {
						var myRegexp = new RegExp("^" + serviceLine[2] + ":");
						myValue = myValue.replace(myRegexp, "");
					}
				}
				cardbookElementTools.addKeyTextbox(aHBox, aType + '_' + aIndex + '_valueBox', myValue, {flex: "1"}, aVersion, aIndex);
			} else if (aType == "adr") {
				var myTmpArray = [];
				for (var i = 0; i < aCardValue.length; i++) {
					if (aCardValue[i] != "") {
						myTmpArray.push(aCardValue[i].replace(/\n/g, " "));
					}
				}
				cardbookElementTools.addKeyTextbox(aHBox, aType + '_' + aIndex + '_valueBox', myTmpArray.join(" "), {flex: "1"}, aVersion, aIndex);
			} else {
				cardbookElementTools.addKeyTextbox(aHBox, aType + '_' + aIndex + '_valueBox', cardbookUtils.cleanArray(aCardValue).join(" "), {flex: "1"}, aVersion, aIndex);
			}

			if (aType == "adr") {
				function fireEditAdr(event) {
					var myIdArray = this.id.split('_');
					var myTempResult = cardbookTypes.getTypeForLine(myIdArray[0], myIdArray[1]);
					if (myTempResult.length == 0) {
						var adrLine = [ ["", "", "", "", "", "", ""], [""], "", [""] ];
					} else {
						var adrLine = myTempResult;
					}
					wdw_cardEdition.openAdrPanel(adrLine, myIdArray);
				};
				document.getElementById(aType + '_' + aIndex + '_valueBox').addEventListener("click", fireEditAdr, false);
				document.getElementById(aType + '_' + aIndex + '_valueBox').addEventListener("input", fireEditAdr, false);

				let i = 0;
				while ( i < 7 ) {
					if (aCardValue[i]) {
						cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_valueBox_' + i, aCardValue[i].replace(/\n/g, "\\n"), {hidden: "true"});
					} else {
						cardbookElementTools.addTextbox(aHBox, aType + '_' + aIndex + '_valueBox_' + i, "", {hidden: "true"});
					}
					i++;
				}
			}
		
			function fireUpButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0], false);
				if (myAllValuesArray.length <= 1) {
					return;
				}
				var temp = myAllValuesArray[myIdArray[1]*1-1];
				myAllValuesArray[myIdArray[1]*1-1] = myAllValuesArray[myIdArray[1]];
				myAllValuesArray[myIdArray[1]] = temp;
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "up", fireUpButton);
			
			function fireDownButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0], false);
				if (myAllValuesArray.length <= 1) {
					return;
				}
				var temp = myAllValuesArray[myIdArray[1]*1+1];
				myAllValuesArray[myIdArray[1]*1+1] = myAllValuesArray[myIdArray[1]];
				myAllValuesArray[myIdArray[1]] = temp;
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "down", fireDownButton);

			function fireRemoveButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myAllValuesArray = cardbookTypes.getAllTypes(myIdArray[0], false);
				cardbookElementTools.deleteRowsType(myIdArray[0]);
				if (myAllValuesArray.length == 0) {
					cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
				} else {
					var removed = myAllValuesArray.splice(myIdArray[1], 1);
					cardbookTypes.constructDynamicRows(myIdArray[0], myAllValuesArray, myIdArray[2]);
				}
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "remove", fireRemoveButton);
			
			function fireAddButton(event) {
				if (document.getElementById(this.id).disabled) {
					return;
				}
				var myIdArray = this.id.split('_');
				var myValue = document.getElementById(myIdArray[0] + '_' + myIdArray[1] + '_valueBox').value;
				if (myValue == "") {
					return;
				}
				var myNextIndex = 1+ 1*myIdArray[1];
				cardbookTypes.loadDynamicTypes(myIdArray[0], myNextIndex, [], "", [], [""], myIdArray[2]);
			};
			cardbookElementTools.addEditButton(aHBox, aType, aIndex, aVersion, "add", fireAddButton);

			cardbookTypes.disableButtons(aType, aIndex, aVersion);
		},

		loadStaticTypes: function (aType, aIndex, aInputTypes, aPgName, aPgType, aCardValue, aVersion, aFollowLink) {
			if (aCardValue.join(" ") == "") {
				return;
			}
			var panesView = cardbookPreferences.getStringPref("extensions.cardbook.panesView");
			var aOrigBox = document.getElementById(aType + panesView + 'Groupbox');

			if (aIndex == 0) {
				cardbookElementTools.addCaption(aType, aOrigBox);
			}
			
			var aRow = cardbookElementTools.addGridRow(aType, aIndex, aOrigBox, {align: 'start'});

			var myInputTypes = [];
			myInputTypes = cardbookUtils.getOnlyTypesFromTypes(aInputTypes);
			var myDisplayedTypes = [];
			for (let i = 0; i < myInputTypes.length; i++) {
				myDisplayedTypes.push(cardbookPreferences.getTypeLabel(aType, myInputTypes[i]));
			}
			if (aPgType[0]) {
				myDisplayedTypes.push(aPgType[0]);
			}
			
			var aPrefImage = document.createElement('image');
			aRow.appendChild(aPrefImage);
			aPrefImage.setAttribute('id', aType + '_' + aIndex + '_PrefImage');
			if (cardbookUtils.getPrefBooleanFromTypes(aInputTypes)) {
				aPrefImage.setAttribute('class', 'cardbookPrefStarClass');
				aPrefImage.setAttribute('haspref', 'true');
			} else {
				aPrefImage.setAttribute('class', 'cardbookNoPrefStarClass');
				aPrefImage.removeAttribute('haspref');
			}

			var myContextMenu = '';
			if (aFollowLink) {
				myContextMenu = aType + 'TreeContextMenu';
			}
			cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_prefWeightBox', cardbookUtils.getPrefValueFromTypes(aInputTypes, document.getElementById('versionTextBox').value),
										{readonly: 'true'});
			if (document.getElementById('versionTextBox').value === "4.0") {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('hidden', 'false');
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('width', '3');
			} else {
				document.getElementById(aType + '_' + aIndex + '_prefWeightBox').setAttribute('hidden', 'true');
			}

			var myValueTextbox;
			if (aType == "impp") {
				var serviceCode = cardbookTypes.getIMPPCode(aInputTypes);
				var serviceProtocol = cardbookTypes.getIMPPProtocol(aCardValue);
				var myValue = aCardValue.join(" ");
				if (serviceCode != "") {
					var serviceLine = [];
					serviceLine = cardbookTypes.getIMPPLineForCode(serviceCode)
					if (serviceLine[0]) {
						myDisplayedTypes = myDisplayedTypes.concat(serviceLine[1]);
						cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', cardbookUtils.formatTypesForDisplay(myDisplayedTypes), {readonly: 'true'});
						var myRegexp = new RegExp("^" + serviceLine[2] + ":");
						myValue = myValue.replace(myRegexp, "");
						myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', myValue, {context: myContextMenu, flex: '1'});
						myValueTextbox.setAttribute('link', 'true');
					} else {
						myDisplayedTypes = myDisplayedTypes.concat(serviceCode);
						cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', cardbookUtils.formatTypesForDisplay(myDisplayedTypes), {readonly: 'true'});
						myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', myValue, {context: myContextMenu, flex: '1'});
						myValueTextbox.setAttribute('readonly', 'true');
					}
				} else if (serviceProtocol != "") {
					var serviceLine = [];
					serviceLine = cardbookTypes.getIMPPLineForProtocol(serviceProtocol)
					if (serviceLine[0]) {
						myDisplayedTypes = myDisplayedTypes.concat(serviceLine[1]);
						cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', cardbookUtils.formatTypesForDisplay(myDisplayedTypes), {readonly: 'true'});
						var myRegexp = new RegExp("^" + serviceLine[2] + ":");
						myValue = myValue.replace(myRegexp, "");
						myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', myValue, {context: myContextMenu, flex: '1'});
						myValueTextbox.setAttribute('link', 'true');
					} else {
						myDisplayedTypes = myDisplayedTypes.concat(serviceCode);
						cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', cardbookUtils.formatTypesForDisplay(myDisplayedTypes), {readonly: 'true'});
						myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', myValue, {context: myContextMenu, flex: '1'});
						myValueTextbox.setAttribute('readonly', 'true');
					}
				} else {
					cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', cardbookUtils.formatTypesForDisplay(myDisplayedTypes), {readonly: 'true'});
					myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', myValue, {context: myContextMenu, flex: '1'});
					myValueTextbox.setAttribute('readonly', 'true');
				}
			} else {
				cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_typeBox', cardbookUtils.formatTypesForDisplay(myDisplayedTypes), {readonly: 'true'});
	
				if (aType == "adr") {
					var re = /[\n\u0085\u2028\u2029]|\r\n?/;
					var myAdrResult = cardbookUtils.formatAddress(aCardValue);
					var myAdrResultArray = myAdrResult.split(re);
					myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', myAdrResult, {context: myContextMenu,
																								multiline: 'true', wrap: 'virtual', rows: myAdrResultArray.length});
				} else {
					myValueTextbox = cardbookElementTools.addTextbox(aRow, aType + '_' + aIndex + '_valueBox', cardbookUtils.cleanArray(aCardValue).join(" "), {context: myContextMenu, flex: '1'});
				}
				if (aType == "url" || aType == "email" || aType == "adr") {
					myValueTextbox.setAttribute('link', 'true');
				} else if (aType == "tel") {
					var telProtocol = "";
					try {
						var telProtocol = cardbookPreferences.getStringPref("extensions.cardbook.tels.0");
						myValueTextbox.setAttribute('link', 'true');
					}
					catch(e) {
						myValueTextbox.setAttribute('readonly', 'true');
					}
				}
			}
			if (aFollowLink) {
				function fireClick(event) {
					if (wdw_cardbook) {
						wdw_cardbook.chooseActionTreeForClick(event)
					}
				};
				myValueTextbox.addEventListener("click", fireClick, false);
			}
		},

		loadMailPopularity: function (aCard, aReadOnly) {
			var myEmails = [];
			if (aCard.isAList) {
				myEmails.push(aCard.fn.toLowerCase());
			} else {
				for (var i = 0; i < aCard.email.length; i++) {
					myEmails.push(aCard.email[i][0][0].toLowerCase());
				}
			}

			for (var i = 0; i < myEmails.length; i++) {
				var aOrigBox = document.getElementById('mailPopularityGroupbox');

				if (i == 0) {
					cardbookElementTools.addCaption('mailPopularity', aOrigBox);
				}

				var aRow = document.createElement('row');
				aOrigBox.appendChild(aRow);
				aRow.setAttribute('id', 'mailPopularity_' + i + '_row');
				aRow.setAttribute('flex', '1');
				aRow.setAttribute('align', 'center');

				if (aReadOnly) {
					var aImage = document.createElement('image');
					aRow.appendChild(aImage);
					aImage.setAttribute('id', 'dummyMailPopularityPrefBox_' + i);
					aImage.setAttribute('class', 'cardbookNoPrefStarClass');
				}

				if (cardbookRepository.cardbookMailPopularityIndex[myEmails[i]]) {
					var mailPopularityValue = cardbookRepository.cardbookMailPopularityIndex[myEmails[i]];
				} else {
					var mailPopularityValue = "";
				}
				if (aReadOnly) {
					cardbookElementTools.addTextbox(aRow, 'popularity_' + i + '_Textbox', mailPopularityValue, {flex: '1', readonly: 'true'});
					cardbookElementTools.addTextbox(aRow, 'email_' + i + '_Textbox', myEmails[i], {flex: '1', readonly: 'true'});
				} else {
					cardbookElementTools.addTextbox(aRow, 'popularity_' + i + '_Textbox', mailPopularityValue, {flex: '1'});
					cardbookElementTools.addTextbox(aRow, 'email_' + i + '_Textbox', myEmails[i], {flex: '1'});
				}
			}
		},

		loadStaticList: function (aCard, aFollowLink) {
			var addedCards = [];
			if (aCard.version == "4.0") {
				for (var i = 0; i < aCard.member.length; i++) {
					var uid = aCard.member[i].replace("urn:uuid:", "");
					if (cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+uid]) {
						var cardFound = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+uid];
						if (cardFound.isAList) {
							addedCards.push([cardbookUtils.getName(cardFound), [""], cardFound.dirPrefId+"::"+cardFound.uid]);
						} else {
							addedCards.push([cardbookUtils.getName(cardFound), cardFound.emails, cardFound.dirPrefId+"::"+cardFound.uid]);
						}
					}
				}
			} else if (aCard.version == "3.0") {
				var kindCustom = cardbookPreferences.getStringPref("extensions.cardbook.kindCustom");
				var memberCustom = cardbookPreferences.getStringPref("extensions.cardbook.memberCustom");
				for (var i = 0; i < aCard.others.length; i++) {
					var localDelim1 = aCard.others[i].indexOf(":",0);
					if (localDelim1 >= 0) {
						var header = aCard.others[i].substr(0,localDelim1);
						var trailer = aCard.others[i].substr(localDelim1+1,aCard.others[i].length);
						if (header == memberCustom) {
							if (cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")]) {
								var cardFound = cardbookRepository.cardbookCards[aCard.dirPrefId+"::"+trailer.replace("urn:uuid:", "")];
								if (cardFound.isAList) {
									addedCards.push([cardbookUtils.getName(cardFound), [""], cardFound.dirPrefId+"::"+cardFound.uid]);
								} else {
									addedCards.push([cardbookUtils.getName(cardFound), cardFound.emails, cardFound.dirPrefId+"::"+cardFound.uid]);
								}
							}
						}
					}
				}
			}

			for (var i = 0; i < addedCards.length; i++) {
				var aOrigBox = document.getElementById('addedCardsGroupbox');

				if (i == 0) {
					cardbookElementTools.addCaption('addedCards', aOrigBox);
				}

				var aRow = document.createElement('row');
				aOrigBox.appendChild(aRow);
				aRow.setAttribute('id', 'addedCards_' + i + '_row');
				aRow.setAttribute('flex', '1');
				aRow.setAttribute('align', 'center');

				var aImage = document.createElement('image');
				aRow.appendChild(aImage);
				aImage.setAttribute('id', 'dummyListPrefBox_' + i);
				aImage.setAttribute('class', 'cardbookNoPrefStarClass');

				cardbookElementTools.addTextbox(aRow, 'email_' + addedCards[i][2] + '_valueBox', addedCards[i][1].join(" "), {flex: '1', readonly: 'true'});

				var myCardTextbox = cardbookElementTools.addTextbox(aRow, 'fn_' + addedCards[i][2] + '_valueBox', addedCards[i][0], {context: 'listsContextMenu', flex: '1', readonly: 'true'});
				if (aFollowLink) {
					myCardTextbox.setAttribute('link', 'true');
					function fireClick(event) {
						if (wdw_cardbook) {
							wdw_cardbook.chooseActionTreeForClick(event)
						}
					};
					myCardTextbox.addEventListener("click", fireClick, false);
				}

			}
		}

	};

};
