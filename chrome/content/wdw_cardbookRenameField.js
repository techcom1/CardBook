if ("undefined" == typeof(wdw_cardbookRenameField)) {
	var wdw_cardbookRenameField = {
		
		validate: function () {
			var myValue = document.getElementById('typeTextBox').value;
			var myValidationList = JSON.parse(JSON.stringify(window.arguments[0].validationList));
			function filterOriginal(element) {
				return (element != myValue);
			}
			myValidationList = myValidationList.filter(filterOriginal);
			if (myValidationList.length != window.arguments[0].validationList.length) {
				cardbookNotifications.setNotification("errorNotifications", "valueAlreadyExists", myValue);
				return false;
			} else {
				cardbookNotifications.setNotification("errorNotifications", "OK");
				return true;
			}
		},

		load: function () {
			var strBundle = document.getElementById("cardbook-strings");
			document.title = strBundle.getString("wdw_cardbookRenameField" + window.arguments[0].context + "Title");
			document.getElementById('typeLabel').value = strBundle.getString(window.arguments[0].context + "Label");
			document.getElementById('typeTextBox').value = window.arguments[0].type;
			document.getElementById('typeTextBox').focus();
		},

		save: function () {
			if (wdw_cardbookRenameField.validate()) {
				window.arguments[0].type = document.getElementById('typeTextBox').value.trim();
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
