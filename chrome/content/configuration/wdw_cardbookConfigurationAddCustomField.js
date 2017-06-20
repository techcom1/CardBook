if ("undefined" == typeof(wdw_cardbookConfigurationAddCustomField)) {
	var wdw_cardbookConfigurationAddCustomField = {
		
		checkNullCustomField: function(aTextBox) {
			var fieldCode = document.getElementById("customFieldCodeTextBox").value;
			var fieldLabel = document.getElementById("customFieldLabelTextBox").value;
			var btnSave = document.getElementById("saveEditionLabel");
			btnSave.disabled = true;
			if (fieldCode != "" && fieldLabel != "") {
				btnSave.disabled = false;
			}
		},

		load: function () {
			document.getElementById('customFieldCodeTextBox').value = window.arguments[0].code;
			document.getElementById('customFieldLabelTextBox').value = window.arguments[0].label;
			document.getElementById('customFieldCodeTextBox').focus();
		},

		save: function () {
			if (wdw_cardbookConfiguration.validateCustomFieldName(document.getElementById("customFieldCodeTextBox").value)) {
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
