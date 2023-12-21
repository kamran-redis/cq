#!js api_version=1.0 name=cqv2
/*global redis */

let pattern = "feed:";
let out_channel = "feed_out";
let log = true;

//------------  Helper functions ------------------
function stringfyData(data) {
  return JSON.stringify(data, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

// eslint-disable-next-line no-unused-vars
function logData(client, data) {
  redis.log("logEvent: " + stringfyData(data));
}

//------------------------------------------------

redis.registerFunction("createCQ", () => {
  //Do bookkeeping use redis 
  //scan or query to get Initial resulsts
  redis.registerKeySpaceTrigger(out_channel + "_cq", pattern, addToStream, {
    description: "add data  to out_channel",
  });
  return "noop";
});

/**
 * Add data to stream
 * @param {*} client
 * @param {*} data
 * @returns
 */
function addToStream(client, data) {
  if (log) {
    logData(client, data);
  }

  //In case of del/eviction/expire event just add the data for the pattern
  if (
    data.event == "del" ||
    data.event == "expired" ||
    data.event == "evicted"
  ) {
    //TODO: Righplace to trim stream here?
    client.call("XADD", out_channel, "*", "event", data.event, "key", data.key);
    return;
  }

  if (client.call("type", data.key) != "hash") {
    return;
  }

  let hashFV = client.call("HGETALL", data.key);

  if (hashFV["name"] == "test") {
    let fv = Object.entries(hashFV).flat(2);
    //TODO: Righplace to trim stream here?
    client.call(
      "XADD",
      out_channel,
      "*",
      "event",
      data.event,
      "key",
      data.key,
      ...fv
    );
  }
}

/**
 * Publish to a channel
 * @param {*} client
 * @param {*} data
 * @returns
 */
function publishToChannel(client, data) {
  if (log) {
    logData(client, data);
  }

  //In case of del or expired event just publish the data as we cannot
  //read the value and match on criteria
  if (
    data.event == "del" ||
    data.event == "expired" ||
    data.event == "evicted"
  ) {
    client.call(
      "PUBLISH",
      out_channel,
      ["event", data.event, "key", data.key].join()
    );
    return;
  }

  if (client.call("TYPE", data.key) != "hash") {
    return;
  }

  let hashFV = client.call("HGETALL", data.key);

  if (hashFV["name"] == "test") {
    let fv = Object.entries(hashFV).flat(2);
    //ToDo do efficiently
    fv = ["event", data.event, "key", data.key].concat(fv);
    client.call("PUBLISH", out_channel, fv.join());
  }
}
