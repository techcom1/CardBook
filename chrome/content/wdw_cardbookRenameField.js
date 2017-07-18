if ("undefined" == typeof(wdw_cardbookRenameField)) {
	var wdw_cardbookRenameField = {
		
		setNotification: function(aReasonCode) {
			var notificationBox = document.getElementById("errorNotifications");
			if (aReasonCode == "OK") {
				notificationBox.removeAllNotifications();
			} else {
				let existingBox = notificationBox.getNotificationWithValue(aReasonCode);
				if (!existingBox) {
					var strBundle = document.getElementById("cardbook-strings");
					var aReason = strBundle.getFormattedString("valueAlreadyExists", [document.getElementById('typeTextBox').value]);
					notificationBox.appendNotification(aReason, aReasonCode, null, notificationBox.PRIORITY_WARNING_MEDIUM, null);
					notificationBox.getNotificationWithValue(aReasonCode).setAttribute("hideclose", "true");
				}
			}
		},

		validate: function () {
			var myValidationList = JSON.parse(JSON.stringify(window.arguments[0].validationList));
			function filterOriginal(element) {
				return (element != document.getElementById('typeTextBox').value);
			}
			myValidationList = myValidationList.filter(filterOriginal);
			if (myValidationList.length != window.arguments[0].validationList.length) {
				wdw_cardbookRenameField.setNotification("existingValue");
				return false;
			} else {
				wdw_cardbookRenameField.setNotification("OK");
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
