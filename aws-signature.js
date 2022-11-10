module.exports = function (RED) {
  "use strict";
  var axios = require('axios');
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

      let url = host + path;
      let keys = {
        accessKeyId: this.aws.credentials.accessKey,
        secretAccessKey: this.aws.credentials.secretKey,
      }
      let opts = {
        host: host.replace(/^https?:\/\//g, ''),// remove http|https
        path,
        service,
        region,
        method
      }
      // aws4.sign() will sign and modify these options, ready to pass to axios request
      let config = aws4.sign(opts, keys);
      config.url = url;
      if (headers) {
          config.headers = Object.assign({}, config.headers, headers);
      }
      axios(config)
        .then(function (response) {
          msg.payload = response.data;
          node.send(msg);
          node.status({ fill: "green", shape: "ring", text: "Success" });
        })
        .catch(function (error) {
          node.error(error.response.data);
          node.status({ fill: "red", shape: "dot", text: "request.error" });
        });
    });
  }
  RED.nodes.registerType("aws-signature", AwsSignature);
};
