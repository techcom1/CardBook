if ("undefined" == typeof(wdw_password)) {
	var wdw_password = {
		
		checkRequired: function () {
			if (document.getElementById('siteTextBox').value.trim() != "" && document.getElementById('usernameTextBox').value.trim() != "" && document.getElementById('passwordTextBox').value.trim() != "" ) {
				document.getElementById('saveEditionLabel').disabled = false;
			} else {
				document.getElementById('saveEditionLabel').disabled = true;
			}
		},

		showPassword: function () {
			var passwordType = document.getElementById('passwordTextBox').type;
			if (passwordType != "password") {
				document.getElementById('passwordTextBox').type = "password";
			} else {
				document.getElementById('passwordTextBox').type = "";
			}
		},

		load: function () {
			var strBundle = document.getElementById("cardbook-strings");
			document.title = strBundle.getString("wdw_password" + window.arguments[0].context + "Title");
			document.getElementById('siteTextBox').value = window.arguments[0].site;
			document.getElementById('usernameTextBox').value = window.arguments[0].username;
			document.getElementById('passwordTextBox').value = window.arguments[0].password;
			if (window.arguments[0].context == "New") {
				document.getElementById('siteTextBox').disabled = false;
				document.getElementById('usernameTextBox').disabled = false;
				document.getElementById('siteTextBox').focus();
			} else {
				document.getElementById('siteTextBox').disabled = true;
				document.getElementById('usernameTextBox').disabled = true;
				document.getElementById('passwordTextBox').focus();
			}
			wdw_password.checkRequired();
		},

		save: function () {
			myURL = document.getElementById('siteTextBox').value.trim();
			if (cardbookSynchronization.getRootUrl(myURL) == "") {
				cardbookNotifications.setNotification("errorNotifications", "ValidatingURLFailedLabel");
			} else {
				window.arguments[0].site = document.getElementById('siteTextBox').value;
				window.arguments[0].username = document.getElementById('usernameTextBox').value;
				window.arguments[0].password = document.getElementById('passwordTextBox').value;
				window.arguments[0].action="SAVE";
				close();
			}
		},

		cancel: function () {
			window.arguments[0].action="CANCEL";
			close();
		}

	};

};
