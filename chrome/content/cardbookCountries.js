if ("undefined" == typeof(cardbookCountries)) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/NetUtil.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var cardbookCountries = {
		
		fetchJSON: function (aURL) {
			return new Promise((resolve, reject) => {
				var myUri = Services.io.newURI(aURL, null, null);
				var channel = Services.io.newChannelFromURI2(myUri,
																null,
																Services.scriptSecurityManager.getSystemPrincipal(),
																null,
																Components.interfaces.nsILoadInfo.SEC_REQUIRE_SAME_ORIGIN_DATA_INHERITS,
																Components.interfaces.nsIContentPolicy.TYPE_OTHER);

				NetUtil.asyncFetch(channel, (inputStream, status) => {
					if (!Components.isSuccessCode(status)) {
						reject(status);
						return;
					}
					try {
						var countries = NetUtil.readInputStreamToString(inputStream, inputStream.available());
						resolve(countries);
					} catch (e) {
						reject(e);
					}
                });
            });
        },

		loadData: function () {
			cardbookCountries.fetchJSON("resource://cardbook-data/countries.csv").then((countries) => {
				var re = /[\n\u0085\u2028\u2029]|\r\n?/;
				var myCountryArray = countries.split(re);
				var myCountryLangArray = myCountryArray[0].split(',');
				for (var i = 2; i < myCountryLangArray.length; i++) {
					var myLangCode = myCountryLangArray[i];
					cardbookRepository.countries[myLangCode] = {};
				}
				for (var i = 1; i < myCountryArray.length; i++) {
					var myCountryTranslationArray = myCountryArray[i].split(',');
					var myCountryCode = myCountryTranslationArray[0];
					cardbookRepository.phones[myCountryTranslationArray[0]] = myCountryTranslationArray[1];
					for (var j = 2; j < myCountryLangArray.length; j++) {
						cardbookRepository.countries[myCountryLangArray[j]][myCountryCode] = myCountryTranslationArray[j];
					}
				}
			}).then(() => {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookRepository.countries and cardbookRepository.phones load OK");
			}, (error) => {
				wdw_cardbooklog.updateStatusProgressInformation("cardbookCountries error : " + error, "Error");
			});
		}

	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/wdw_log.js");
};
