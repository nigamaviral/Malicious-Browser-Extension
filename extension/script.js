var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("get", url, true);
    xhr.responseType = "json";
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        callback(null, xhr.response);
      } else {
        callback(status);
      }
    };
    xhr.send();
};

getJSON("http://quotes.rest/qod.json",
function(err, data) {
    var quote = data.contents.quotes[0].quote;
    var author = data.contents.quotes[0].author;
    var imageurl = data.contents.quotes[0].background;
    var body = document.getElementsByTagName('body')[0];

    body.style.backgroundImage = 'url(' + imageurl + ')';
    document.getElementById('quote').innerHTML = quote
    document.getElementById('author').innerHTML = "-" + author

});