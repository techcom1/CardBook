if ("undefined" == typeof(wdw_newToken)) {
	try {
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
		ChromeUtils.import("resource://gre/modules/Services.jsm");
	}
	catch(e) {
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
		Components.utils.import("resource://gre/modules/Services.jsm");
	}

	var wdw_newToken = {

		load: function () {
			var strBundle = document.getElementById("cardbook-strings");
			var myWindowTitle = strBundle.getString(window.arguments[0].operationType + "NewTokenTitle");
			document.getElementById('wdw_newToken').setAttribute("title", myWindowTitle);
		},

		closeKO: function () {
			cardbookRepository.cardbookRefreshTokenError[window.arguments[0].dirPrefId]++;
			cardbookRepository.cardbookRefreshTokenResponse[window.arguments[0].dirPrefId]++;
			cardbookRepository.cardbookServerSyncResponse[window.arguments[0].dirPrefId]++;
			close();
		}
	};

};
