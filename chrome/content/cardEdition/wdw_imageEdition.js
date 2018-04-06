if ("undefined" == typeof(wdw_imageEdition)) {
	try {
		ChromeUtils.import("resource://gre/modules/Services.jsm");
	}
	catch(e) {
		Components.utils.import("resource://gre/modules/Services.jsm");
	}

	var wdw_imageEdition = {

		writeImageToFile: function (aFile, aDataValue) {
			// remove an existing image (overwrite)
			if (aFile.exists()) {
				aFile.remove(true);
			}
			aFile.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 420 );
			var outStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
			outStream.init(aFile, 0x04 | 0x08 | 0x20, -1, 0); // readwrite, create, truncate
			var inputStream = aDataValue.QueryInterface(Components.interfaces.nsIInputStream)
			var binInputStream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
			binInputStream.setInputStream(inputStream);
			try {
				while(true) {
					var len = Math.min(512,binInputStream.available());
					if (len == 0) break;
					var data = binInputStream.readBytes(len);
					if (!data || !data.length) break; outStream.write(data, data.length);
				}
			}
			catch(e) { return false; }
			try {
				inputStream.close();
				binInputStream.close();
				outStream.close();
			}
			catch(e) { return false; }
			return true;
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

		clipboardGetImage: function(aFile) {
			var extension = "png";
			var clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
			var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
			trans.addDataFlavor("image/" + extension);
			clip.getData(trans,clip.kGlobalClipboard);
			var data = {};
			var dataLength = {};
			trans.getTransferData("image/" + extension,data,dataLength);
			if (data && data.value) {
				return wdw_imageEdition.writeImageToFile(aFile, data.value);
			} else {
				return false;
			}
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
			if (document.getElementById('photolocalURITextBox').value == "") {
				cardbookUtils.callFilePicker("imageSelectionTitle", "OPEN", "IMAGES", "", wdw_imageEdition.addImageCardFromFileNext);
			}
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

		addImageCardFromUrl: function () {
			if (document.getElementById('photolocalURITextBox').value == "") {
				var myUrl = cardbookUtils.clipboardGet();
				var myExtension = cardbookUtils.getFileExtension(myUrl);
				if (myExtension != "") {
					var myCard = wdw_cardEdition.workingCard;
					myExtension = cardbookUtils.formatExtension(myExtension, myCard.version);
					var targetFile = wdw_imageEdition.getEditionPhotoTempFile(myExtension);
					try {
						var listener_getimage = {
							onDAVQueryComplete: function(status, response, askCertificate, etag) {
								if (status > 199 && status < 400) {
									cardbookUtils.formatStringForOutput("urlDownloaded", [myUrl]);
									cardbookSynchronization.writeContentToFile(targetFile.path, response, "NOUTF8");
									wdw_imageEdition.addImageCard(targetFile, myCard, myExtension);
								} else {
									cardbookUtils.formatStringForOutput("imageErrorWithMessage", [e]);
								}
							}
						};
						var aDescription = cardbookUtils.getPrefNameFromPrefId(myCard.dirPrefId);
						var aImageConnection = {connPrefId: myCard.dirPrefId, connUrl: myUrl, connDescription: aDescription};
						var request = new cardbookWebDAV(aImageConnection, listener_getimage);
						cardbookUtils.formatStringForOutput("serverCardGettingImage", [aImageConnection.connDescription, myCard.fn]);
						request.getimage();
					}
					catch(e) {
						cardbookUtils.formatStringForOutput("imageErrorWithMessage", [e]);
					}
				}
			}
		},

		addImageCardFromClipboard: function () {
			if (document.getElementById('photolocalURITextBox').value == "") {
				var myExtension = "png";
				var myCard = wdw_cardEdition.workingCard;
				var targetFile = wdw_imageEdition.getEditionPhotoTempFile(myExtension);
				var myResult = wdw_imageEdition.clipboardGetImage(targetFile);
				if (myResult) {
					wdw_imageEdition.addImageCard(targetFile, myCard, myExtension);
				} else {
					cardbookUtils.formatStringForOutput("imageError");
				}
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
			if (document.getElementById('photolocalURITextBox').value !== "") {
				cardbookUtils.callFilePicker("imageSaveTitle", "SAVE", "IMAGES", "", wdw_imageEdition.saveImageCardNext);
			}
		},

		saveImageCardNext: function (aFile) {
			var myFileURISpec = document.getElementById('photolocalURITextBox').value;
			var myFileURI = Services.io.newURI(myFileURISpec, null, null);
			var myFile1 = myFileURI.QueryInterface(Components.interfaces.nsIFileURL).file;
			myFile1.copyToFollowingLinks(aFile.parent,aFile.leafName);
			cardbookUtils.formatStringForOutput("imageSavedToFile", [aFile.path]);
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
				document.getElementById('addImageCardFromFile').disabled=false;
				document.getElementById('addImageCardFromClipboard').disabled=false;
				document.getElementById('addImageCardFromUrl').disabled=false;
				document.getElementById('saveImageCard').disabled=true;
				document.getElementById('deleteImageCard').disabled=true;
			} else {
				document.getElementById('addImageCardFromFile').disabled=true;
				document.getElementById('addImageCardFromClipboard').disabled=true;
				document.getElementById('addImageCardFromUrl').disabled=true;
				document.getElementById('saveImageCard').disabled=false;
				document.getElementById('deleteImageCard').disabled=false;
			}
		}

	};

	var loader = Services.scriptloader;
	loader.loadSubScript("chrome://cardbook/content/cardbookWebDAV.js");
};
