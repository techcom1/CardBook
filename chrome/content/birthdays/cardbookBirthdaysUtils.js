if ("undefined" == typeof(cardbookBirthdaysUtils)) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
	Components.utils.import("chrome://cardbook/content/cardbookRepository.js");

	var cardbookBirthdaysUtils = {
		lBirthdayList : [],
		lBirthdayAccountList : {},
		lCalendarList : [],
		lBirthdaySyncResult : [],
		
		isCalendarWritable: function (aCalendar) {
			return (!aCalendar.getProperty("disabled") && !aCalendar.readOnly);
		},
		
		getCalendars: function () {
			var myCalendar = cardbookPreferences.getStringPref("extensions.cardbook.calendarsNameList");
			var calendarManager = Components.classes["@mozilla.org/calendar/manager;1"].getService(Components.interfaces.calICalendarManager);
			var lCalendars = calendarManager.getCalendars({});

			for (var i = 0; i < lCalendars.length; i++) {
				if (myCalendar.includes(lCalendars[i].id)) {
					cardbookBirthdaysUtils.lCalendarList.push(lCalendars[i]);
				}
			}
		},

		syncWithLightning: function () {
			var maxDaysUntilNextBirthday = cardbookPreferences.getStringPref("extensions.cardbook.numberOfDaysForWriting");
			cardbookBirthdaysUtils.loadBirthdays(maxDaysUntilNextBirthday);

			cardbookBirthdaysUtils.getCalendars();
			
			if (cardbookBirthdaysUtils.lBirthdayList.length != 0) {
				cardbookBirthdaysUtils.lBirthdaySyncResult = [];
				AddonManager.getAddonByID(cardbookRepository.LIGHTNING_ID, cardbookBirthdaysUtils.doSyncWithLightning);
			}
		},

		doSyncWithLightning: function (addon) {
			if (addon && addon.isActive) {
				for (var i = 0; i < cardbookBirthdaysUtils.lCalendarList.length; i++) {
					cardbookBirthdaysUtils.syncCalendar(cardbookBirthdaysUtils.lCalendarList[i]);
				}
			}
		},

		syncCalendar: function (aCalendar) {
			var strBundle = document.getElementById("cardbook-strings");
			var errorTitle;
			var errorMsg;

			// if calendar is not found, then abort
			if (aCalendar == 0) {
				errorTitle = strBundle.getString("calendarNotFoundTitle");
				errorMsg = strBundle.getFormattedString("calendarNotFoundMessage",[aCalendar.name]);
				Services.prompt.alert(null, errorTitle, errorMsg);
				return;
			}

			// check if calendar is writable - if not, abort
			if (!(cardbookBirthdaysUtils.isCalendarWritable(aCalendar))) {
				errorTitle = strBundle.getString("calendarNotWritableTitle");
				errorMsg = strBundle.getFormattedString("calendarNotWritableMessage",[aCalendar.name]);
				Services.prompt.alert(null, errorTitle, errorMsg);
				return;
			}

			cardbookBirthdaysUtils.lBirthdaySyncResult.push([aCalendar.name, 0, 0, 0, aCalendar.id]);
			cardbookBirthdaysUtils.syncBirthdays(aCalendar);
		},

		syncBirthdays: function (aCalendar1) {
			var strBundle = document.getElementById("cardbook-strings");
			var date_of_today = new Date();
			for (var i = 0; i < cardbookBirthdaysUtils.lBirthdayList.length; i++) {

				var ldaysUntilNextBirthday = cardbookBirthdaysUtils.lBirthdayList[i][0];
				var lBirthdayName  = cardbookBirthdaysUtils.lBirthdayList[i][1];
				var lBirthdayAge = cardbookBirthdaysUtils.lBirthdayList[i][2];

				var lBirthdayDate = new Date();
				lBirthdayDate.setDate(date_of_today.getDate()+parseInt(ldaysUntilNextBirthday));

				// generate Date as Ical compatible text string
				var lYear = lBirthdayDate.getFullYear();
				var lMonth = lBirthdayDate.getMonth() + 1;
				lMonth += "";
				if (lMonth.length == 1) {
					lMonth = "0"+lMonth;
				}
				var lDay = lBirthdayDate.getDate();
				lDay += "";
				if (lDay.length == 1) {
					lDay = "0" + lDay;
				}
				var lBirthdayDateString = lYear + "" + lMonth + "" + lDay;
				
				var lBirthdayDateNext = new Date(lBirthdayDate.getTime() + (24 * 60 * 60 * 1000));
				var lYear = lBirthdayDateNext.getFullYear();
				var lMonth = lBirthdayDateNext.getMonth() + 1;
				lMonth += "";
				if (lMonth.length == 1) {
					lMonth = "0"+lMonth;
				}
				var lDay = lBirthdayDateNext.getDate();
				lDay += "";
				if (lDay.length == 1) {
					lDay = "0" + lDay;
				}
				var lBirthdayDateNextString = lYear + "" + lMonth + "" + lDay;

				var lBirthdayId = cardbookUtils.getUUID();

				var leventEntryTitle = cardbookPreferences.getStringPref("extensions.cardbook.eventEntryTitle");
				var lBirthdayTitle = leventEntryTitle.replace("%1$S", lBirthdayName).replace("%2$S",lBirthdayAge).replace("%3$S",lYear).replace("%S", lBirthdayName).replace("%S",lBirthdayAge);

				// prepare Listener
				var getListener = {
					mBirthdayId : lBirthdayId,
					mBirthdayName : lBirthdayName,
					mBirthdayAge : lBirthdayAge,
					mBirthdayDateString : lBirthdayDateString,
					mBirthdayDateNextString : lBirthdayDateNextString,
					mBirthdayTitle : lBirthdayTitle,
					mBirthdayResultGetCount : 0,
					mCalendar : aCalendar1,
					onGetResult: function(aCalendar, aStatus, aItemType, aDetail, aCount, aItems) {
						wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.mCalendar.name + " : debug mode : aCount : " + aCount);
						for (let i=0; i < aCount; i++) {
							var summary = aItems[i].getProperty("SUMMARY");
							if (summary == this.mBirthdayTitle) {
								wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.mCalendar.name + " : debug mode : found : " + this.mBirthdayTitle + ", against : " + summary);
								this.mBirthdayResultGetCount++;
								break;
							} else {
								wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.mCalendar.name + " : debug mode : not found : " + this.mBirthdayTitle + ", against : " + summary);
							}
						}
					},
	
					onOperationComplete: function (aCalendar, aStatus, aOperationType, aId, aDetail) {
						if (this.mBirthdayResultGetCount === 0) {
							cardbookBirthdaysUtils.addNewCalendarEntry(this.mCalendar, this.mBirthdayId, this.mBirthdayName, this.mBirthdayAge, this.mBirthdayDateString, this.mBirthdayDateNextString, this.mBirthdayTitle);
						} else {
							cardbookUtils.formatStringForOutput("syncListExistingEntry", [this.mCalendar.name, this.mBirthdayName]);
							cardbookBirthdaysUtils.lBirthdaySyncResult.push([this.mCalendar.name, 1, 0, 0, this.mCalendar.id]);
						}
					}
				}
	
				var calICalendar = Components.interfaces.calICalendar;
				var startRange = new Date(lBirthdayDate.getTime() - (24 * 60 * 60 * 1000));
				var endRange = new Date(lBirthdayDate.getTime() + (24 * 60 * 60 * 1000));
				Components.utils.import("resource://calendar/modules/calUtils.jsm");
				startRange = cal.jsDateToDateTime(startRange);
				endRange = cal.jsDateToDateTime(endRange);
				aCalendar1.getItems(calICalendar.ITEM_FILTER_TYPE_EVENT, 0, startRange, endRange, getListener);
			}
		},

		addNewCalendarEntry: function (aCalendar2, aBirthdayId, aBirthdayName, aBirthdayAge, aDate, aNextDate, aBirthdayTitle) {
			var strBundle = document.getElementById("cardbook-strings");

			// Strategy is to create iCalString and create Event from that string
			var iCalString = "BEGIN:VCALENDAR\n";
			iCalString += "BEGIN:VEVENT\n";

			var calendarEntryCategories = cardbookPreferences.getStringPref("extensions.cardbook.calendarEntryCategories");
			if (calendarEntryCategories !== "") {
				iCalString += "CATEGORIES:" + calendarEntryCategories + "\n";
			}
			
			var eventEntryWholeDay = cardbookPreferences.getBoolPref("extensions.cardbook.eventEntryWholeDay");
			if (eventEntryWholeDay) {
				iCalString += "DTSTART:" + aDate + "\n";
				iCalString += "DTEND:" + aNextDate + "\n";
			} else {
				var eventEntryTime = cardbookPreferences.getStringPref("extensions.cardbook.eventEntryTime");
				var EmptyParamRegExp1 = new RegExp("(.*)([^0-9])(.*)", "ig");
				if (eventEntryTime.replace(EmptyParamRegExp1, "$1")!=eventEntryTime) {
					var eventEntryTimeHour = eventEntryTime.replace(EmptyParamRegExp1, "$1");
					var eventEntryTimeMin = eventEntryTime.replace(EmptyParamRegExp1, "$3");
					if ( eventEntryTimeHour < 10 && eventEntryTimeHour.length == 1 ) {
						eventEntryTimeHour = "0" + eventEntryTimeHour;
					}
					if ( eventEntryTimeMin < 10 && eventEntryTimeMin.length == 1 ) {
						eventEntryTimeMin = "0" + eventEntryTimeMin;
					}
					var lBirthdayTimeString = eventEntryTimeHour.toString() + eventEntryTimeMin.toString() + "00";
				} else {
					var lBirthdayTimeString = "000000";
				}
				iCalString += "DTSTART:" + aDate + "T" + lBirthdayTimeString + "\n";
				iCalString += "DTEND:" + aDate + "T" + lBirthdayTimeString + "\n";
			}

			// set Alarms
			var lcalendarEntryAlarm = cardbookPreferences.getStringPref("extensions.cardbook.calendarEntryAlarm");
			var lcalendarEntryAlarmArray = lcalendarEntryAlarm.split(',');
			for (var i = 0; i < lcalendarEntryAlarmArray.length; i++) {
				// default before alarm before event
				var sign = "-";
				lcalendarEntryAlarmArray[i] = lcalendarEntryAlarmArray[i].replace(/\-/g, "").replace(/ /g, "");
				if (lcalendarEntryAlarmArray[i].includes("+")) {
					sign = "";
					lcalendarEntryAlarmArray[i] = lcalendarEntryAlarmArray[i].replace(/\+/g, "").replace(/ /g, "");
				}
				if (!isNaN(parseInt(lcalendarEntryAlarmArray[i]))) {
					iCalString += "BEGIN:VALARM\nACTION:DISPLAY\nTRIGGER:" + sign + "PT" + parseInt(lcalendarEntryAlarmArray[i]) + "H\nEND:VALARM\n";
				}
			}

			// finalize iCalString
			iCalString += "END:VEVENT\n";
			iCalString += "END:VCALENDAR\n";
			
			// create event Object out of iCalString
			var event = Components.classes["@mozilla.org/calendar/event;1"].createInstance(Components.interfaces.calIEvent);
			event.icalString = iCalString;

			// set Title
			event.title = aBirthdayTitle;
			event.id = aBirthdayId;

			// prepare Listener
			var addListener = {
				mBirthdayId : aBirthdayId,
				mBirthdayName : aBirthdayName,
				mCalendar : aCalendar2,
				onOperationComplete: function (aCalendar, aStatus, aOperationType, aId, aDetail) {
					wdw_cardbooklog.updateStatusProgressInformationWithDebug2(this.mCalendar.name + " : debug mode : created operation finished : " + this.mBirthdayId + " : " + this.mBirthdayName);
					if (aStatus == 0) {
						cardbookUtils.formatStringForOutput("syncListCreatedEntry", [this.mCalendar.name, this.mBirthdayName]);
						cardbookBirthdaysUtils.lBirthdaySyncResult.push([this.mCalendar.name, 0, 0, 1, this.mCalendar.id]);
					} else {
						cardbookUtils.formatStringForOutput("syncListErrorEntry", [this.mCalendar.name, this.mBirthdayName], "Error");
						cardbookBirthdaysUtils.lBirthdaySyncResult.push([this.mCalendar.name, 0, 1, 0, this.mCalendar.id]);
					}
				}
			}

			// add Item to Calendar
			aCalendar2.addItem(event, addListener);
		},

		daysBetween: function (date1, date2) {
			// The number of milliseconds in one day
			var oneDay = 1000 * 60 * 60 * 24;
			
			var newDate1 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
			var newDate2 = new Date(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
			return Math.round((newDate1.getTime() - newDate2.getTime())/(oneDay));
		},

		calcDateOfNextBirthday: function (lDateRef, lDateOfBirth) {
			var lDoB_Year = lDateOfBirth.getUTCFullYear();
			var lDoB_Month= lDateOfBirth.getUTCMonth();
			var lDoB_Day = lDateOfBirth.getUTCDate();
			
			var lnextBirthday = new Date(lDateOfBirth);
			lnextBirthday.setUTCFullYear(lDateRef.getUTCFullYear());
			
			if (this.daysBetween(lnextBirthday, lDateRef)<0) {
				return new Date(Date.UTC(lDateRef.getUTCFullYear()+1, lDoB_Month, lDoB_Day));
			} else {
				return new Date(Date.UTC(lDateRef.getUTCFullYear(), lDoB_Month, lDoB_Day));
			}
		},

		getAllBirthdaysByName: function (aDateFormat, lDateOfBirth, lName, lNumberOfDays2, lDateOfBirthFound, lEmail, aDirPrefId) {
			var date_of_today = new Date();
			var endDate = new Date();
			var dateRef = new Date();
			var lnextBirthday;
			var lAge;
			var ldaysUntilNextBirthday;
			var lDateOfBirthOld = lDateOfBirth;
			lDateOfBirth = cardbookDates.convertDateStringToDate(lDateOfBirth, aDateFormat);

			endDate.setUTCDate(date_of_today.getUTCDate()+parseInt(lNumberOfDays2));
			while (dateRef < endDate) {
				lnextBirthday = this.calcDateOfNextBirthday(dateRef,lDateOfBirth);
				if (lDateOfBirth.getFullYear() == "666") {
					lAge = "?";
					lDateOfBirthOld = "?";
				} else {
					lAge = lnextBirthday.getFullYear()-lDateOfBirth.getFullYear();
				}
				ldaysUntilNextBirthday = this.daysBetween(lnextBirthday, date_of_today);
				if (parseInt(ldaysUntilNextBirthday) <= parseInt(lNumberOfDays2)) {
					if (ldaysUntilNextBirthday === parseInt(ldaysUntilNextBirthday)) {
						cardbookBirthdaysUtils.lBirthdayList.push([ldaysUntilNextBirthday, lName, lAge, lDateOfBirthOld, lDateOfBirthFound, lEmail, aDirPrefId, aDateFormat]);
					} else {
						cardbookBirthdaysUtils.lBirthdayList.push(["0", lName + " : Error", "0", "0", lDateOfBirthFound, lEmail, aDirPrefId, aDateFormat]);
					}
					if (!(cardbookBirthdaysUtils.lBirthdayAccountList[aDirPrefId])) {
						cardbookBirthdaysUtils.lBirthdayAccountList[aDirPrefId] = "";
					}
				}
				dateRef.setMonth(dateRef.getMonth() + 12);
			}
		},
	
		loadBirthdays: function (lnumberOfDays) {
			var myContact = cardbookPreferences.getStringPref("extensions.cardbook.addressBooksNameList");
			var searchInNote = cardbookPreferences.getBoolPref("extensions.cardbook.searchInNote");
			var useOnlyEmail = cardbookPreferences.getBoolPref("extensions.cardbook.useOnlyEmail");
			var strBundle = document.getElementById("cardbook-strings");
			var eventInNoteEventPrefix = strBundle.getString("eventInNoteEventPrefix");
			var deathSuffix = strBundle.getString("deathSuffix");
			cardbookBirthdaysUtils.lBirthdayList = [];
			
			for (i in cardbookRepository.cardbookCards) {
				var myCard = cardbookRepository.cardbookCards[i];
				var myDirPrefId = myCard.dirPrefId;
				if (myContact.includes(myDirPrefId) || myContact === "allAddressBooks") {
					var dateFormat = cardbookPreferences.getDateFormat(myDirPrefId);
					var myDirPrefName = cardbookUtils.getPrefNameFromPrefId(myDirPrefId);
					var myFieldList = ['bday' , 'anniversary', 'deathdate'];
					for (var k = 0; k < myFieldList.length; k++) {
						if (myCard[myFieldList[k]] && myCard[myFieldList[k]] != "") {
							var myFieldValue = myCard[myFieldList[k]];
							var isDate = cardbookDates.convertDateStringToDate(myFieldValue, dateFormat);
							if (isDate != "WRONGDATE") {
								listOfEmail = cardbookUtils.getMimeEmailsFromCards([myCard], useOnlyEmail);
								if (myFieldList[k] == "deathdate") {
									cardbookBirthdaysUtils.getAllBirthdaysByName(dateFormat, myFieldValue, myCard.fn + ' ' + deathSuffix, lnumberOfDays, myFieldValue, listOfEmail, myDirPrefId);
								} else {
									cardbookBirthdaysUtils.getAllBirthdaysByName(dateFormat, myFieldValue, myCard.fn, lnumberOfDays, myFieldValue, listOfEmail, myDirPrefId);
								}
							} else {
								cardbookUtils.formatStringForOutput("birthdayEntry1Wrong", [myDirPrefName, myCard.fn, myFieldValue, dateFormat], "Warning");
							}
						}
					}
					if (searchInNote == true) {
						var lNotesLine = myCard.note.split("\n");
						for (var a = 0; a < lNotesLine.length; a++) {
							// compatibility when not localized
							var EmptyParamRegExp1 = new RegExp("^Birthday:([^:]*):([^:]*)([:]*)(.*)", "ig");
							if (lNotesLine[a].replace(EmptyParamRegExp1, "$1")!=lNotesLine[a]) {
								var lNotesName = lNotesLine[a].replace(EmptyParamRegExp1, "$1").replace(/^\s+|\s+$/g,"");
								if (lNotesLine[a].replace(EmptyParamRegExp1, "$2")!=lNotesLine[a]) {
									var lNotesDateFound = lNotesLine[a].replace(EmptyParamRegExp1, "$2").replace(/^\s+|\s+$/g,"");
									var isDate = cardbookDates.convertDateStringToDate(lNotesDateFound, dateFormat);
									if (isDate != "WRONGDATE") {
										listOfEmail = cardbookUtils.getMimeEmailsFromCards([myCard], useOnlyEmail);
										cardbookBirthdaysUtils.getAllBirthdaysByName(dateFormat, lNotesDateFound, lNotesName, lnumberOfDays, lNotesDateFound, listOfEmail, myDirPrefId);
									} else {
										cardbookUtils.formatStringForOutput("birthdayEntry2Wrong", [myDirPrefName, myCard.fn, lNotesDateFound, dateFormat], "Warning");
									}
								}
							}
							// now localized
							var EmptyParamRegExp1 = new RegExp("^" + eventInNoteEventPrefix + ":([^:]*):([^:]*)([:]*)(.*)", "ig");
							if (lNotesLine[a].replace(EmptyParamRegExp1, "$1")!=lNotesLine[a]) {
								var lNotesName = lNotesLine[a].replace(EmptyParamRegExp1, "$1").replace(/^\s+|\s+$/g,"");
								if (lNotesLine[a].replace(EmptyParamRegExp1, "$2")!=lNotesLine[a]) {
									var lNotesDateFound = lNotesLine[a].replace(EmptyParamRegExp1, "$2").replace(/^\s+|\s+$/g,"");
									var isDate = cardbookDates.convertDateStringToDate(lNotesDateFound, dateFormat);
									if (isDate != "WRONGDATE") {
										listOfEmail = cardbookUtils.getMimeEmailsFromCards([myCard], useOnlyEmail);
										cardbookBirthdaysUtils.getAllBirthdaysByName(dateFormat, lNotesDateFound, lNotesName, lnumberOfDays, lNotesDateFound, listOfEmail, myDirPrefId);
									} else {
										cardbookUtils.formatStringForOutput("birthdayEntry2Wrong", [myDirPrefName, myCard.fn, lNotesDateFound, dateFormat], "Warning");
									}
								}
							}
						}
					}
				}
			}
		}
	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/wdw_log.js");
	loader.loadSubScript("chrome://cardbook/content/cardbookUtils.js");
};
