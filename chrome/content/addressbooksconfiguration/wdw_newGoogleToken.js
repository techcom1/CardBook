if ("undefined" == typeof(wdw_newGoogleToken)) {
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var wdw_newGoogleToken = {

		closeKO: function () {
			cardbookRepository.cardbookGoogleRefreshTokenError[window.arguments[0].dirPrefId]++;
			cardbookRepository.cardbookGoogleRefreshTokenResponse[window.arguments[0].dirPrefId]++;
			cardbookRepository.cardbookServerSyncResponse[window.arguments[0].dirPrefId]++;
			close();
		}
	};

};
