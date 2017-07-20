if ("undefined" == typeof(cardbookNotifications)) {
	var cardbookNotifications = {
		
		setNotification: function(aNotificationBoxId, aReasonCode, aValue) {
			var notificationBox = document.getElementById(aNotificationBoxId);
			if (aReasonCode == "OK") {
				notificationBox.removeAllNotifications();
			} else {
				var aNotificationCode = aReasonCode;
				if (aValue) {
					aNotificationCode = aNotificationCode + aValue;
				}
				var existingBox = notificationBox.getNotificationWithValue(aNotificationCode);
				if (!existingBox) {
					notificationBox.removeAllNotifications();
					var strBundle = document.getElementById("cardbook-strings");
					if (aValue) {
						var aReason = strBundle.getFormattedString(aReasonCode, [aValue]);
					} else {
						var aReason = strBundle.getString(aReasonCode);
					}
					notificationBox.appendNotification(aReason, aNotificationCode, null, notificationBox.PRIORITY_WARNING_MEDIUM, null);
					notificationBox.getNotificationWithValue(aNotificationCode).setAttribute("hideclose", "true");
				}
			}
		}

	};
};