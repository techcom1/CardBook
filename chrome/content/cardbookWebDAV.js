if ("undefined" == typeof(cardbookWebDAV)) {
	try {
		ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
		ChromeUtils.import("resource://gre/modules/Services.jsm");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
		Components.utils.import("resource://gre/modules/Services.jsm");
	}
	try {
		Components.utils.importGlobalProperties(["XMLHttpRequest"]);
	}
	catch(e) {}

	function XMLToJSONParser(doc) {
		this._buildTree(doc);
	}
	
	XMLToJSONParser.prototype = {
		_buildTree: function XMLToJSONParser_buildTree(doc) {
			let nodeName = doc.documentElement.localName;
			this[nodeName] = [this._translateNode(doc.documentElement)];
		},
		
		_translateNode: function XMLToJSONParser_translateNode(node) {
			let value = null;
			if (node.childNodes.length) {
				let textValue = "";
				let dictValue = {};
				let hasElements = false;
				for (let i = 0; i < node.childNodes.length; i++) {
					let currentNode = node.childNodes[i];
					let nodeName = currentNode.localName;
					if (currentNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
						textValue += currentNode.nodeValue;
					} else if (currentNode.nodeType == Components.interfaces.nsIDOMNode.CDATA_SECTION_NODE) {
						textValue += currentNode.nodeValue;
					} else if (currentNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
						hasElements = true;
						let nodeValue = this._translateNode(currentNode);
						if (!dictValue[nodeName]) {
							dictValue[nodeName] = [];
						}
						dictValue[nodeName].push(nodeValue);
					}
				}
				if (hasElements) {
					value = dictValue;
				} else {
					value = textValue;
				}
			}
			return value;
		}
	};
	
	function cardbookWebDAV(connection, target, etag, asJSON) {
		this.prefId = connection.connPrefId;
		this.url = connection.connUrl;
		this.logDescription = connection.connDescription;
		this.target = target;
		this.etag = etag;
		var requestsTimeout = cardbookPreferences.getStringPref("extensions.cardbook.requestsTimeout");
		this.addonVersion = cardbookPreferences.getStringPref("extensions.cardbook.addonVersion");
		this.timeout = requestsTimeout * 1000;
	
		this.requestJSONResponse = false;
		this.requestXMLResponse = false;
		if (typeof asJSON != "undefined") {
			this.requestJSONResponse = asJSON;
			this.requestXMLResponse = !asJSON;
		}
		
		this.username = connection.connUser;
		this.password = "";
		this.accessToken = connection.accessToken;
		this.reportLength = 0;
		this.askCertificate = false;
		this.hideResponse = false;
		
		this.nc = 1;
	}
	
	cardbookWebDAV.prototype = {
		// btoa does not encode €
		b64EncodeUnicode: function (aString) {
			return btoa(encodeURIComponent(aString).replace(/%([0-9A-F]{2})/g, function(match, p1) {
				return String.fromCharCode('0x' + p1);
			}));
		},

		isItADigestCandidate: function (aXhr, aXhrOrig) {
			if (aXhr.status == 401) {
				if (!(aXhrOrig != null && aXhrOrig !== undefined && aXhrOrig != "")) {
					var challenge = aXhr.getResponseHeader('WWW-Authenticate');
					if (challenge === null || challenge === undefined) {
						return false;
					}
					var pos = challenge.indexOf(" ");
					var pairs = challenge.substr(pos).trim().split(',');
					var tokens = {};
					for (var token in pairs) {
						var pair = pairs[token].trim().split('=');
						tokens[pair[0]] = pair[1];
					}
					if (tokens.qop && tokens.realm && tokens.nonce && tokens.opaque) {
						return true;
					}
				}
			}
			return false;
		},

		lpad: function (aString, aPadString, aLength) {
			while (aString.length < aLength) {
				aString = aPadString + aString;
			}
			return aString;
		},

		getMd5: function (aString) {
			var MD5 = function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
			return MD5(aString);
		},

		unquotes: function (aString) {
			return aString.replace(/^\"+|\"+$/gm, '');
		},

		genNonce: function (aLength) {
			var text = "";
			var possible = "ABCDEF0123456789";
			for (var i=0; i<aLength; i++) {
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			}
			return text;
		},

		setDigestCredentials: function (aHeader, aXhrOrig, aMethod, aBody) {
			if (aXhrOrig === null) {
				return
			}
			var challenge = aXhrOrig.getResponseHeader('WWW-Authenticate');
			if (challenge === null || challenge === undefined) {
				return
			}
			var pos = challenge.indexOf(" ");
			var tokens = {cnonce: this.genNonce(16)};
			var pairs = challenge.substr(pos).trim().split(',');
			tokens.nc = this.lpad(this.nc++ + '', '0', 8);

			for (var token in pairs) {
				var pair = pairs[token].trim().split('=');
				tokens[pair[0]] = pair[1];
			}

			var HA1 = this.getMd5(this.username + ":" + this.unquotes(tokens.realm) + ":" + this.password);
			var shortUrl = this.url.replace(cardbookSynchronization.getRootUrl(this.url), '');
			if (this.unquotes(tokens.qop) == 'auth-int') {
				var HA2 = this.getMd5(aMethod + ':' + shortUrl + ':' + this.getMd5(aBody));
			} else {
				var HA2 = this.getMd5(aMethod + ':' + shortUrl);
			}
			var response = this.getMd5(HA1 + ':' + 
								this.unquotes(tokens.nonce) + ':' +
								tokens.nc + ':' +
								tokens.cnonce + ':' +
								this.unquotes(tokens.qop) + ':' +
								HA2);
			aHeader["Authorization"] = "Digest " +
				'username="' + this.username + '"' +
				', realm=' + tokens.realm +
				', nonce=' + tokens.nonce +
				', uri="' + shortUrl + '"' +
				', response="' + response + '"' +
				', opaque=' + tokens.opaque +
				', qop=' + this.unquotes(tokens.qop) +
				', nc=' + tokens.nc +
				', cnonce="' + tokens.cnonce + '"';
		},
	
		setCredentials: function (aHeader) {
			if (this.accessToken != null && this.accessToken !== undefined && this.accessToken != "") {
				if (this.accessToken !== "NOACCESSTOKEN") {
					aHeader["Authorization"] = this.accessToken;
					aHeader["GData-Version"] = "3";
				}
				this.username = "";
				this.password = "";
			} else {
				if (!(this.username != null && this.username !== undefined && this.username != "")) {
					if (this.prefId != null && this.prefId !== undefined && this.prefId != "") {
						this.username = cardbookPreferences.getUser(this.prefId);
					} else {
						this.username = "";
					}
				}
				if (this.username != null && this.username !== undefined && this.username != "") {
					this.password = cardbookPasswordManager.getNotNullPassword(this.username, this.prefId);
				}
				aHeader["Authorization"] = "Basic " + this.b64EncodeUnicode(this.username + ':' + this.password);
			}
		},
	
		createTCPErrorFromFailedChannel: function (aChannel) {
			let status = aChannel.channel.QueryInterface(Components.interfaces.nsIRequest).status;
			let errType;
			
			if ((status & 0xff0000) === 0x5a0000) { // Security module
				const nsINSSErrorsService = Components.interfaces.nsINSSErrorsService;
				let nssErrorsService = Components.classes['@mozilla.org/nss_errors_service;1'].getService(nsINSSErrorsService);
				let errorClass;
				
				// getErrorClass will throw a generic NS_ERROR_FAILURE if the error code is
				// somehow not in the set of covered errors.
				try {
					errorClass = nssErrorsService.getErrorClass(status);
				} catch (ex) {
					//catching security protocol exception
					errorClass = 'SecurityProtocol';
				}
				
				if (errorClass == nsINSSErrorsService.ERROR_CLASS_BAD_CERT) {
					errType = 'SecurityCertificate';
				} else {
					errType = 'SecurityProtocol';
				}
				
				// NSS_SEC errors (happen below the base value because of negative vals)
				if ((status & 0xffff) < Math.abs(nsINSSErrorsService.NSS_SEC_ERROR_BASE)) {
					this.askCertificate = true;
					// The bases are actually negative, so in our positive numeric space, we
					// need to subtract the base off our value.
					let nssErr = Math.abs(nsINSSErrorsService.NSS_SEC_ERROR_BASE) - (status & 0xffff);
					
					switch (nssErr) {
						case 11: // SEC_ERROR_EXPIRED_CERTIFICATE, sec(11)
							errName = 'SecurityExpiredCertificateError';
							break;
						case 12: // SEC_ERROR_REVOKED_CERTIFICATE, sec(12)
							errName = 'SecurityRevokedCertificateError';
							break;
						// per bsmith, we will be unable to tell these errors apart very soon,
						// so it makes sense to just folder them all together already.
						case 13: // SEC_ERROR_UNKNOWN_ISSUER, sec(13)
						case 20: // SEC_ERROR_UNTRUSTED_ISSUER, sec(20)
						case 21: // SEC_ERROR_UNTRUSTED_CERT, sec(21)
						case 36: // SEC_ERROR_CA_CERT_INVALID, sec(36)
							errName = 'SecurityUntrustedCertificateIssuerError';
							break;
						case 90: // SEC_ERROR_INADEQUATE_KEY_USAGE, sec(90)
							errName = 'SecurityInadequateKeyUsageError';
							break;
						case 176: // SEC_ERROR_CERT_SIGNATURE_ALGORITHM_DISABLED, sec(176)
							errName = 'SecurityCertificateSignatureAlgorithmDisabledError';
							break;
						default:
							errName = 'SecurityError';
							break;
					}
				} else {
					// Calculating the difference
					let sslErr = Math.abs(nsINSSErrorsService.NSS_SSL_ERROR_BASE) - (status & 0xffff);
					switch (sslErr) {
						case 3: // SSL_ERROR_NO_CERTIFICATE, ssl(3)
							errName = 'SecurityNoCertificateError';
							break;
						case 4: // SSL_ERROR_BAD_CERTIFICATE, ssl(4)
							errName = 'SecurityBadCertificateError';
							break;
						case 8: // SSL_ERROR_UNSUPPORTED_CERTIFICATE_TYPE, ssl(8)
							errName = 'SecurityUnsupportedCertificateTypeError';
							break;
						case 9: // SSL_ERROR_UNSUPPORTED_VERSION, ssl(9)
							errName = 'SecurityUnsupportedTLSVersionError';
							break;
						case 12: // SSL_ERROR_BAD_CERT_DOMAIN, ssl(12)
							errName = 'SecurityCertificateDomainMismatchError';
							break;
						default:
							errName = 'SecurityError';
							break;
					}
				}
			} else {
				errType = 'Network';
				switch (status) {
					// connect to host:port failed
					case 0x804B000C: // NS_ERROR_CONNECTION_REFUSED, network(13)
						errName = 'ConnectionRefusedError';
						break;
					// network timeout error
					case 0x804B000E: // NS_ERROR_NET_TIMEOUT, network(14)
						errName = 'NetworkTimeoutError';
						break;
					// hostname lookup failed
					case 0x804B001E: // NS_ERROR_UNKNOWN_HOST, network(30)
						errName = 'DomainNotFoundError';
						break;
					case 0x804B0047: // NS_ERROR_NET_INTERRUPT, network(71)
						errName = 'NetworkInterruptError';
						break;
					default:
						errName = 'NetworkError';
						break;
				}
			}
			
			wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Connection status : Failed : " + errName);
			this.dumpSecurityInfo(aChannel);
			// XXX: errType goes unused
		},
	
		dumpSecurityInfo: function (aChannel) {
			let channel = aChannel.channel;
			try {
				let secInfo = channel.securityInfo;
				
				// Print general connection security state
				wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Security Information :");
				if (secInfo instanceof Components.interfaces.nsITransportSecurityInfo) {
					secInfo.QueryInterface(Components.interfaces.nsITransportSecurityInfo);
					wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Security state of connection :");
					
					// Check security state flags
					if ((secInfo.securityState & Components.interfaces.nsIWebProgressListener.STATE_IS_SECURE) == Components.interfaces.nsIWebProgressListener.STATE_IS_SECURE) {
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Secure connection");
					} else if ((secInfo.securityState & Components.interfaces.nsIWebProgressListener.STATE_IS_INSECURE) == Components.interfaces.nsIWebProgressListener.STATE_IS_INSECURE) {
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Insecure connection");
					} else if ((secInfo.securityState & Components.interfaces.nsIWebProgressListener.STATE_IS_BROKEN) == Components.interfaces.nsIWebProgressListener.STATE_IS_BROKEN) {
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Unknown");
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Security description : " + secInfo.shortSecurityDescription);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Security error message : " + secInfo.errorMessage);
					}
				} else {
					wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : No security info available for this channel");
				}
				
				// Print SSL certificate details
				if (secInfo instanceof Components.interfaces.nsISSLStatusProvider) {
					if (secInfo.QueryInterface(Components.interfaces.nsISSLStatusProvider).SSLStatus) {
						var cert = secInfo.QueryInterface(Components.interfaces.nsISSLStatusProvider).SSLStatus.QueryInterface(Components.interfaces.nsISSLStatus).serverCert;
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Common name (CN) : " + cert.commonName);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Issuer : " + cert.issuerOrganization);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Organisation : " + cert.organization);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : SHA1 fingerprint : " + cert.sha1Fingerprint);
						var validity = cert.validity.QueryInterface(Components.interfaces.nsIX509CertValidity);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Valid from " + validity.notBeforeGMT);
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.logDescription + " : debug mode : Valid until " + validity.notAfterGMT);
					}
				}
			}
			catch(e) {
				var prompts = Services.prompt;
				var errorTitle = "dumpSecurityInfo error";
				prompts.alert(null, errorTitle, e);
			}
		},
	
		makeHTTPRequest: function(method, body, headers, aCleanBody, aXhrOrig) {
			var httpChannel = new XMLHttpRequest();
			httpChannel.loadFlags |= Components.interfaces.nsIRequest.LOAD_ANONYMOUS | Components.interfaces.nsIRequest.LOAD_BYPASS_CACHE | Components.interfaces.nsIRequest.INHIBIT_PERSISTENT_CACHING;
			httpChannel.notificationCallbacks = this;

			if (this.timeout != null && this.timeout !== undefined && this.timeout != "") {
				httpChannel.timeout = this.timeout;
			}

			headers["User-Agent"] = cardbookRepository.userAgent;

			if (aXhrOrig != null && aXhrOrig !== undefined && aXhrOrig != "") {
				this.setDigestCredentials(headers, aXhrOrig, method, body);
			} else {
				this.setCredentials(headers);
			}

			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : method : ", method);
			if (headers) {
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : headers : ", cardbookUtils.cleanWebObject(headers));
			}
			if (aCleanBody) {
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : body : ", aCleanBody);
			} else {
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : body : ", body);
			}	
			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : username : ", this.username);
			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : url : ", this.url);

			// httpChannel.open(method, this.url, true, this.username, this.password);
			httpChannel.open(method, this.url, true);
			
			if (headers) {
				for (let header in headers) {
					httpChannel.setRequestHeader(header, headers[header]);
				}
			}
			return httpChannel;
		},
	
		sendHTTPRequest: function(method, body, headers, aCleanBody, aXhrOrig, aOverrideMime) {
			try {
				var xhr = this.makeHTTPRequest(method, body, headers, aCleanBody, aXhrOrig);
	
				var this_ = this;
				xhr.onerror = function(aEvent) {
					if (this_.isItADigestCandidate(xhr, aXhrOrig)) {
						this_.sendHTTPRequest(method, body, headers, aCleanBody, xhr);
					} else {
						this_.createTCPErrorFromFailedChannel(xhr);
						this_.handleHTTPResponse(xhr, aEvent.target.status, aEvent.target.responseText.length, aEvent.target.responseText);
					}
				};
				xhr.ontimeout = function(aEvent) {
					this_.createTCPErrorFromFailedChannel(xhr);
					this_.handleHTTPResponse(xhr, 408, aEvent.target.responseText.length, aEvent.target.responseText);
				};
				xhr.onload = function(aEvent) {
					if (this_.isItADigestCandidate(xhr, aXhrOrig)) {
						this_.sendHTTPRequest(method, body, headers, aCleanBody, xhr);
					} else {
						this_.handleHTTPResponse(xhr, aEvent.target.status, aEvent.target.responseText.length, aEvent.target.responseText);
					}
				};
	
				if (aOverrideMime) {
					xhr.overrideMimeType('text/plain; charset=x-user-defined');
				}
				if (body) {
					xhr.send(body);
				} else {
					xhr.send();
				}
	
			}
			catch(e) {
				var prompts = Services.prompt;
				var errorTitle = "sendHTTPRequest error";
				prompts.alert(null, errorTitle, e);
				if (this.target && this.target.onDAVQueryComplete) {
					this.target.onDAVQueryComplete(666, "", this.askCertificate, "", 0);
				}
			}
		},
	
		handleHTTPResponse: function(aChannel, aStatus, aResultLength, aResult) {
			var status = aStatus;
			var headers = {};
			var response = null;
			if (!this.hideResponse) {
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : response text : ", aResult);
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : response code : ", aStatus);
				wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : response etag : ", aChannel.getResponseHeader("etag"));
			}
			if (status !== 499 && status !== 0 && status !== 408) {
				if (aResultLength > 0) {
					var responseText = aResult;
					if (this.requestJSONResponse || this.requestXMLResponse) {
						let xmlParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
						let responseXML = xmlParser.parseFromString(responseText, "text/xml");
						if (this.requestJSONResponse) {
							let parser = new XMLToJSONParser(responseXML);
							response = parser;
						} else {
							response = responseXML;
						}
					} else {
						response = responseText;
					}
				}
			}
			if (this.target && this.target.onDAVQueryComplete) {
				this.target.onDAVQueryComplete(status, response, this.askCertificate, aChannel.getResponseHeader("ETag"), this.reportLength);
			}
		},
	
		load: function(operation, parameters) {
			if (operation == "GET") {
				var headers = {};
				if (parameters.accept !== null) {
					headers.accept = parameters.accept;
				}
				this.sendHTTPRequest(operation, null, headers);
			} else if (operation == "GETIMAGE") {
				var headers = {};
				if (parameters.accept !== null) {
					headers.accept = parameters.accept;
				}
				this.sendHTTPRequest("GET", null, headers, null, null, true);
			} else if (operation == "PUT") {
				if ((this.etag != null && this.etag !== undefined && this.etag != "") && (this.etag != "0")) {
					this.sendHTTPRequest(operation, parameters.data, { "content-type": parameters.contentType,
																		"If-Match": this.etag });
				} else {
					this.sendHTTPRequest(operation, parameters.data, { "content-type": parameters.contentType,
																		"If-None-Match": "*" });
				}
			} else if (operation == "PROPFIND") {
				let headers = { "depth": (parameters.deep ? "1": "0"), "content-type": "application/xml; charset=utf-8"};
				let query = this._propfindQuery(parameters.props);
				this.sendHTTPRequest(operation, query, headers);
		   } else if (operation == "REPORT") {
				let headers = { "depth": (parameters.deep ? "1": "0"), "content-type": "application/xml; charset=utf-8"};
				let query = this._reportQuery(parameters.props);
				this.sendHTTPRequest(operation, query, headers);
			} else if (operation == "DELETE") {
				this.sendHTTPRequest(operation, null, {});
			}
		},
	
		get: function(accept) {
			this.load("GET", {accept: accept});
		},
	
		getimage: function(accept) {
			this.load("GETIMAGE", {accept: accept});
		},
	
		put: function(data, contentType) {
			this.load("PUT", {data: data, contentType: contentType});
		},
	
		propfind: function(props, deep) {
			if (typeof deep == "undefined") {
				deep = true;
			}
			this.load("PROPFIND", {props: props, deep: deep});
		},
	
		report: function(props, deep) {
			if (typeof deep == "undefined") {
				deep = true;
			}
			this.load("REPORT", {props: props, deep: deep});
		},
	
		googleToken: function(aType, aParams, aHeaders) {
			this.hideResponse = true;
			var paramsArray = [];
			for (var param in aParams) {
				paramsArray.push(param + "=" + encodeURIComponent(aParams[param]));
			}
			this.sendHTTPRequest(aType, paramsArray.join("&"), aHeaders, cardbookUtils.cleanWebArray(paramsArray));
		},
		
		delete: function() {
			this.load("DELETE");
		},
		
		_propfindQuery: function(props) {
			let nsDict = { "DAV:": "D" };
			let propPart = "";
			let nsCount = 0;
			for (let property in props) {
				let prop = props[property];
				let propParts = prop.split(" ");
				let ns = propParts[0];
				let nsS = nsDict[ns];
				if (!nsS) {
					nsS = "x" + nsCount;
					nsDict[ns] = nsS;
					nsCount++;
				}
				propPart += "<" + nsS + ":" + propParts[1] + "/>";
			}
			let query = "<?xml version=\"1.0\" encoding=\"utf-8\"?><D:propfind";
			for (let ns in nsDict) {
				query += " xmlns:" + nsDict[ns] + "=\"" + ns + "\"";
			}
			query += ("><D:prop>" + propPart + "</D:prop></D:propfind>");
			return query;
		},
	
		_reportQuery: function(props) {
			var query = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
			query = query + "<C:addressbook-multiget xmlns:D=\"DAV:\" xmlns:C=\"urn:ietf:params:xml:ns:carddav\">";
			query = query + "<D:prop><D:getetag/><C:address-data content-type='text/vcard'/></D:prop>";
			for (var i = 0; i < props.length; i++) {
				this.reportLength++;
				query = query + "<D:href>" + this._formatRelativeHref(props[i]) + "</D:href>";
			}
			query = query + "</C:addressbook-multiget>";
			return query;
		},
	
		_formatRelativeHref: function(aString) {
			var decodeReport = true;
			try {
				decodeReport = cardbookPreferences.getBoolPref("extensions.cardbook.decodeReport");
			} catch (e) {
				decodeReport = true;
			}
			var relative = aString.match("(https?)(://[^/]*)/([^#?]*)");
			if (relative && relative[3]) {
				var relativeHrefArray = [];
				relativeHrefArray = relative[3].split("/");
				for (var i = 0; i < relativeHrefArray.length; i++) {
					if (decodeReport) {
						relativeHrefArray[i] = decodeURIComponent(relativeHrefArray[i]);
					} else {
						relativeHrefArray[i] = encodeURIComponent(relativeHrefArray[i]);
					}
				}
				return "/" + relativeHrefArray.join("/");
			}
			wdw_cardbooklog.updateStatusProgressInformationWithDebug1(this.logDescription + " : debug mode : can not parse relative href : ", aString);
			return "";
		}
	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/cardbookPasswordManager.js");
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
};
