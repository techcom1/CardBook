if ("undefined" == typeof(wdw_cardbookConfigurationAddEmails)) {
	var wdw_cardbookConfigurationAddEmails = {
		
		loadInclExcl: function () {
			cardbookElementTools.loadInclExcl("typeMenupopup", "typeMenulist", window.arguments[0].includeCode);
		},
		
		loadMailAccounts: function () {
			cardbookElementTools.loadMailAccounts("mailAccountMenupopup", "mailAccountMenulist", window.arguments[0].emailAccountId, true);
		},
		
		loadAB: function () {
			var aIncludeSearch = true;
			if (window.arguments[0].context === "Collection") {
				aIncludeSearch = false;
			}
			cardbookElementTools.loadAddressBooks("CardBookABMenupopup", "CardBookABMenulist", window.arguments[0].addressBookId, true, false, true, aIncludeSearch);
		},
		
		loadCategories: function () {
			var ABList = document.getElementById('CardBookABMenulist');
			if (ABList.value != null && ABList.value !== undefined && ABList.value != "") {
				var ABDefaultValue = ABList.value;
			} else {
				var ABDefaultValue = 0;
			}
			cardbookElementTools.loadCategories("categoryMenupopup", "categoryMenulist", ABDefaultValue, window.arguments[0].categoryId, false, false, false, true);
		},
		
		load: function () {
			Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
			var strBundle = document.getElementById("cardbook-strings");
			document.title = strBundle.getString("wdw_cardbookConfigurationAddEmails" + window.arguments[0].context + "Title");
			wdw_cardbookConfigurationAddEmails.loadInclExcl();
			wdw_cardbookConfigurationAddEmails.loadMailAccounts();
			wdw_cardbookConfigurationAddEmails.loadAB();
			wdw_cardbookConfigurationAddEmails.loadCategories();
			if (window.arguments[0].context === "Collection") {
				document.getElementById('typeRow').hidden = true;
			}
		},

		save: function () {
			window.arguments[0].emailAccountId=document.getElementById('mailAccountMenulist').selectedItem.value;
			window.arguments[0].emailAccountName=document.getElementById('mailAccountMenulist').selectedItem.label;
			window.arguments[0].addressBookId=document.getElementById('CardBookABMenulist').selectedItem.value;
			window.arguments[0].addressBookName=document.getElementById('CardBookABMenulist').selectedItem.label;
			window.arguments[0].categoryId=document.getElementById('categoryMenulist').selectedItem.value;
			window.arguments[0].categoryName=document.getElementById('categoryMenulist').selectedItem.label;
			window.arguments[0].includeName=document.getElementById('typeMenulist').selectedItem.label;
			window.arguments[0].includeCode=document.getElementById('typeMenulist').selectedItem.value;
			window.arguments[0].typeAction="SAVE";
			close();
		},

		cancel: function () {
			window.arguments[0].typeAction="CANCEL";
			close();
		}

	};

};