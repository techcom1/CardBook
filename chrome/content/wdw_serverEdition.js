if ("undefined" == typeof(wdw_serverEdition)) {
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var wdw_serverEdition = {

		load: function () {
			document.getElementById("serverNameTextBox").value = window.arguments[0].serverEditionName;
			document.getElementById("serverTypeTextBox").value = window.arguments[0].serverEditionType;
			document.getElementById("serverUserTextBox").value = window.arguments[0].serverEditionUser;
			document.getElementById("serverUrlTextBox").value = window.arguments[0].serverEditionUrl;
			document.getElementById("serverColorInput").value = window.arguments[0].serverEditionColor;
			document.getElementById("serverVCardVersionTextBox").value = window.arguments[0].serverEditionVCard;
			document.getElementById("serverReadOnlyCheckBox").setAttribute('checked', window.arguments[0].serverEditionReadOnly);
			cardbookElementTools.loadDateFormats("dateFormatMenuPopup", "dateFormatMenuList", window.arguments[0].serverEditionDateFormat);
			document.getElementById("serverReadOnlyCheckBox").setAttribute('checked', window.arguments[0].serverEditionReadOnly);
			document.getElementById("serverUrnuuidCheckBox").setAttribute('checked', window.arguments[0].serverEditionUrnuuid);
		},

		save: function () {
			if (document.getElementById('dateFormatMenuList').value != window.arguments[0].serverEditionDateFormat) {
				cardbookDates.convertAddressBookDate(window.arguments[0].serverEditionId, document.getElementById('serverNameTextBox').value,
													window.arguments[0].serverEditionDateFormat, document.getElementById('dateFormatMenuList').value);
			}
			window.arguments[0].serverCallback("SAVE", window.arguments[0].serverEditionId, document.getElementById('serverNameTextBox').value,
												document.getElementById('serverColorInput').value, document.getElementById('serverVCardVersionTextBox').value,
												document.getElementById('serverReadOnlyCheckBox').checked, document.getElementById('dateFormatMenuList').value,
												document.getElementById('serverUrnuuidCheckBox').checked);
			close();
		},

		cancel: function () {
			window.arguments[0].serverCallback("CANCEL");
			close();
		}

	};

};
