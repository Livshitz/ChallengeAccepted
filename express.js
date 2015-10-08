 var express = require("express");
 var app = express();

 /* braintree start */
 var braintree = require("braintree");
 var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "v5rnxrv8273vrgfb",
  publicKey: "p5wtc9knsmfctp9v",
  privateKey: "15a3d819c9a41419ab9f8dbf3b9d0ed9"
});
 /* braintree end */

 /* serves main page */
 app.get("/", function(req, res) {
    res.sendfile('index.html')
 });

 /* serves all the static files */
 app.get(/^(.+)$/, function(req, res){ 
     //console.log('static file request : ' + req.params);
     res.sendfile( __dirname + req.params[0]); 
 });

 var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });