if ("undefined" == typeof(wdw_imageEdition)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
		ChromeUtils.import("resource://gre/modules/NetUtil.jsm");
		ChromeUtils.import("resource://gre/modules/FileUtils.jsm");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
		Components.utils.import("resource://gre/modules/NetUtil.jsm");
		Components.utils.import("resource://gre/modules/FileUtils.jsm");
	}
	
	var wdw_imageEdition = {

		writeImageToFile: function (aFile, aDataValue, aExtension) {
			// remove an existing image (overwrite)
			if (aFile.exists()) {
				aFile.remove(true);
			}
			var ostream = FileUtils.openSafeFileOutputStream(aFile)
			NetUtil.asyncCopy(aDataValue, ostream, function (status) {
				if (Components.isSuccessCode(status)) {
					wdw_imageEdition.addImageCard(aFile, wdw_cardEdition.workingCard, aExtension);
				} else {
					wdw_cardbooklog.updateStatusProgressInformation("cardbookSynchronization.writeImageToFile error : filename : " + aFile.path, "Error");
				}
			});
		},

		getEditionPhotoTempFile: function (aExtension) {
			var myFile = Services.dirsvc.get("TmpD", Components.interfaces.nsIFile);
			myFile.append("cardbook");
			if (!myFile.exists() || !myFile.isDirectory()) {
				// read and write permissions to owner and group, read-only for others.
				myFile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o774);
			}
			myFile.append(cardbookUtils.getUUID() + "." + aExtension);
			return myFile;
		},

		clipboardGetSupportedFlavors: function() {
			var flavors = [];
			flavors.push("image/jpeg");
			flavors.push("image/jpg");
			flavors.push("image/png");
			flavors.push("image/gif");
			flavors.push("application/x-moz-file");
			flavors.push("text/unicode");
			flavors.push("text/plain");
			return flavors;
		},

		clipboardCanPaste: function() {
            var clipboard = Services.clipboard;
            var flavors = wdw_imageEdition.clipboardGetSupportedFlavors();
            return clipboard.hasDataMatchingFlavors(flavors, flavors.length, clipboard.kGlobalClipboard);
		},

		clipboardGetData: function() {
			var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
			var flavors = wdw_imageEdition.clipboardGetSupportedFlavors();
			for (i = 0; i < flavors.length; i++) {
				trans.addDataFlavor(flavors[i]);
			}
			Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);

			var flavor = {};
			var data = {};
			var len = {};
			trans.getAnyTransferData(flavor, data, len);
			return { flavor: flavor.value, data: data.value, length: len.value }; 
		},

		clearImageCard: function () {
			document.getElementById('defaultCardImage').src = "";
			document.getElementById('imageForSizing').src = "";
			document.getElementById('imageBox').setAttribute('hidden', 'true');
		},

		displayImageCard: function (aCard, aDisplayDefault) {
			if (aCard.photo.localURI != null && aCard.photo.localURI !== undefined && aCard.photo.localURI != "") {
				document.getElementById('imageBox').removeAttribute('hidden');
				wdw_imageEdition.resizeImageCard(aCard.photo.localURI);
			} else {
				if (aDisplayDefault) {
					document.getElementById('imageBox').removeAttribute('hidden');
					wdw_imageEdition.resizeImageCard("chrome://cardbook/skin/missing_photo_200_214.png");
				} else {
					document.getElementById('imageBox').setAttribute('hidden', 'true');
				}
			}
		},

		resizeImageCard: function (aFileURI) {
			var myImage = document.getElementById('defaultCardImage');
			var myDummyImage = document.getElementById('imageForSizing');
			
			myImage.src = "";
			myDummyImage.src = "";
			myDummyImage.src = aFileURI;
			myDummyImage.onload = function() {
				var myImageWidth = 170;
				var myImageHeight = 170;
				if (myDummyImage.width >= myDummyImage.height) {
					widthFound = myImageWidth + "px" ;
					heightFound = Math.round(myDummyImage.height * myImageWidth / myDummyImage.width) + "px" ;
				} else {
					widthFound = Math.round(myDummyImage.width * myImageHeight / myDummyImage.height) + "px" ;
					heightFound = myImageHeight + "px" ;
				}
				myImage.width = widthFound;
				myImage.height = heightFound;
				myImage.src = aFileURI;
			}
			myDummyImage.onerror = function() {
				if (document.getElementById('photolocalURITextBox')) {
					document.getElementById('photolocalURITextBox').value = "";
				}
				if (document.getElementById('photoURITextBox')) {
					document.getElementById('photoURITextBox').value = "";
				}
				if (document.getElementById('photoExtensionTextBox')) {
					document.getElementById('photoExtensionTextBox').value = "";
				}
				cardbookUtils.adjustFields();
				wdw_imageEdition.resizeImageCard("chrome://cardbook/skin/missing_photo_200_214.png");
			}
		},

		addImageCardFromFile: function () {
			cardbookUtils.callFilePicker("imageSelectionTitle", "OPEN", "IMAGES", "", wdw_imageEdition.addImageCardFromFileNext);
		},

		addImageCardFromFileNext: function (aFile) {
			var myExtension = cardbookUtils.getFileNameExtension(aFile.leafName);
			if (myExtension != "") {
				var myCard = wdw_cardEdition.workingCard;
				myExtension = cardbookUtils.formatExtension(myExtension, myCard.version);
				var targetFile = wdw_imageEdition.getEditionPhotoTempFile(myExtension);
				var myFileURISpec = "file:///" + targetFile.path;
				var myFileURI = Services.io.newURI(myFileURISpec, null, null);
				var myFile1 = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
				aFile.copyToFollowingLinks(myFile1.parent, myFile1.leafName);
				cardbookUtils.formatStringForOutput("imageSavedToFile", [myFile1.path]);
				wdw_imageEdition.addImageCard(myFile1, myCard, myExtension);
			}
		},

		addImageCardFromUrl: function (aUrl) {
			var myExtension = cardbookUtils.getFileExtension(aUrl);
			if (myExtension != "") {
				var myCard = wdw_cardEdition.workingCard;
				myExtension = cardbookUtils.formatExtension(myExtension, myCard.version);
				var targetFile = wdw_imageEdition.getEditionPhotoTempFile(myExtension);
				try {
					var listener_getimage = {
						onDAVQueryComplete: function(status, response, askCertificate, etag) {
							if (status > 199 && status < 400) {
								cardbookUtils.formatStringForOutput("urlDownloaded", [aUrl]);
								cardbookSynchronization.writeContentToFile(targetFile.path, response, "NOUTF8");
								wdw_imageEdition.addImageCard(targetFile, myCard, myExtension);
							} else {
								cardbookUtils.formatStringForOutput("imageErrorWithMessage", [status]);
							}
						}
					};
					var aDescription = cardbookUtils.getPrefNameFromPrefId(myCard.dirPrefId);
					var aImageConnection = {connPrefId: myCard.dirPrefId, connUrl: aUrl, connDescription: aDescription};
					var request = new cardbookWebDAV(aImageConnection, listener_getimage);
					cardbookUtils.formatStringForOutput("serverCardGettingImage", [aImageConnection.connDescription, myCard.fn]);
					request.getimage();
				}
				catch(e) {
					cardbookUtils.formatStringForOutput("imageErrorWithMessage", [e]);
				}
			}
		},

		checkDragImageCard: function (aEvent) {
			aEvent.preventDefault();
		},

		dragImageCard: function (aEvent) {
			aEvent.preventDefault();
			var myFile = aEvent.dataTransfer.mozGetDataAt("application/x-moz-file", 0);
			if (myFile instanceof Components.interfaces.nsIFile) {
				wdw_imageEdition.addImageCardFromFileNext(myFile);
			} else {
				var link = aEvent.dataTransfer.getData("URL");
				if (link) {
					wdw_imageEdition.addImageCardFromUrl(link);
				} else {
					link = aEvent.dataTransfer.getData("text/plain");
					if (link.startsWith("https://") || link.startsWith("http://") ) {
						wdw_imageEdition.addImageCardFromUrl(link);
					}
				}
			}
		},

		pasteImageCard: function () {
			try {
                if (wdw_imageEdition.clipboardCanPaste()) {
                    var data = wdw_imageEdition.clipboardGetData();

                    if (data.flavor.startsWith("image/")) {
                        var myExtension = data.flavor == "image/png" ? "png" : (data.flavor == "image/gif" ? "gif" : "jpg");
                        var targetFile = wdw_imageEdition.getEditionPhotoTempFile(myExtension);
						wdw_imageEdition.writeImageToFile(targetFile, data.data, myExtension);
                    } else if (data.flavor == "application/x-moz-file") {
						var myFile = data.data.QueryInterface(Components.interfaces.nsIFile);
						wdw_imageEdition.addImageCardFromFileNext(myFile);
                    } else if (data.flavor === "text/unicode" || data.flavor === "text/plain") {
                        var myText = data.data.QueryInterface(Components.interfaces.nsISupportsString).data;
						if (myText.startsWith("https://") || myText.startsWith("http://")) {
							wdw_imageEdition.addImageCardFromUrl(myText);
						} else if (myText.startsWith("file:///")) {
							var myFileURISpec = myText;
							var myFileURI = Services.io.newURI(myFileURISpec, null, null);
							var myFile = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
							wdw_imageEdition.addImageCardFromFileNext(myFile);
						} else if (myText.startsWith("/")) {
							var myFileURISpec = "file://" + myText;
							var myFileURI = Services.io.newURI(myFileURISpec, null, null);
							var myFile = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
							wdw_imageEdition.addImageCardFromFileNext(myFile);
						}
                    }
                }
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_imageEdition.pasteImageCard error : " + e, "Error");
			}
		},

		addImageCard: function (aFile, aCard, aExtension) {
			if (aFile != null && aFile !== undefined && aFile != "") {
				if (aCard.version === "4.0") {
					aExtension = aExtension.toLowerCase();
				} else {
					aExtension = aExtension.toUpperCase();
				}
				document.getElementById('photoURITextBox').value = "";
				document.getElementById('photolocalURITextBox').value = "file:///" + aFile.path;
				document.getElementById('photoExtensionTextBox').value = aExtension;
				wdw_cardEdition.workingCard.photo.URI = "";
				wdw_cardEdition.workingCard.photo.localURI = "file:///" + aFile.path;
				wdw_cardEdition.workingCard.photo.extension = aExtension;
				wdw_imageEdition.displayImageCard(wdw_cardEdition.workingCard, true);
			}
		},

		saveImageCard: function () {
			var myFileURISpec = document.getElementById('photolocalURITextBox').value;
			var myFileURI = Services.io.newURI(myFileURISpec, null, null);
			var myFile = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
			cardbookUtils.callFilePicker("imageSaveTitle", "SAVE", "IMAGES", myFile.leafName, wdw_imageEdition.saveImageCardNext);
		},

		saveImageCardNext: function (aFile) {
			var myFileURISpec = document.getElementById('photolocalURITextBox').value;
			var myFileURI = Services.io.newURI(myFileURISpec, null, null);
			var myFile1 = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
			myFile1.copyToFollowingLinks(aFile.parent,aFile.leafName);
			cardbookUtils.formatStringForOutput("imageSavedToFile", [aFile.path]);
		},

		copyImageCard: function () {
			try {
				var imgTools = Components.classes["@mozilla.org/image/tools;1"].getService(Components.interfaces.imgITools);
				var myFileURISpec = document.getElementById('photolocalURITextBox').value;
				var myFileURI = Services.io.newURI(myFileURISpec, null, null);

				// Thunderbird 52 and Linux
				if (imgTools.decodeImageData) {
					var myExtension = cardbookUtils.getFileNameExtension(myFileURISpec);
					var imagedata = 'data:image/' + myExtension + ';base64,' + btoa(cardbookSynchronization.getFileBinary(myFileURI));
					var channel = Services.io.newChannel2(imagedata, null, null, null, null, null, null, null);
					var input = channel.open();
					var container = {};
					imgTools.decodeImageData(input, channel.contentType, container);
					var wrapped = Components.classes["@mozilla.org/supports-interface-pointer;1"].createInstance(Components.interfaces.nsISupportsInterfacePointer);
					wrapped.data = container.value;
					var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
					trans.addDataFlavor(channel.contentType);
					trans.setTransferData(channel.contentType, wrapped, 0);
					var clipid = Components.interfaces.nsIClipboard;
					var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
					clipboard.setData(trans, null, clipid.kGlobalClipboard);
				// Thunderbird 60
				} else if (imgTools.decodeImageFromBuffer) {
					var myChannel = Services.io.newChannelFromURI2(myFileURI,
																	 null,
																	 Services.scriptSecurityManager.getSystemPrincipal(),
																	 null,
																	 Components.interfaces.nsILoadInfo.SEC_REQUIRE_SAME_ORIGIN_DATA_INHERITS,
																	 Components.interfaces.nsIContentPolicy.TYPE_OTHER);
					NetUtil.asyncFetch(myChannel, function (inputStream, status) {
						if (!Components.isSuccessCode(status)) {
							return;
						}
						var buffer = NetUtil.readInputStreamToString(inputStream, inputStream.available());
						var container = imgTools.decodeImageFromBuffer(buffer, buffer.length, myChannel.contentType);
						var wrapped = Components.classes["@mozilla.org/supports-interface-pointer;1"].createInstance(Components.interfaces.nsISupportsInterfacePointer);
						wrapped.data = container;
						var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
						trans.addDataFlavor(myChannel.contentType);
						trans.setTransferData(myChannel.contentType, wrapped, 0);
						var clipid = Components.interfaces.nsIClipboard;
						var clipboard = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid);
						clipboard.setData(trans, null, clipid.kGlobalClipboard);
					});
				}
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_imageEdition.copyImageCard error : " + e, "Error");
			}
		},

		copyImageLocationCard: function () {
			try {
				var myFileURISpec = document.getElementById('photolocalURITextBox').value;
				var myExtension = cardbookUtils.getFileNameExtension(myFileURISpec);
				var myFileURI = Services.io.newURI(myFileURISpec, null, null);
				var myFile = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
				
				cardbookUtils.clipboardSet(myFile.path);
			}
			catch (e) {
				wdw_cardbooklog.updateStatusProgressInformation("wdw_imageEdition.copyImageLocationCard error : " + e, "Error");
			}
		},

		deleteImageCard: function () {
			var myCard = cardbookRepository.cardbookCards[document.getElementById('dirPrefIdTextBox').value+"::"+document.getElementById('uidTextBox').value];
			document.getElementById('defaultCardImage').src = "chrome://cardbook/skin/missing_photo_200_214.png";
			document.getElementById('photolocalURITextBox').value = "";
			document.getElementById('photoURITextBox').value = "";
			wdw_cardEdition.workingCard.photo.URI = "";
			wdw_cardEdition.workingCard.photo.localURI = "";
			wdw_cardEdition.workingCard.photo.extension = "";
			wdw_imageEdition.displayImageCard(wdw_cardEdition.workingCard, true);
		},

		imageCardContextShowing: function () {
			if (document.getElementById('defaultCardImage').src == "chrome://cardbook/skin/missing_photo_200_214.png") {
				document.getElementById('saveImageCard').disabled=true;
				document.getElementById('copyImageCard').disabled=true;
				document.getElementById('deleteImageCard').disabled=true;
			} else {
				document.getElementById('saveImageCard').disabled=false;
				document.getElementById('copyImageCard').disabled=false;
				document.getElementById('deleteImageCard').disabled=false;
			}
		}

	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/cardbookWebDAV.js");
};
