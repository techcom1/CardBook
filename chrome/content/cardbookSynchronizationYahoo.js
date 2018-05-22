if ("undefined" == typeof(cardbookSynchronizationYahoo)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var cardbookSynchronizationYahoo = {

		getNewAccessTokenForYahoo: function(aConnection, aCode, aOperationType, aParams) {
			var listener_getAccessToken = {
				onDAVQueryComplete: function(status, response, askCertificate) {
					if (status > 199 && status < 400) {
						try {
							var responseText = JSON.parse(response);
							cardbookUtils.formatStringForOutput("yahooAccessTokenOK", [aConnection.connDescription, cardbookUtils.cleanWebObject(responseText)]);
							aConnection.accessToken = responseText.token_type + " " + responseText.access_token;
							aConnection.connUrl = cardbookSynchronization.getWellKnownUrl(cardbookRepository.cardbookOAuthData.YAHOO.ROOT_API);
							cardbookSynchronization.discoverPhase1(aConnection, aOperationType, aParams);
						}
						catch(e) {
							cardbookRepository.cardbookServerSyncResponse[aConnection.connPrefId]++;
							cardbookRepository.cardbookAccessTokenError[aConnection.connPrefId]++;
							wdw_cardbooklog.updateStatusProgressInformation(aConnection.connDescription + " : cardbookSynchronization.getNewAccessTokenForYahoo error : " + e, "Error");
						}
					} else {
						if (status == 400 || status == 401) {
							cardbookUtils.formatStringForOutput("synchronizationFailed", [aConnection.connDescription, "getNewAccessTokenForYahoo", aConnection.connUrl, status]);
							cardbookUtils.formatStringForOutput("yahooGetNewRefreshToken", [aConnection.connDescription, aConnection.connUrl]);
							cardbookSynchronizationYahoo.requestNewRefreshTokenForYahoo(aConnection, cardbookSynchronizationYahoo.getNewAccessTokenForYahoo, aOperationType, aParams);
						} else {
							cardbookUtils.formatStringForOutput("synchronizationFailed", [aConnection.connDescription, "getNewAccessTokenForYahoo", aConnection.connUrl, status], "Error");
							cardbookRepository.cardbookServerSyncResponse[aConnection.connPrefId]++;
							cardbookRepository.cardbookAccessTokenError[aConnection.connPrefId]++;
						}
					}
					cardbookRepository.cardbookAccessTokenResponse[aConnection.connPrefId]++;
				}
			};
			cardbookUtils.formatStringForOutput("yahooRequestAccessToken", [aConnection.connDescription, aConnection.connUrl]);
			cardbookRepository.cardbookAccessTokenRequest[aConnection.connPrefId]++;
			aConnection.accessToken = "NOACCESSTOKEN";
			let params = {"refresh_token": aCode, "grant_type": cardbookRepository.cardbookOAuthData.YAHOO.REFRESH_REQUEST_GRANT_TYPE,
							"client_id": cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_ID, "client_secret": cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_SECRET};
			let headers = {"content-type": "application/x-www-form-urlencoded"};
			let request = new cardbookWebDAV(aConnection, listener_getAccessToken);
			request.yahooToken(cardbookRepository.cardbookOAuthData.YAHOO.TOKEN_REQUEST_TYPE, params, headers, cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_ID,cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_SECRET);
		},

		getNewRefreshTokenForYahoo: function(aConnection, aCode, aCallback) {
			var listener_getRefreshToken = {
				onDAVQueryComplete: function(status, response, askCertificate) {
					if (status > 199 && status < 400) {
						try {
							var responseText = JSON.parse(response);
							cardbookUtils.formatStringForOutput("yahooRefreshTokenOK", [aConnection.connDescription, cardbookUtils.cleanWebObject(responseText)]);
							if (aCallback) {
								aCallback(responseText);
							}
						}
						catch(e) {
							cardbookRepository.cardbookRefreshTokenError[aConnection.connPrefId]++;
							wdw_cardbooklog.updateStatusProgressInformation(aConnection.connDescription + " : cardbookSynchronizationYahoo.getNewRefreshTokenForYahoo error : " + e, "Error");
						}
					} else {
						cardbookRepository.cardbookRefreshTokenError[aConnection.connPrefId]++;
						cardbookUtils.formatStringForOutput("synchronizationFailed", [aConnection.connDescription, "getNewRefreshTokenForYahoo", aConnection.connUrl, status], "Error");
						cardbookRepository.cardbookServerSyncResponse[aConnection.connPrefId]++;
					}
					cardbookRepository.cardbookRefreshTokenResponse[aConnection.connPrefId]++;
				}
			};
			cardbookUtils.formatStringForOutput("yahooRequestRefreshToken", [aConnection.connDescription, aConnection.connUrl]);
			aConnection.accessToken = "NOACCESSTOKEN";
			let params = {"grant_type": cardbookRepository.cardbookOAuthData.YAHOO.TOKEN_REQUEST_GRANT_TYPE, "redirect_uri": cardbookRepository.cardbookOAuthData.YAHOO.REDIRECT_URI, "code": aCode, 
							"client_id": cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_ID, "client_secret": cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_SECRET};
			let headers = {"content-type": "application/x-www-form-urlencoded"};
			let request = new cardbookWebDAV(aConnection, listener_getRefreshToken);
			request.yahooToken(cardbookRepository.cardbookOAuthData.YAHOO.TOKEN_REQUEST_TYPE, params, headers, cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_ID,cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_SECRET);
		},

		requestNewRefreshTokenForYahoo: function (aConnection, aCallback, aOperationType, aParams) {
			cardbookRepository.cardbookRefreshTokenRequest[aConnection.connPrefId]++;
			var myArgs = {operationType: aOperationType, dirPrefId: aConnection.connPrefId};
			var wizard = window.openDialog("chrome://cardbook/content/addressbooksconfiguration/wdw_newToken.xul", "", "chrome,resizable,scrollbars=no,status=no", myArgs);
			wizard.addEventListener("load", function onloadListener() {
				var browser = wizard.document.getElementById("browser");
				var url = cardbookSynchronizationYahoo.getYahooOAuthURL(aConnection.connUser);
				browser.loadURI(url);
				lTimerCheckTitle = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
				lTimerCheckTitle.initWithCallback({ notify: function(lTimerCheckTitle) {
							if (browser.contentDocument) {
								var codes = browser.contentDocument.getElementsByTagName("code");
								// <code class="oauth2-code">6cd3sxr</code>
								for (let i = 0; i < codes.length; i++) {
									if (codes[i].getAttribute("class") == "oauth2-code") {
										var myCode = codes[i].childNodes[0].nodeValue;
										cardbookUtils.formatStringForOutput("yahooNewRefreshTokenOK", [aConnection.connDescription, myCode]);
										browser.loadURI("");
										var connection = {connUser: "", connUrl: cardbookRepository.cardbookOAuthData.YAHOO.TOKEN_REQUEST_URL, connPrefId: aConnection.connPrefId, connDescription: aConnection.connDescription};
										cardbookSynchronizationYahoo.getNewRefreshTokenForYahoo(connection, myCode, function callback(aResponse) {
																												wizard.close();
																												cardbookPasswordManager.removeAccount(aConnection.connUser);
																												cardbookPasswordManager.addAccount(aConnection.connUser, "", aResponse.refresh_token);
																												if (aCallback != null && aCallback !== undefined && aCallback != "") {
																													aCallback(aConnection, aResponse.refresh_token, aOperationType, aParams);
																												}
																												});
									}
								}
							}
						}
						}, 1000, Components.interfaces.nsITimer.TYPE_REPEATING_SLACK);
			});
		},

		getYahooOAuthURL: function (aEmail) {
			return cardbookRepository.cardbookOAuthData.YAHOO.OAUTH_URL +
			"?response_type=" + cardbookRepository.cardbookOAuthData.YAHOO.RESPONSE_TYPE +
			"&client_id=" + cardbookRepository.cardbookOAuthData.YAHOO.CLIENT_ID +
			"&redirect_uri=" + cardbookRepository.cardbookOAuthData.YAHOO.REDIRECT_URI +
			"&language=" + cardbookRepository.cardbookOAuthData.YAHOO.LANGUAGE +
			"&login_hint=" + aEmail;
		}

	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/addressbooksconfiguration/wdw_newToken.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookPasswordManager.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookWebDAV.js");
	loader.loadSubScript("chrome://cardbook/content/wdw_log.js");
};
