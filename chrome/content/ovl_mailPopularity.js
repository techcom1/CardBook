if ("undefined" == typeof(ovl_mailPopularity)) {
	try {
		ChromeUtils.import("chrome://cardbook/content/cardbookRepository.js");
	}
	catch(e) {
		Components.utils.import("chrome://cardbook/content/cardbookRepository.js");
	}

	cardbookMailPopularity.loadMailPopularity();
};
