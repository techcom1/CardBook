if ("undefined" == typeof(cardbookPreferences)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var cardbookPreferences = {

		prefCardBookRoot: "extensions.cardbook.",
		prefCardBookData: "extensions.cardbook.data.",
		prefCardBookTypes: "extensions.cardbook.types.",
		prefCardBookTels: "extensions.cardbook.tels.",
		prefCardBookIMPPs: "extensions.cardbook.impps.",
		prefCardBookCustomFields: "extensions.cardbook.customFields.",
		prefCardBookAccountVCards: "extensions.cardbook.vcards.",
		prefCardBookAccountRestrictions: "extensions.cardbook.accountsRestrictions.",
		prefCardBookEmailsCollection: "extensions.cardbook.emailsCollection.",

		_arrayUnique: function (array) {
			var a = array.concat();
			for(var i=0; i<a.length; ++i) {
				for(var j=i+1; j<a.length; ++j) {
					if(a[i] === a[j])
						a.splice(j--, 1);
				}
			}
			return a;
		},

		getBoolPref: function (prefName, aDefaultValue) {
			try {
				return Services.prefs.getBoolPref(prefName);
			}
			catch(e) {
				return aDefaultValue;
			}
		},

		setBoolPref: function (prefName, value) {
			try {
				Services.prefs.setBoolPref(prefName, value);
			}
			catch(e) {
				dump("cardbookPreferences.setBoolPref : failed to set" + prefName + "\n" + e + "\n");
			}
		},

		getStringPref: function (prefName) {
			try {
				if (Services.vc.compare(Services.appinfo.version, "58") >= 0) {
					return Services.prefs.getStringPref(prefName);
				} else {
					return Services.prefs.getComplexValue(prefName, Components.interfaces.nsISupportsString).data;
				}
			}
			catch(e) {
				return "";
			}
		},

		setStringPref: function (prefName, value) {
			try {
				if (Services.vc.compare(Services.appinfo.version, "58") >= 0) {
					Services.prefs.setStringPref(prefName, value);
				} else {
					var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
					str.data = value;
					Services.prefs.setComplexValue(prefName, Components.interfaces.nsISupportsString, str);
				}
			}
			catch(e) {
				dump("cardbookPreferences.setStringPref : failed to set" + prefName + "\n" + e + "\n");
			}
		},

		insertIMPPsSeed: function () {
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			this.setIMPPs(0,"skype:" + strBundle.GetStringFromName("impp.skype") + ":skype");
			this.setIMPPs(1,"jabber:" + strBundle.GetStringFromName("impp.jabber") + ":xmpp");
			this.setIMPPs(2,"googletalk:" + strBundle.GetStringFromName("impp.googletalk") + ":gtalk");
			this.setIMPPs(3,"qq:" + strBundle.GetStringFromName("impp.qq") + ":qq");
			this.setIMPPs(4,"yahoo:" + strBundle.GetStringFromName("impp.yahoo") + ":ymsgr");
		},

		getAllTypesCategory: function () {
			try {
				var count = {};
				var finalResult = [];
				var result = Services.prefs.getChildList(this.prefCardBookTypes, count);
				
				for (let i = 0; i < result.length; i++) {
					finalResult.push(result[i].replace(this.prefCardBookTypes,""));
				}
				finalResult = this._arrayUnique(finalResult);
				finalResult = cardbookUtils.sortArrayByString(finalResult,0,1);
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllTypesCategory error : " + e + "\n");
			}
		},

		getTypes: function (prefName) {
			try {
				let value = this.getStringPref(this.prefCardBookTypes + prefName);
				return value;
			}
			catch(e) {
				dump("cardbookPreferences.getTypes : failed to get" + this.prefCardBookTypes + prefName + "\n" + e + "\n");
			}
		},

		setTypes: function (aType, prefName, value) {
			try {
				this.setStringPref(this.prefCardBookTypes + aType + "." + prefName, value);
			}
			catch(e) {
				dump("cardbookPreferences.setTypes : failed to set" + this.prefCardBookTypes + aType + "." + prefName + "\n" + e + "\n");
			}
		},

		delTypes: function (aType) {
			try {
				if (aType != null && aType !== undefined && aType != "") {
					Services.prefs.deleteBranch(this.prefCardBookTypes + aType);
				} else {
					Services.prefs.deleteBranch(this.prefCardBookTypes);
				}
			}
			catch(e) {
				dump("cardbookPreferences.delTypes : failed to delete" + this.prefCardBookTypes + aType + "\n" + e + "\n");
			}
		},

		getAllTypesByType: function (aType) {
			try {
				var count = {};
				var finalResult = [];
				var finalResult1 = [];
				if (aType === "adr" || aType === "address") {
					var result = Services.prefs.getChildList(this.prefCardBookTypes + "adr" + ".", count);
					if (result.length == 0) {
						var result = Services.prefs.getChildList(this.prefCardBookTypes + "address" + ".", count);
					}
				} else {
					var result = Services.prefs.getChildList(this.prefCardBookTypes + aType + ".", count);
				}
				
				for (let i = 0; i < result.length; i++) {
					var prefName = result[i].replace(this.prefCardBookTypes, "");
					finalResult.push(this.getTypes(prefName));
				}
				finalResult = this._arrayUnique(finalResult);
				for (let i = 0; i < finalResult.length; i++) {
					if (finalResult[i].indexOf(":") > 0) {
						var tmpArray = finalResult[i].split(":");
						if (tmpArray[1] != null && tmpArray[1] !== undefined && tmpArray[1] != "") {
							finalResult1.push([tmpArray[0], tmpArray[1]]);
						} else {
							finalResult1.push([tmpArray[0], tmpArray[0]]);
						}
					} else {
						try {
							var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
							var translated = strBundle.GetStringFromName("types." + aType.toLowerCase() + "." + finalResult[i].toLowerCase());
							if (translated != null && translated !== undefined && translated != "") {
								finalResult1.push([finalResult[i], translated]);
							} else {
								finalResult1.push([finalResult[i], finalResult[i]]);
							}
						}
						catch(e) {
							finalResult1.push([finalResult[i], finalResult[i]]);
						}
					}
				}
				finalResult1 = cardbookUtils.sortArrayByString(finalResult1,1,1);
				return finalResult1;
			}
			catch(e) {
				dump("cardbookPreferences.getAllTypesByType error : " + e + "\n");
			}
		},

		getAllTypes: function () {
			try {
				var finalResult = {};
				var typesList = [ 'email', 'tel', 'impp', 'url', 'adr', 'gender' ];
				for (var i in typesList) {
					var type = typesList[i];
					finalResult[type] = [];
					var result = [];
					result = this.getAllTypesByType(type);
					for (let j = 0; j < result.length; j++) {
						finalResult[type].push([result[j][0], result[j][1], j]);
					}
				}
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllTypes error : " + e + "\n");
			}
		},

		getAllTypesCurrent: function () {
			try {
				var finalResult = {};
				var typesList = [ 'email', 'tel', 'impp', 'url', 'adr', 'gender' ];
				for (var i in typesList) {
					var type = typesList[i];
					finalResult[type] = [];
					var result = [];
					result = this.getAllTypesByType(type);
					for (let j = 0; j < result.length; j++) {
						if (!(finalResult[type] != null && finalResult[type] !== undefined && finalResult[type] != "")) {
							finalResult[type] = {};
						}
						var myCode = result[j][0];
						var myLabel = result[j][1];
						if (!finalResult[type][myCode]) {
							finalResult[type][myCode] = "";
						}
						finalResult[type][myCode] = myLabel;
					}
				}
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllTypesCurrent error : " + e + "\n");
			}
		},

		getTypeLabel: function (aType, aCode) {
			try {
				var resultTmp = [];
				resultTmp = this.getAllTypesByType(aType);
				for (let i = 0; i < resultTmp.length; i++) {
					if (resultTmp[i][0].toLowerCase() == aCode.toLowerCase()) {
						return resultTmp[i][1];
					}
				}
				return aCode;
			}
			catch(e) {
				dump("cardbookPreferences.getTypeLabel error : " + e + "\n");
			}
		},

		getAllCustomFieldsByType: function (aType) {
			try {
				var count = {};
				var finalResult = [];
				var result = Services.prefs.getChildList(this.prefCardBookCustomFields + aType + ".", count);
				
				for (let i = 0; i < result.length; i++) {
					var prefName = result[i].replace(this.prefCardBookCustomFields, "");
					var prefNumber = prefName.replace(aType + '.', '');
					var prefValue = this.getCustomFields(prefName);
					var tmpArray = prefValue.split(":");
					finalResult.push([tmpArray[0], tmpArray[1], parseInt(prefNumber)]);
				}
				finalResult = cardbookUtils.sortArrayByNumber(finalResult,2,1);
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllCustomFieldsByType error : " + e + "\n");
			}
		},

		getAllCustomFields: function () {
			try {
				var finalResult = {};
				var typesList = [ 'pers', 'org' ];
				for (var i in typesList) {
					var type = typesList[i];
					finalResult[type] = [];
					var result = [];
					result = this.getAllCustomFieldsByType(type);
					for (let j = 0; j < result.length; j++) {
						finalResult[type] = result;
					}
				}
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllCustomFields error : " + e + "\n");
			}
		},

		getDiscoveryAccounts: function () {
			try {
				var finalResult = [];
				var tmpResult1 = [];
				var tmpResult2 = [];
				var tmpValue = this.getStringPref(this.prefCardBookRoot + "discoveryAccountsNameList");
				if (tmpValue != "") {
					tmpResult1 = tmpValue.split(",");
					for (var i = 0; i < tmpResult1.length; i++) {
						tmpResult2 = tmpResult1[i].split("::");
						finalResult.push([tmpResult2[1],tmpResult2[0]]);
					}
				}
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getDiscoveryAccounts error : " + e + "\n");
			}
		},

		getAllTels: function () {
			try {
				var count = {};
				var finalResult = [];
				var finalResult1 = [];
				var result = Services.prefs.getChildList(this.prefCardBookTels, count);
				
				for (let i = 0; i < result.length; i++) {
					var prefName = result[i].replace(this.prefCardBookTels, "");
					finalResult.push(this.getTels(prefName));
				}
				finalResult = this._arrayUnique(finalResult);
				for (let i = 0; i < finalResult.length; i++) {
					var tmpArray = finalResult[i].split(":");
					finalResult1.push([tmpArray[0], tmpArray[1], tmpArray[2], i]);
				}
				finalResult1 = cardbookUtils.sortArrayByString(finalResult1,1,1);
				return finalResult1;
			}
			catch(e) {
				dump("cardbookPreferences.getAllTels error : " + e + "\n");
			}
		},

		getAllComplexSearchIds: function () {
			try {
				let count = {};
				let finalResult = [];
				let result = Services.prefs.getChildList(this.prefCardBookData, count);
				for (let i = 0; i < result.length; i++) {
					result[i] = result[i].replace(this.prefCardBookData,"");
					var myTmpArray = result[i].split('.');
					if (myTmpArray[1] == 'type') {
						var value = this.getStringPref(this.prefCardBookData + myTmpArray[0] + '.' + myTmpArray[1]);
						if (value == 'SEARCH') {
							finalResult.push(myTmpArray[0]);
						}
					}
				}
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllPrefIds error : " + e + "\n");
			}
		},

		getAllPrefIds: function () {
			try {
				let count = {};
				let finalResult = [];
				let result = Services.prefs.getChildList(this.prefCardBookData, count);
				for (let i = 0; i < result.length; i++) {
					result[i] = result[i].replace(this.prefCardBookData,"");
					var myTmpArray = result[i].split('.');
					if (myTmpArray[1] == 'id') {
						finalResult.push(myTmpArray[0]);
					}
				}
				return finalResult;
			}
			catch(e) {
				dump("cardbookPreferences.getAllPrefIds error : " + e + "\n");
			}
		},

		getAllRestrictions: function () {
			try {
				let count = {};
				let finalResult = [];
				let result = Services.prefs.getChildList(this.prefCardBookAccountRestrictions, count);
				for (let i = 0; i < result.length; i++) {
					finalResult.push(this.getStringPref(result[i]));
				}
				return finalResult;
			}
			catch(e) {
				return [];
			}
		},

		delRestrictions: function (aRestrictionId) {
			try {
				if (aRestrictionId != null && aRestrictionId !== undefined && aRestrictionId != "") {
					Services.prefs.deleteBranch(this.prefCardBookAccountRestrictions + aRestrictionId);
				} else {
					Services.prefs.deleteBranch(this.prefCardBookAccountRestrictions);
				}
			}
			catch(e) {
				dump("cardbookPreferences.delRestrictions : failed to delete" + this.prefCardBookAccountRestrictions + "\n" + e + "\n");
			}
		},

		setRestriction: function (aRestrictionId, aRestrictionValue) {
			try {
				this.setStringPref(this.prefCardBookAccountRestrictions + aRestrictionId, aRestrictionValue);
			}
			catch(e) {
				dump("cardbookPreferences.setRestriction : failed to set" + this.prefCardBookAccountRestrictions + aRestrictionId + "\n" + e + "\n");
			}
		},

		getAllVCards: function () {
			try {
				let count = {};
				let finalResult = [];
				let result = Services.prefs.getChildList(this.prefCardBookAccountVCards, count);
				for (let i = 0; i < result.length; i++) {
					finalResult.push(this.getStringPref(result[i]));
				}
				return finalResult;
			}
			catch(e) {
				return [];
			}
		},

		delVCards: function (aVCardId) {
			try {
				if (aVCardId != null && aVCardId !== undefined && aVCardId != "") {
					Services.prefs.deleteBranch(this.prefCardBookAccountVCards + aVCardId);
				} else {
					Services.prefs.deleteBranch(this.prefCardBookAccountVCards);
				}
			}
			catch(e) {
				dump("cardbookPreferences.delVCards : failed to delete" + this.prefCardBookAccountVCards + "\n" + e + "\n");
			}
		},

		setVCard: function (aVCardId, aVCardValue) {
			try {
				this.setStringPref(this.prefCardBookAccountVCards + aVCardId, aVCardValue);
			}
			catch(e) {
				dump("cardbookPreferences.setVCard : failed to set" + this.prefCardBookAccountVCards + aVCardId + "\n" + e + "\n");
			}
		},

		getAllEmailsCollections: function () {
			try {
				let count = {};
				let finalResult = [];
				let result = Services.prefs.getChildList(this.prefCardBookEmailsCollection, count);
				for (let i = 0; i < result.length; i++) {
					finalResult.push(this.getStringPref(result[i]));
				}
				return finalResult;
			}
			catch(e) {
				return [];
			}
		},

		delEmailsCollection: function (aRestrictionId) {
			try {
				if (aRestrictionId != null && aRestrictionId !== undefined && aRestrictionId != "") {
					Services.prefs.deleteBranch(this.prefCardBookEmailsCollection + aRestrictionId);
				} else {
					Services.prefs.deleteBranch(this.prefCardBookEmailsCollection);
				}
			}
			catch(e) {
				dump("cardbookPreferences.delEmailsCollection : failed to delete" + this.prefCardBookEmailsCollection + "\n" + e + "\n");
			}
		},

		setEmailsCollection: function (aRestrictionId, aRestrictionValue) {
			try {
				this.setStringPref(this.prefCardBookEmailsCollection + aRestrictionId, aRestrictionValue);
			}
			catch(e) {
				dump("cardbookPreferences.setEmailsCollection : failed to set" + this.prefCardBookEmailsCollection + aRestrictionId + "\n" + e + "\n");
			}
		},

		getAllIMPPs: function () {
			try {
				var count = {};
				var finalResult = [];
				var finalResult1 = [];
				var result = Services.prefs.getChildList(this.prefCardBookIMPPs, count);
				
				for (let i = 0; i < result.length; i++) {
					var prefName = result[i].replace(this.prefCardBookIMPPs, "");
					finalResult.push(this.getIMPPs(prefName));
				}
				finalResult = this._arrayUnique(finalResult);
				for (let i = 0; i < finalResult.length; i++) {
					var tmpArray = finalResult[i].split(":");
					finalResult1.push([tmpArray[0], tmpArray[1], tmpArray[2], i]);
				}
				finalResult1 = cardbookUtils.sortArrayByString(finalResult1,1,1);
				return finalResult1;
			}
			catch(e) {
				dump("cardbookPreferences.getAllIMPPs error : " + e + "\n");
			}
		},

		getIMPPs: function (prefName) {
			try {
				let value = this.getStringPref(this.prefCardBookIMPPs + prefName);
				return value;
			}
			catch(e) {
				dump("cardbookPreferences.getIMPPs : failed to get" + this.prefCardBookIMPPs + prefName + "\n" + e + "\n");
			}
		},

		setIMPPs: function (prefName, value) {
			try {
				this.setStringPref(this.prefCardBookIMPPs + prefName, value);
			}
			catch(e) {
				dump("cardbookPreferences.setIMPPs : failed to set" + this.prefCardBookIMPPs + prefName + "\n" + e + "\n");
			}
		},

		delIMPPs: function () {
			try {
				Services.prefs.deleteBranch(this.prefCardBookIMPPs);
			}
			catch(e) {
				dump("cardbookPreferences.delIMPPs : failed to delete" + this.prefCardBookIMPPs + "\n" + e + "\n");
			}
		},

		getCustomFields: function (prefName) {
			try {
				let value = this.getStringPref(this.prefCardBookCustomFields + prefName);
				return value;
			}
			catch(e) {
				dump("cardbookPreferences.getCustomFields : failed to get" + this.prefCardBookCustomFields + prefName + "\n" + e + "\n");
			}
		},

		setCustomFields: function (aType, prefName, value) {
			try {
				this.setStringPref(this.prefCardBookCustomFields + aType + "." + prefName, value);
			}
			catch(e) {
				dump("cardbookPreferences.setCustomFields : failed to set" + this.prefCardBookCustomFields + aType + "." + prefName + "\n" + e + "\n");
			}
		},

		delCustomFields: function (aType) {
			try {
				if (aType != null && aType !== undefined && aType != "") {
					Services.prefs.deleteBranch(this.prefCardBookCustomFields + aType);
				} else {
					Services.prefs.deleteBranch(this.prefCardBookCustomFields);
				}
			}
			catch(e) {
				dump("cardbookPreferences.delCustomFields : failed to delete" + this.prefCardBookCustomFields + aType + "\n" + e + "\n");
			}
		},

		getTels: function (prefName) {
			try {
				let value = this.getStringPref(this.prefCardBookTels + prefName);
				return value;
			}
			catch(e) {
				dump("cardbookPreferences.getTels : failed to get" + this.prefCardBookTels + prefName + "\n" + e + "\n");
			}
		},

		setTels: function (prefName, value) {
			try {
				this.setStringPref(this.prefCardBookTels + prefName, value);
			}
			catch(e) {
				dump("cardbookPreferences.setTels : failed to set" + this.prefCardBookTels + prefName + "\n" + e + "\n");
			}
		},

		delTels: function () {
			try {
				Services.prefs.deleteBranch(this.prefCardBookTels);
			}
			catch(e) {
				dump("cardbookPreferences.delTels : failed to delete" + this.prefCardBookTels + "\n" + e + "\n");
			}
		},

		getPrefValueLabel: function () {
			let prefValueLabel = this.getStringPref(this.prefCardBookRoot + "preferenceValueLabel");
			if (prefValueLabel != null && prefValueLabel !== undefined && prefValueLabel != "") {
				return prefValueLabel;
			} else {
				let strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
				return strBundle.GetStringFromName("prefValueLabel");
			}
		},

		getId: function (aDirPrefId) {
			return this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "id");
		},

		setId: function (aDirPrefId, id) {
			this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "id", id);
		},

		getName: function (aDirPrefId) {
			return this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "name");
		},

		setName: function (aDirPrefId, name) {
			this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "name", name);
		},

		getUrl: function (aDirPrefId) {
			let url = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "url");
			let type = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "type");
			if (type !== "FILE" && type !== "CACHE" && type !== "DIRECTORY" && type !== "SEARCH" && type !== "LOCALDB") {
				if (url) {
					if (url[url.length - 1] != '/') {
						url += '/';
					}
				}
				return url;
			// for file opened with version <= 3.7
			} else {
				if (url !== "0") {
					return url;
				} else {
					let newUrl = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "name");
					this.setUrl(newUrl);
					return newUrl;
				}
			}
		},

		setUrl: function (aDirPrefId, url) {
			this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "url", url);
		},

		getUser: function (aDirPrefId) {
			return this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "user");
		},

		setUser: function (aDirPrefId, user) {
			this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "user", user);
		},

		getType: function (aDirPrefId) {
			return this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "type");
		},

		setType: function (aDirPrefId, type) {
			this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "type", type);
		},

		getEnabled: function (aDirPrefId) {
			return this.getBoolPref(this.prefCardBookData + aDirPrefId + "." + "enabled", true);
		},

		setEnabled: function (aDirPrefId, enabled) {
			this.setBoolPref(this.prefCardBookData + aDirPrefId + "." + "enabled", enabled);
		},

		getReadOnly: function (aDirPrefId) {
			return this.getBoolPref(this.prefCardBookData + aDirPrefId + "." + "readonly", false);
		},

		setReadOnly: function (aDirPrefId, readonly) {
			this.setBoolPref(this.prefCardBookData + aDirPrefId + "." + "readonly", readonly);
		},

		getExpanded: function (aDirPrefId) {
			return this.getBoolPref(this.prefCardBookData + aDirPrefId + "." + "expanded", true);
		},

		setExpanded: function (aDirPrefId, expanded) {
			this.setBoolPref(this.prefCardBookData + aDirPrefId + "." + "expanded", expanded);
		},

	   getColor: function (aDirPrefId) {
			let color = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "color");
			if (color != null && color !== undefined && color != "") {
				return color;
			} else {
				return "#A8C2E1";
			}
		},

		setColor: function (aDirPrefId, color) {
			this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "color", color);
		},

		getDBCached: function (aDirPrefId) {
			return this.getBoolPref(this.prefCardBookData + aDirPrefId + "." + "DBcached", false);
		},

		setDBCached: function (aDirPrefId, DBcached) {
			this.setBoolPref(this.prefCardBookData + aDirPrefId + "." + "DBcached", DBcached);
		},

		getVCardVersion: function (aDirPrefId) {
			let vCard = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "vCard");
			if (vCard != null && vCard !== undefined && vCard != "") {
				return vCard;
			} else {
				return "3.0";
			}
		},

		setVCardVersion: function (aDirPrefId, aVCard) {
			if (aVCard != null && aVCard !== undefined && aVCard != "") {
				this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "vCard", aVCard);
			}
		},

		getDateFormat: function (aDirPrefId) {
			let dateFormat = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "dateFormat");
			if (dateFormat != null && dateFormat !== undefined && dateFormat != "") {
				return dateFormat;
			} else {
				return "YYYYMMDD";
			}
		},

		setDateFormat: function (aDirPrefId, aDateFormat) {
			if (aDateFormat != null && aDateFormat !== undefined && aDateFormat != "") {
				this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "dateFormat", aDateFormat);
			}
		},

		getUrnuuid: function (aDirPrefId) {
			return this.getBoolPref(this.prefCardBookData + aDirPrefId + "." + "urnuuid", false);
		},

		setUrnuuid: function (aDirPrefId, aUrnuuid) {
			this.setBoolPref(this.prefCardBookData + aDirPrefId + "." + "urnuuid", aUrnuuid);
		},

		getAutoSyncEnabled: function (aDirPrefId) {
			return this.getBoolPref(this.prefCardBookData + aDirPrefId + "." + "autoSyncEnabled", true);
		},

		setAutoSyncEnabled: function (aDirPrefId, aAutoSyncEnabled) {
			this.setBoolPref(this.prefCardBookData + aDirPrefId + "." + "autoSyncEnabled", aAutoSyncEnabled);
		},

		getAutoSyncInterval: function (aDirPrefId) {
			let autoSyncInterval = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "autoSyncInterval");
			if (autoSyncInterval != null && autoSyncInterval !== undefined && autoSyncInterval != "") {
				return autoSyncInterval;
			} else {
				return "60";
			}
		},

		setAutoSyncInterval: function (aDirPrefId, aAutoSyncInterval) {
			if (aAutoSyncInterval != null && aAutoSyncInterval !== undefined && aAutoSyncInterval != "") {
				this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "autoSyncInterval", aAutoSyncInterval);
			}
		},

		getFnFormula: function (aDirPrefId) {
			if (aDirPrefId != null && aDirPrefId !== undefined && aDirPrefId != "") {
				let fnFormula = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "fnFormula");
				if (fnFormula != null && fnFormula !== undefined && fnFormula != "") {
					return fnFormula;
				} else {
					return cardbookRepository.defaultFnFormula;
				}
			} else {
				return cardbookRepository.defaultFnFormula;
			}
		},

		setFnFormula: function (aDirPrefId, aFnFormula) {
			if (aFnFormula != null && aFnFormula !== undefined && aFnFormula != "") {
				this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "fnFormula", aFnFormula);
			}
		},

		getDisplayedColumns: function (aDirPrefId) {
			if (aDirPrefId != null && aDirPrefId !== undefined && aDirPrefId != "") {
				let displayedColumns = this.getStringPref(this.prefCardBookData + aDirPrefId + "." + "displayedColumns");
				if (displayedColumns != null && displayedColumns !== undefined && displayedColumns != "") {
					return displayedColumns;
				} else {
					return cardbookRepository.defaultDisplayedColumns;
				}
			} else {
				return cardbookRepository.defaultDisplayedColumns;
			}
		},

		setDisplayedColumns: function (aDirPrefId, aDisplayedColumns) {
			if (aDisplayedColumns != null && aDisplayedColumns !== undefined && aDisplayedColumns != "") {
				this.setStringPref(this.prefCardBookData + aDirPrefId + "." + "displayedColumns", aDisplayedColumns);
			}
		},

		delBranch: function (aDirPrefId) {
			try {
				Services.prefs.deleteBranch(this.prefCardBookData + aDirPrefId);
			}
			catch(e) {
				dump("cardbookPreferences.delBranch : failed to delete" + this.prefCardBookData + aDirPrefId + "\n" + e + "\n");
			}
		}
	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
};
