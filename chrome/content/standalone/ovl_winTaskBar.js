if ("undefined" == typeof(ovl_winTaskBar)) {
	Components.utils.import("resource://gre/modules/Services.jsm");
	Components.utils.import("resource:///modules/windowsJumpLists.js");

	var ovl_winTaskBar = {

		CardBookTask : 
			// Open CardBook
			{
				get title()       { return ovl_winTaskBar.getString("cardbookTitle"); },
				get description() { return ovl_winTaskBar.getString("cardbookTitle"); },
				args:             "-cardbook",
				iconIndex:        3,
				open:             true,
				close:            true,
			},

			
		getString: function(aString) {
			var strBundle = Services.strings.createBundle("chrome://cardbook/locale/cardbook.properties");
			return strBundle.GetStringFromName(aString);
		},

		add: function() {
			if (WinTaskbarJumpList && WinTaskbarJumpList._tasks) {
				Services.tm.currentThread.dispatch({ run: function() {
					var found = false;
					for (var myObj in WinTaskbarJumpList._tasks) {
						if (WinTaskbarJumpList._tasks[myObj].args == "-cardbook") {
							found = true;
							break;
						}
					}
					if (!found) {
						WinTaskbarJumpList._tasks.push(ovl_winTaskBar.CardBookTask);
						WinTaskbarJumpList.update();
					}
				}}, Components.interfaces.nsIEventTarget.DISPATCH_NORMAL);
			}
		}
	};
};
