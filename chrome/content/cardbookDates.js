// supported formats :
// "YYYY-MM-DD"
// "YYYY.MM.DD"
// "YYYY/MM/DD"
// "DD-MM-YYYY"
// "DD.MM.YYYY"
// "DD/MM/YYYY"
// "MM-DD-YYYY"
// "MM.DD.YYYY"
// "MM/DD/YYYY"
// "YYYYMMDD"
// "DDMMYYYY"
// "MMDDYYYY"
if ("undefined" == typeof(cardbookDates)) {
	try {
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var cardbookDates = {
		
		getDateForCompare: function (aCard, aField) {
			try {
				if (aCard[aField] == "") {
					return new Date(Date.UTC('666', '6', '6'));
				} else {
					var dateFormat = cardbookPreferences.getDateFormat(aCard.dirPrefId);
					var myDate = cardbookDates.convertDateStringToDate(aCard[aField], dateFormat);
					if (myDate == "WRONGDATE") {
						return new Date(Date.UTC('666', '6', '6'));
					} else {
						return myDate;
					}
				}
			}
			catch (e) {
				return new Date(Date.UTC('666', '6', '6'));
			}
		},

		getFormattedDateForCard: function (aCard, aField) {
			try {
				if (aCard[aField] == "") {
					return "";
				} else {
					var dateFormat = cardbookPreferences.getDateFormat(aCard.dirPrefId);
					return cardbookDates.getFormattedDateForDateString(aCard[aField], dateFormat, cardbookRepository.dateDisplayedFormat);
				}
			}
			catch (e) {
				return aCard[aField];
			}
		},

		getFormattedDateForDateString: function (aDateString, aSourceDateFormat, aTargetDateFormat) {
			try {
				var myDate = cardbookDates.convertDateStringToDate(aDateString, aSourceDateFormat);
				if (myDate == "WRONGDATE") {
					return aDateString;
				} else if (myDate.getFullYear() == "666") {
					if (Services.vc.compare(Services.appinfo.version, "57") >= 0) {
						if (Services.vc.compare(Services.appinfo.version, "59") >= 0) {
							if (aTargetDateFormat == "0") {
								var formatter = new Services.intl.DateTimeFormat(undefined, { month: "long", day: "numeric", timeZone: "UTC"});
							} else {
								var formatter = new Services.intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC"});
							}
							return formatter.format(myDate);
						} else {
							if (aTargetDateFormat == "0") {
								var formatter = Services.intl.createDateTimeFormat(undefined, { month: "long", day: "numeric", timeZone: "UTC"});
							} else {
								var formatter = Services.intl.createDateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC"});
							}
							return formatter.format(myDate);
						}
					} else {
						if (aDateString.startsWith("--") && aSourceDateFormat == "YYYYMMDD") {
							aDateString = aDateString.replace(/^--/, "");
						}
						return aDateString;
					}
				} else {
					if (Services.vc.compare(Services.appinfo.version, "57") >= 0) {
						if (Services.vc.compare(Services.appinfo.version, "59") >= 0) {
							if (aTargetDateFormat == "0") {
								var formatter = new Services.intl.DateTimeFormat(undefined, {dateStyle: "long", timeZone: "UTC"});
							} else {
								var formatter = new Services.intl.DateTimeFormat(undefined, {dateStyle: "short", timeZone: "UTC"});
							}
							return formatter.format(myDate);
						} else {
							if (aTargetDateFormat == "0") {
								var formatter = Services.intl.createDateTimeFormat(undefined, {dateStyle: "long", timeZone: "UTC"});
							} else {
								var formatter = Services.intl.createDateTimeFormat(undefined, {dateStyle: "short", timeZone: "UTC"});
							}
							return formatter.format(myDate);
						}
					} else {
						var myDateService = Components.classes["@mozilla.org/intl/scriptabledateformat;1"].getService(Components.interfaces.nsIScriptableDateFormat);
						if (aTargetDateFormat == "0") {
							return myDateService.FormatDate("", Components.interfaces.nsIScriptableDateFormat.dateFormatLong, myDate.getUTCFullYear(), myDate.getUTCMonth() + 1, myDate.getUTCDate());
						} else {
							return myDateService.FormatDate("", Components.interfaces.nsIScriptableDateFormat.dateFormatShort, myDate.getUTCFullYear(), myDate.getUTCMonth() + 1, myDate.getUTCDate());
						}
					}
				}
			}
			catch (e) {
				return aDateString;
			}
		},

		getAge: function (aCard) {
			try {
				if (aCard.bday == "") {
					return "";
				} else {
					var dateFormat = cardbookPreferences.getDateFormat(aCard.dirPrefId);
					var lDateOfBirth = cardbookDates.convertDateStringToDate(aCard.bday, dateFormat);
					if (lDateOfBirth == "WRONGDATE") {
						return "?";
					} else if (lDateOfBirth.getFullYear() == "666") {
						return "?";
					} else {
						var today = new Date();
						var age = today.getFullYear() - lDateOfBirth.getFullYear();
						var m = today.getMonth() - lDateOfBirth.getMonth();
						if (m < 0 || (m === 0 && today.getDate() < lDateOfBirth.getDate())) {
							age--;
						}
						return age.toString();
					}
				}
			}
			catch (e) {
				return "?";
			}
		},

		getSeparator: function (aDateFormat) {
			switch(aDateFormat) {
				case "YYYY-MM-DD":
				case "DD-MM-YYYY":
				case "MM-DD-YYYY":
					var lSeparator = "-";
					break;
				case "YYYY.MM.DD":
				case "DD.MM.YYYY":
				case "MM.DD.YYYY":
					var lSeparator = ".";
					break;
				case "YYYY/MM/DD":
				case "DD/MM/YYYY":
				case "MM/DD/YYYY":
					var lSeparator = "/";
					break;
				default:
					var lSeparator = "";
			}
			return lSeparator;
		},

		convertDateStringToDate: function (aDateString, aDateFormat) {
			try {
				// cleanup for partial dates and dates with timestamps
				if (aDateString.startsWith("--") && aDateFormat == "YYYYMMDD") {
					aDateString = aDateString.replace(/^--/, "");
				}
				aDateString = aDateString.replace(/^([\d\-\.\/]*)([^\d\-\.\/])(.*)/, "$1");
				var lSeparator = cardbookDates.getSeparator(aDateFormat);
				var lReturn;
				var lFirstField;
				var lSecondField;
				var lThirdField;
				if (aDateString.length < 3) {
					lReturn = "WRONGDATE";
				} else if (lSeparator != "" && !aDateString.includes(lSeparator)) {
					lReturn = "WRONGDATE";
				} else if (lSeparator == "" && (aDateString.includes("-") || aDateString.includes(".") || aDateString.includes("/"))) {
					lReturn = "WRONGDATE";
				} else {
					switch(aDateFormat) {
						case "YYYY-MM-DD":
						case "YYYY.MM.DD":
						case "YYYY/MM/DD":
							if (aDateString.split(lSeparator).length == 3) {
								var EmptyParamRegExp2 = new RegExp("^([^\-]*)\\" + lSeparator + "([^\-]*)\\" + lSeparator + "([^\-]*)", "ig");
								if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
									lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
									lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
									lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
									lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
									lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
									lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
								}
								lReturn = new Date(Date.UTC(lFirstField, lSecondField-1, lThirdField));
							} else {
								var EmptyParamRegExp2 = new RegExp("^([^\-]*)\\" + lSeparator + "([^\-]*)", "ig");
								if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
									lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
									lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
									lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
									lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								}
								lReturn = new Date(Date.UTC('666', lFirstField-1, lSecondField));
							}
							break;
						case "DD-MM-YYYY":
						case "DD.MM.YYYY":
						case "DD/MM/YYYY":
							if (aDateString.split(lSeparator).length == 3) {
								var EmptyParamRegExp2 = new RegExp("^([^\.]*)\\" + lSeparator + "([^\.]*)\\" + lSeparator + "([^\.]*)", "ig");
								if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
									lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
									lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
									lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
									lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
									lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
									lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
								}
								lReturn = new Date(Date.UTC(lThirdField, lSecondField-1, lFirstField));
							} else {
								var EmptyParamRegExp2 = new RegExp("^([^\.]*)\\" + lSeparator + "([^\.]*)", "ig");
								if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
									lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
									lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
									lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
									lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								}
								lReturn = new Date(Date.UTC('666', lSecondField-1, lFirstField));
							}
							break;
						case "MM-DD-YYYY":
						case "MM.DD.YYYY":
						case "MM/DD/YYYY":
							if (aDateString.split(lSeparator).length == 3) {
								var EmptyParamRegExp2 = new RegExp("^([^\/]*)\\" + lSeparator + "([^\/]*)\\" + lSeparator + "([^\/]*)", "ig");
								if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
									lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
									lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
									lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
									lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
									lThirdField = aDateString.replace(EmptyParamRegExp2, "$3");
									lThirdField = (lThirdField.length<2?'0':'') + lThirdField;
								}
								lReturn = new Date(Date.UTC(lThirdField, lFirstField-1, lSecondField));
							} else {
								var EmptyParamRegExp2 = new RegExp("^([^\/]*)\\" + lSeparator + "([^\/]*)", "ig");
								if (aDateString.replace(EmptyParamRegExp2, "$1")!=aDateString) {
									lFirstField = aDateString.replace(EmptyParamRegExp2, "$1");
									lFirstField = (lFirstField.length<2?'0':'') + lFirstField;
									lSecondField = aDateString.replace(EmptyParamRegExp2, "$2");
									lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								}
								lReturn = new Date(Date.UTC('666', lFirstField-1, lSecondField));
							}
							break;
						case "YYYYMMDD":
							if (aDateString.startsWith("--")) {
								aDateString = aDateString.replace(/^--/, "");
							}
							if (aDateString.length == 8) {
								lFirstField = aDateString.substr(0, 4);
								lSecondField = aDateString.substr(4, 2);
								lThirdField = aDateString.substr(6, 2);
								lReturn = new Date(Date.UTC(lFirstField, lSecondField-1, lThirdField));
							} else if (aDateString.length == 4 || aDateString.length == 3) {
								lFirstField = aDateString.substr(0, 2);
								lSecondField = aDateString.substr(2, 2);
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								lReturn = new Date(Date.UTC('666', lFirstField-1, lSecondField));
							} else {
								lReturn = "WRONGDATE";
							}
							break;
						case "DDMMYYYY":
							if (aDateString.length == 8) {
								lFirstField = aDateString.substr(0, 2);
								lSecondField = aDateString.substr(2, 2);
								lThirdField = aDateString.substr(4, 4);
								lReturn = new Date(Date.UTC(lThirdField, lSecondField-1, lFirstField));
							} else if (aDateString.length == 4 || aDateString.length == 3) {
								lFirstField = aDateString.substr(0, 2);
								lSecondField = aDateString.substr(2, 2);
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								lReturn = new Date(Date.UTC('666', lSecondField-1, lFirstField));
							} else {
								lReturn = "WRONGDATE";
							}
							break;
						case "MMDDYYYY":
							if (aDateString.length == 8) {
								lFirstField = aDateString.substr(0, 2);
								lSecondField = aDateString.substr(2, 2);
								lThirdField = aDateString.substr(4, 4);
								lReturn = new Date(Date.UTC(lThirdField, lFirstField-1, lSecondField));
							} else if (aDateString.length == 4 || aDateString.length == 3) {
								lFirstField = aDateString.substr(0, 2);
								lSecondField = aDateString.substr(2, 2);
								lSecondField = (lSecondField.length<2?'0':'') + lSecondField;
								lReturn = new Date(Date.UTC('666', lFirstField-1, lSecondField));
							} else {
								lReturn = "WRONGDATE";
							}
							break;
						default:
							lReturn = "WRONGDATE";
					}
				}
				return lReturn;
			}
			catch (e) {
				return "WRONGDATE";
			}
		},

		convertDateStringToDateString: function (aDay, aMonth, aYear, aDateFormat) {
			if (! isNaN(aMonth) && aMonth.length == 1) {
				aMonth = "0" + aMonth;
			}
			if (! isNaN(aDay) && aDay.length == 1) {
				aDay = "0" + aDay;
			}
			if (aYear == "") {
				aYear = "666";
			}
			return cardbookDates.getFinalDateString(aDay, aMonth, aYear, aDateFormat);
		},

		convertDateToDateString: function (aDate, aDateFormat) {
			var lYear = aDate.getFullYear();
			var lMonth = aDate.getMonth() + 1;
			lMonth += "";
			if (lMonth.length == 1) {
				lMonth = "0"+lMonth;
			}
			var lDay = aDate.getDate();
			lDay += "";
			if (lDay.length == 1) {
				lDay = "0" + lDay;
			}
			return cardbookDates.getFinalDateString(lDay, lMonth, lYear, aDateFormat);
		},

		getFinalDateString: function (aDay, aMonth, aYear, aDateFormat) {
			var lSeparator = cardbookDates.getSeparator(aDateFormat);
			switch(aDateFormat) {
				case "YYYY-MM-DD":
				case "YYYY.MM.DD":
				case "YYYY/MM/DD":
					if (aYear == "666") {
						return aMonth + lSeparator + aDay;
					} else {
						return aYear + lSeparator + aMonth + lSeparator + aDay;
					}
					break;
				case "DD-MM-YYYY":
				case "DD.MM.YYYY":
				case "DD/MM/YYYY":
					if (aYear == "666") {
						return aDay + lSeparator + aMonth;
					} else {
						return aDay + lSeparator + aMonth + lSeparator + aYear;
					}
					break;
				break;
				case "MM-DD-YYYY":
				case "MM.DD.YYYY":
				case "MM/DD/YYYY":
					if (aYear == "666") {
						return aMonth + lSeparator + aDay;
					} else {
						return aMonth + lSeparator + aDay + lSeparator + aYear;
					}
					break;
				case "YYYYMMDD":
					if (aYear == "666") {
						return "--" + aMonth + aDay;
					} else {
						return aYear + aMonth + aDay;
					}
					break;
				case "DDMMYYYY":
					if (aYear == "666") {
						return aDay + aMonth;
					} else {
						return aDay + aMonth + aYear;
					}
					break;
				case "MMDDYYYY":
					if (aYear == "666") {
						return aMonth + aDay;
					} else {
						return aMonth + aDay + aYear;
					}
					break;
			}
		},

		convertAddressBookDate: function (aDirPrefId, aDirPrefName, aSourceDateFormat, aTargetDateFormat) {
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			var eventInNoteEventPrefix = strBundle.GetStringFromName("eventInNoteEventPrefix");
			for (i in cardbookRepository.cardbookCards) {
				var myCard = cardbookRepository.cardbookCards[i];
				if (myCard.dirPrefId != aDirPrefId) {
					continue;
				}
				var myTempCard = new cardbookCardParser();
				cardbookUtils.cloneCard(myCard, myTempCard);
				var cardChanged = false;
				var myFieldList = ['bday' , 'anniversary', 'deathdate'];
				for (var j = 0; j < myFieldList.length; j++) {
					if (myCard[myFieldList[j]] && myCard[myFieldList[j]] != "") {
						var myFieldValue = myCard[myFieldList[j]];
						var isDate = cardbookDates.convertDateStringToDate(myFieldValue, aSourceDateFormat);
						if (isDate != "WRONGDATE") {
							var myFieldValueDate = cardbookDates.convertDateStringToDate(myFieldValue, aSourceDateFormat);
							myTempCard[myFieldList[j]] = cardbookDates.convertDateToDateString(myFieldValueDate, aTargetDateFormat);
							var cardChanged = true;
						} else {
							cardbookUtils.formatStringForOutput("birthdayEntry1Wrong", [aDirPrefName, myCard.fn, myFieldValue, aSourceDateFormat], "Warning");
						}
					}
				}
				var notesChanged = false;
				if (myCard.note != "") {
					var lNotesLine = myCard.note.split("\n");
					var newNotes = [];
					for (var a = 0; a < lNotesLine.length; a++) {
						// compatibility when not localized
						var EmptyParamRegExp1 = new RegExp("^Birthday:([^:]*):([^:]*)([:]*)(.*)", "ig");
						if (lNotesLine[a].replace(EmptyParamRegExp1, "$1")!=lNotesLine[a]) {
							var lNotesName = lNotesLine[a].replace(EmptyParamRegExp1, "$1").replace(/^\s+|\s+$/g,"");
							if (lNotesLine[a].replace(EmptyParamRegExp1, "$2")!=lNotesLine[a]) {
								var lNotesDateFound = lNotesLine[a].replace(EmptyParamRegExp1, "$2").replace(/^\s+|\s+$/g,"");
								var isDate = cardbookDates.convertDateStringToDate(lNotesDateFound, aSourceDateFormat);
								if (isDate != "WRONGDATE") {
									newNotes.push(eventInNoteEventPrefix + ":" + lNotesName + ":" + cardbookDates.convertDateToDateString(isDate, aTargetDateFormat));
									var notesChanged = true;
								} else {
									cardbookUtils.formatStringForOutput("birthdayEntry2Wrong", [aDirPrefName, myCard.fn, lNotesDateFound, aSourceDateFormat], "Warning");
									newNotes.push(lNotesLine[a]);
								}
							} else {
								newNotes.push(lNotesLine[a]);
							}
						} else {
							// now localized
							var EmptyParamRegExp1 = new RegExp("^" + eventInNoteEventPrefix + ":([^:]*):([^:]*)([:]*)(.*)", "ig");
							if (lNotesLine[a].replace(EmptyParamRegExp1, "$1")!=lNotesLine[a]) {
								var lNotesName = lNotesLine[a].replace(EmptyParamRegExp1, "$1").replace(/^\s+|\s+$/g,"");
								if (lNotesLine[a].replace(EmptyParamRegExp1, "$2")!=lNotesLine[a]) {
									var lNotesDateFound = lNotesLine[a].replace(EmptyParamRegExp1, "$2").replace(/^\s+|\s+$/g,"");
									var isDate = cardbookDates.convertDateStringToDate(lNotesDateFound, aSourceDateFormat);
									if (isDate != "WRONGDATE") {
										newNotes.push(eventInNoteEventPrefix + ":" + lNotesName + ":" + cardbookDates.convertDateToDateString(isDate, aTargetDateFormat));
										var notesChanged = true;
									} else {
										cardbookUtils.formatStringForOutput("birthdayEntry2Wrong", [aDirPrefName, myCard.fn, lNotesDateFound, aSourceDateFormat], "Warning");
										newNotes.push(lNotesLine[a]);
									}
								} else {
									newNotes.push(lNotesLine[a]);
								}
							} else {
								newNotes.push(lNotesLine[a]);
							}
						}
						if (notesChanged) {
							myTempCard.note = newNotes.join("\n");
						}
					}
				}
				if (cardChanged || notesChanged) {
					cardbookRepository.saveCard(myCard, myTempCard, "cardbook.cardAddedDirect");
				} else {
					myTempCard = null;
				}
			}
		}

	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/cardbookCardParser.js");
};
