module.exports = function (RED) {
  "use strict";
  const axios = require('axios');

  function AwsSignature(n) {
    RED.nodes.createNode(this, n);

    this.awssignature = RED.nodes.getNode(n.aws);
    
    if (!this.aws.credentials.accessToken) {
      this.status({ fill: "red", shape: "ring", text: "error.no-access-token" });
      return;
    }

    let node = this;

    node.on("input", async function (msg) {
      let searchKey = msg.search || n.search,
        useTag = msg.tag || n.tag,
        sort = msg.sort || n.sort,
        detailType = msg.detailType || n.detailType,
        state = msg.state || n.state || "unread";

      let params = {
        consumer_key: this.aws.credentials.consumerKey,
        access_token: this.aws.credentials.accessToken,
        sort,
        detailType,
        state
      }

      if (useTag) {
        params = { ...params, tag: searchKey }
      } else {
        params = { ...params, search: searchKey }
      }

      try {
        let data = await getList(params);

        msg.payload = data;
        node.send(msg);
        node.status({ fill: "green", shape: "ring", text: "success.get-list" });
      } catch (error) {
        node.error('Error:', error.response.data)
        node.status({ fill: "red", shape: "dot", text: "error.get-list" });
        return;
      }
    });
  }
  RED.nodes.registerType("aws-signature", AwsSignature);

  async function getList(params) {
    let { data } = await axios.get("https://getpocket.com/v3/get", { params: params });

    return data;
  }
};
