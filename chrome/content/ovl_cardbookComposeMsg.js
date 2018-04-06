if ("undefined" == typeof(ovl_cardbookComposeMsg)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var ovl_cardbookComposeMsg = {
		LoadIdentity: function() {
			var outerID = GetCurrentEditorElement().outerWindowID;
			cardbookRepository.composeMsgIdentity[outerID] = document.getElementById("msgIdentity").selectedItem.getAttribute("identitykey");
		},

		newInCardBook: function() {
			try {
				var myNewCard = new cardbookCardParser();
				cardbookUtils.openEditionWindow(myNewCard, "CreateContact", "cardbook.cardAddedIndirect");
			}
			catch (e) {
				var errorTitle = "newInCardBook";
				Services.prompt.alert(null, errorTitle, e);
			}
		},

		setAB: function() {
			document.getElementById("tasksMenuAddressBook").removeAttribute("key");
			document.getElementById("key_addressbook").setAttribute("key", "");
			var exclusive = cardbookPreferences.getBoolPref("extensions.cardbook.exclusive");
			var myPopup = document.getElementById("menu_NewPopup");
			if (exclusive) {
				document.getElementById('tasksMenuAddressBook').setAttribute('hidden', 'true');
				// this menu has no id, so we have to do manually
				myPopup.lastChild.remove();
			} else {
				document.getElementById('tasksMenuAddressBook').removeAttribute('hidden');
			}

			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			var myMenuItem = document.createElement("menuitem");
			myMenuItem.setAttribute("id", "newCardBookCardFromMsgMenu");
			myMenuItem.addEventListener("command", function(aEvent) {
					ovl_cardbookComposeMsg.newInCardBook();
					aEvent.stopPropagation();
				}, false);
			myMenuItem.setAttribute("label", strBundle.GetStringFromName("newCardBookCardMenuLabel"));
			myMenuItem.setAttribute("accesskey", strBundle.GetStringFromName("newCardBookCardMenuAccesskey"));
			myPopup.appendChild(myMenuItem);
		},

		loadMsg: function () {
			myCardBookComposeMsgObserver.register();
			ovl_cardbookComposeMsg.setAB();
			cardbookAutocomplete.setMsgCompletion();
			cardbookAutocomplete.loadCssRules();
			window.removeEventListener('load', arguments.callee, true);
		}

	};
	
	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/preferences/cardbookPreferences.js");
	// css should be loaded at the end
	window.addEventListener("load", function(e) { ovl_cardbookComposeMsg.loadMsg(); }, false);
	
	// for stopping the observer
	// don't know how to close the msg observer…
	// window.addEventListener("close", function(e) { ovl_cardbookComposeMsg.unloadMsg(); }, false);

};


// LoadIdentity
(function() {
	// Keep a reference to the original function.
	var _original = LoadIdentity;

	// Override a function.
	LoadIdentity = function() {
		// Execute original function.
		var rv = _original.apply(null, arguments);

		// Execute some action afterwards.
		ovl_cardbookComposeMsg.LoadIdentity();

		// return the original result
		return rv;
	};

})();
