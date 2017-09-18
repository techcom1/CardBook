if ("undefined" == typeof(wdw_cardbookConfigurationAddCustomField)) {
	var wdw_cardbookConfigurationAddCustomField = {
		
		validateCustomValues: function () {
			var myValue = document.getElementById('customFieldCodeTextBox').value;
			var myValidationList = JSON.parse(JSON.stringify(window.arguments[0].validationList));
			function filterOriginal(element) {
				return (element != myValue);
			}
			myValidationList = myValidationList.filter(filterOriginal);
			if (myValidationList.length != window.arguments[0].validationList.length) {
				cardbookNotifications.setNotification("errorNotifications", "customFieldsErrorUNIQUE");
				return false;
			} else if (myValue.toUpperCase() !== myValue) {
				cardbookNotifications.setNotification("errorNotifications", "customFieldsErrorUPPERCASE", myValue);
				return false;
			} else if (!(myValue.toUpperCase().startsWith("X-"))) {
				cardbookNotifications.setNotification("errorNotifications", "customFieldsErrorX", myValue);
				return false;
			} else if (myValue.toUpperCase() === "X-THUNDERBIRD-ETAG") {
				cardbookNotifications.setNotification("errorNotifications", "customFieldsErrorETAG", myValue);
				return false;
			} else if (myValue.includes(":") || myValue.includes(",") || myValue.includes(";") || myValue.includes(".")) {
				cardbookNotifications.setNotification("errorNotifications", "customFieldsErrorCHAR", myValue);
				return false;
			} else {
				cardbookNotifications.setNotification("errorNotifications", "OK");
				return true;
			}
		},

		validate: function() {
			var fieldCode = document.getElementById("customFieldCodeTextBox").value;
			var fieldLabel = document.getElementById("customFieldLabelTextBox").value;
			var btnSave = document.getElementById("saveEditionLabel");
			if (fieldCode != "" && fieldLabel != "") {
				btnSave.disabled = false;
				return wdw_cardbookConfigurationAddCustomField.validateCustomValues();
			} else {
				btnSave.disabled = true;
				cardbookNotifications.setNotification("errorNotifications", "OK");
				return false;
			}
		},

		load: function () {
			document.getElementById('customFieldCodeTextBox').value = window.arguments[0].code;
			document.getElementById('customFieldLabelTextBox').value = window.arguments[0].label;
			document.getElementById('customFieldCodeTextBox').focus();
			wdw_cardbookConfiguration.customFieldCheck(document.getElementById('customFieldCodeTextBox'));
			wdw_cardbookConfigurationAddCustomField.validate();
		},

		save: function () {
			if (wdw_cardbookConfigurationAddCustomField.validate()) {
				window.arguments[0].code = document.getElementById('customFieldCodeTextBox').value.trim();
				window.arguments[0].label = document.getElementById('customFieldLabelTextBox').value.trim();
				window.arguments[0].typeAction="SAVE";
				close();
			}
		},

		cancel: function () {
			window.arguments[0].typeAction="CANCEL";
			close();
		}

	};

};

window.addEventListener("popupshowing", wdw_cardEdition.loadRichContext, true);
