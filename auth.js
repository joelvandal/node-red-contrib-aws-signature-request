module.exports = function (RED) {
  function AwsSignatureAuthNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.on("input", function (msg) {
      if (!node.credentials || !node.credentials.accessToken || !node.credentials.secretToken) {
        node.status({ fill: "red", shape: "dot", text: "error.no-key" });
        return;
      }
    });
  }

  RED.nodes.registerType("aws-signature-auth", AwsSignatureAuthNode, {
    credentials: {
      displayName: { type: "text" },
      accessKey: { type: "text", required: true },
      secretKey: { type: "password", required: true },
      sessionToken: { type: "text", required: false },
    },
  });
};
