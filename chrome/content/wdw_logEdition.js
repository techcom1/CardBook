if ("undefined" == typeof(wdw_logEdition)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	var wdw_logEdition = {
		
		load: function () {
			var myLogArray = cardbookRepository.statusInformation;
			var myTree = document.getElementById('logEditionTree');
			var myTreeView = {
				rowCount : myLogArray.length,
				isContainer: function(row) { return false },
				cycleHeader: function(row) { return false },
				getRowProperties: function(row) { return myLogArray[row][1] },
				getCellText : function(row,column){
					if (column.id == "logEditionValue") return myLogArray[row][0];
					else if (column.id == "logEditionType") return myLogArray[row][1];
				}
			}
			var currentFirstVisibleRow = myTree.boxObject.getFirstVisibleRow();
			myTree.view = myTreeView;
			myTree.boxObject.scrollToRow(currentFirstVisibleRow);
		},

		selectAllKey: function () {
			var myTree = document.getElementById('logEditionTree');
			myTree.view.selection.selectAll();
		},

		clipboard: function () {
			try {
				var myTree = document.getElementById('logEditionTree');
				var myLogArray = [];
				var numRanges = myTree.view.selection.getRangeCount();
				if (numRanges > 0) {
					for (var i = 0; i < numRanges; i++) {
						var start = new Object();
						var end = new Object();
						myTree.view.selection.getRangeAt(i,start,end);
						for (var j = start.value; j <= end.value; j++){
							myLogArray.push(myTree.view.getCellText(j, {id: "logEditionValue"}));
						}
					}
				} else {
					for (var i = 0; i < myTree.view.rowCount; i++) {
						myLogArray.push(myTree.view.getCellText(i, {id: "logEditionValue"}));
					}
				}
				cardbookClipboard.clipboardSetText('text/unicode', myLogArray.join("\n"));
			}
			catch (e) {
				var errorTitle = "clipboard error";
				Services.prompt.alert(null, errorTitle, e);
			}
		},

		flush: function () {
			cardbookRepository.statusInformation = [];
			wdw_logEdition.load();
		},

		cancel: function () {
			close();
		}

	};

};
