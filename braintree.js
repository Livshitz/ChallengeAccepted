var braintree = require("braintree");

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: "v5rnxrv8273vrgfb",
  publicKey: "p5wtc9knsmfctp9v",
  privateKey: "15a3d819c9a41419ab9f8dbf3b9d0ed9"
});