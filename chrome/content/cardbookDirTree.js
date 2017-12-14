if ("undefined" == typeof(cardbookDirTree)) {
	var cardbookDirTree = {
		
		childData : cardbookRepository.cardbookAccountsCategories,
		visibleData : cardbookRepository.cardbookAccounts,
		
		treeBox: null,
		selection: null,
		get rowCount() { return this.visibleData.length; },
		setTree: function(treeBox) { this.treeBox = treeBox; },
		getCellText: function(idx, column) {
			if (this.visibleData[idx] != null && this.visibleData[idx] !== undefined && this.visibleData[idx] != "") {
				if (column.id == "accountColor") return "";
				else if (column.id == "accountName") return this.visibleData[idx][0];
				else if (column.id == "accountId") return this.visibleData[idx][4];
				else if (column.id == "accountType") return this.visibleData[idx][6];
				else if (column.id == "accountEnabled") return this.visibleData[idx][5];
				else if (column.id == "accountStatusCheckbox") return true;
				else if (column.id == "accountTypeCheckbox") return true;
				else if (column.id == "dummyForScroll") return true;
			} else {
				return false;
			}
		},
		getCellValue: function(idx, column) {
			if (column.id == "accountEnabled") return this.visibleData[idx][5];
			else if (column.id == "accountStatusCheckbox") return true;
			else if (column.id == "accountTypeCheckbox") return true;
			else if (column.id == "dummyForScroll") return true;
		},
		setCellValue: function(idx, column) {
			if (column.id == "accountEnabled") {
				wdw_cardbook.enableOrDisableAddressbook(this.visibleData[idx][4], !this.visibleData[idx][5]);
			}
		},
		getRowProperties: function(idx) { return "" },
		getColumnProperties: function(column) { return column.id },
		getCellProperties: function(idx, column) {
			if (column.id == "accountColor" && this.visibleData[idx][1] && this.visibleData[idx][6] != "SEARCH") {
				return "color_" + this.visibleData[idx][4];
			} else if (column.id == "accountTypeCheckbox" && this.visibleData[idx][1]) {
				return cardbookRepository.getABIconType(this.visibleData[idx][6]);
			} else if (column.id == "accountStatusCheckbox" && this.visibleData[idx][1] && this.visibleData[idx][5] && this.visibleData[idx][6] != "SEARCH") {
				return cardbookRepository.getABStatusType(this.visibleData[idx][4]);
			}
		},
		canDrop: function(idx) { return (this.visibleData[idx][5] && !this.visibleData[idx][7] && this.visibleData[idx][6] != "SEARCH"); },
		isContainer: function(idx) { return this.visibleData[idx][1]; },
		isContainerOpen: function(idx) { return this.visibleData[idx][2]; },
		isContainerEmpty: function(idx) { return this.visibleData[idx][3]; },
		cycleHeader: function(idx) { return false },
		isSeparator: function(idx) { return false; },
		isSorted: function() { return false; },
		isEditable: function(idx, column) {
			if (column.id == "accountEnabled") return true;
			else return false;
		},
		getParentIndex: function(idx) {
			if (this.isContainer(idx)) return -1;
				for (var t = idx - 1; t >= 0 ; t--) {
					if (this.isContainer(t)) return t;
			}
		},
		getLevel: function(idx) {
			if (this.isContainer(idx)) return 0;
			return 1;
		},
		hasNextSibling: function(idx, after) {
			var thisLevel = this.getLevel(idx);
			for (var t = idx + 1; t < this.visibleData.length; t++) {
				var nextLevel = this.getLevel(t)
				if (nextLevel == thisLevel) return true;
				else if (nextLevel < thisLevel) return false;
			}
		},
		toggleOpenState: function(idx, column){
			var item = this.visibleData[idx];
			if (!item[1]) return;
			wdw_cardbook.expandOrContractAddressbook(item[4], !item[2]);
			if (item[2]) {
				item[2] = false;
				var thisLevel = this.getLevel(idx);
				var deletecount = 0;
				for (var t = idx + 1; t < this.visibleData.length; t++) {
					if (this.getLevel(t) > thisLevel) deletecount++;
					else break;
				}
				if (deletecount) {
					this.visibleData.splice(idx + 1, deletecount);
					this.treeBox.rowCountChanged(idx + 1, -deletecount);
				}
			} else {
				item[2] = true;
				var label = this.visibleData[idx][4];
				var enabled = this.visibleData[idx][5];
				var readonly = this.visibleData[idx][7];
				var toinsert = this.childData[label];
				for (var i = 0; i < toinsert.length; i++) {
					this.visibleData.splice(idx + i + 1, 0, [toinsert[i], false, false, false, label+"::"+toinsert[i], enabled, "CAT", readonly]);
				}
				this.treeBox.rowCountChanged(idx + 1, toinsert.length);
			}
		}
	};
};

if ("undefined" == typeof(cardbookDirTreeUtils)) {
	var cardbookDirTreeUtils = {
		
		newArray: [],
		
		filterTree: function() {
			var accountsShown = document.getElementById('accountsOrCatsTreeMenulist').selectedItem.value;
			var enabledColumn = document.getElementById('accountEnabled');
			var typeColumn = document.getElementById('accountTypeCheckbox');
			var accountColumn = document.getElementById('accountColor');
			cardbookDirTreeUtils.newArray = JSON.parse(JSON.stringify(cardbookRepository.cardbookAccounts));
			
			typeColumn.removeAttribute('hidden');
			enabledColumn.removeAttribute('hidden');
			accountColumn.removeAttribute('hidden');
			switch(accountsShown) {
				case "enabled":
					function enabledAccount(element) {
						return (element[5]);
					}
					cardbookDirTreeUtils.newArray = cardbookDirTreeUtils.newArray.filter(enabledAccount);
					enabledColumn.setAttribute('hidden', 'true');
					break;
				case "disabled":
					function disabledAccount(element) {
						return (!element[5]);
					}
					cardbookDirTreeUtils.newArray = cardbookDirTreeUtils.newArray.filter(disabledAccount);
					enabledColumn.setAttribute('hidden', 'true');
					break;
				case "local":
					function localAccount(element) {
						return (element[6] === "LOCALDB" || element[6] === "FILE" || element[6] === "DIRECTORY" || element[6] === "CACHE");
					}
					cardbookDirTreeUtils.newArray = cardbookDirTreeUtils.newArray.filter(localAccount);
					typeColumn.setAttribute('hidden', 'true');
					break;
				case "remote":
					function remoteAccount(element) {
						return (element[6] === "GOOGLE" || element[6] === "CARDDAV" || element[6] === "APPLE");
					}
					cardbookDirTreeUtils.newArray = cardbookDirTreeUtils.newArray.filter(remoteAccount);
					typeColumn.setAttribute('hidden', 'true');
					break;
				case "search":
					function searchAccount(element) {
						return (element[6] === "SEARCH");
					}
					cardbookDirTreeUtils.newArray = cardbookDirTreeUtils.newArray.filter(searchAccount);
					typeColumn.setAttribute('hidden', 'true');
					accountColumn.setAttribute('hidden', 'true');
					break;
			};
			return cardbookDirTreeUtils.newArray;
		}
	};
};
		
