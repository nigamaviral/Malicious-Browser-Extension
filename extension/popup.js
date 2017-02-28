chrome.tabs.create({'url': chrome.extension.getURL('newtab.html')}, function(tab) {
  // Tab opened.
});