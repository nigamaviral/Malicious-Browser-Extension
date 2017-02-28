/*Function to insert Script/DOM obejct passed*/
function insertScript(type, data) {
  var newdiv = document.createElement("div");
	var body = document.getElementsByTagName("body");
	var nav = document.getElementById("myNav");
	if(type == "dom") {
    if (nav == null) {
      newdiv.innerHTML = data;
      body[0].appendChild(newdiv);
    }
	} else if(type == "js") {
		eval(data);
	}
}

/*Listener for communication with extension messages*/
chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {
	insertScript(msg.type, msg.data);
});