if ("undefined" == typeof(cardbookNotifications)) {
	var cardbookNotifications = {
		
		setNotification: function(aNotificationBoxId, aReasonCode, aValue, aPriority) {
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
					if (aValue && aValue != "") {
						var myReason = strBundle.getFormattedString(aReasonCode, [aValue]);
					} else {
						var myReason = strBundle.getString(aReasonCode);
					}
					if (aPriority) {
						var myPriority = notificationBox[aPriority];
					} else {
						var myPriority = notificationBox.PRIORITY_WARNING_MEDIUM;
					}
					notificationBox.appendNotification(myReason, aNotificationCode, null, myPriority, null);
					notificationBox.getNotificationWithValue(aNotificationCode).setAttribute("hideclose", "true");
				}
			}
		}

	};
};
