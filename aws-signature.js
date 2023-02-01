const mustache = require("mustache");
const https = require("https");
module.exports = function (RED) {
  "use strict";
  //var axios = require('axios');
  var https = require('https')
  var aws4 = require('aws4');
  var mustache = require("mustache");

  function AwsSignature(n) {
    RED.nodes.createNode(this, n);

    this.aws = RED.nodes.getNode(n.aws);

    if (!this.aws.credentials.accessKey || !this.aws.credentials.secretKey) {
      this.status({ fill: "red", shape: "ring", text: "error.empty-keys" });
      return;
    }

    let node = this;

    node.on("input", async function (msg) {
      let region = msg.region || n.region,
          service = msg.service || n.service,
          host = msg.host || n.host || "",
          path = msg.path || n.path || "",
          headers = msg.headers || n.headers || "",
          method = msg.method || n.method || "GET";

      //detect mustache then convert
      let isTemplatedHost = (host).indexOf("{{") !== -1;
      let isTemplatedPath = (path).indexOf("{{") !== -1;

      if (isTemplatedHost) {
        host = mustache.render(host, msg);
      }
      if (isTemplatedPath) {
        path = mustache.render(path, msg);
      }

      node.status({ fill: "blue", shape: "ring", text: "Sending" });

      let accessKeyId = this.aws.credentials.accessKey;
      let secretAccessKey = this.aws.credentials.secretKey;
      let sessionToken = this.aws.credentials.sessionToken;
      if (sessionToken == null) {
        sessionToken = "";
      }

      if ((accessKeyId).indexOf("{{") !== -1) {
        accessKeyId = mustache.render(accessKeyId, msg);
      }
      if ((secretAccessKey).indexOf("{{") !== -1) {
        secretAccessKey = mustache.render(secretAccessKey, msg);
      }
      if ((sessionToken).indexOf("{{") !== -1) {
        sessionToken = mustache.render(sessionToken, msg);
      }

      let keys = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      }

      if (sessionToken != null && sessionToken != ''){
        keys.sessionToken = sessionToken;
      }

      let opts = {
        host: host.replace(/^https?:\/\//g, ''),// remove http|https
        path,
        service,
        region,
        method
      };

      if (method == 'POST' || method == 'PUT' ){
        opts.body = JSON.stringify(msg.payload);
      }

      // aws4.sign() will sign and modify these options, ready to pass to axios request
      let config = aws4.sign(opts, keys);
      //config.url = url;
      if (headers) {
        config.headers = Object.assign({}, config.headers, headers);
      }

      const request = https.request(config, function(res) {

        let data = '';
        res.on('data', (chunk) => {
          data = data + chunk.toString();
        });

        res.on('end', () => {

          try {
            res.st
            if (data) {
              msg.payload = JSON.parse(data);
            }
            node.send(msg);
            node.status({ fill: "green", shape: "ring", text: "Success" });
          } catch(e) {
            node.send(msg);
            node.status({ fill: "red", shape: "dot", text: "request.error" });
          }
        });
      }).end(opts.body || '');

      request.on('error', (error) => {
        console.log('An error', error);
      });



    });
  }
  RED.nodes.registerType("aws-signature", AwsSignature);
};


