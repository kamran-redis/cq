#!js api_version=1.0 name=cq
import { redis } from "@redis/gears-api";
import { outChannel, log, pattern } from "./paras.js";

function stringfyData(data) {
  return JSON.stringify(data, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

function logData(data) {
  redis.log("logEvent: " + stringfyData(data));
}

/**
 * Returns true if the event is without data.
 * @param {string} event
 */
function isEventWithoutData(event) {
  return event == "del" || event == "expired" || event == "evicted";
}

redis.registerKeySpaceTrigger(outChannel + "_cq", pattern, addToStream, {
  description: "add data  to outChannel",
});

/**
 * Add data to stream
 * @param {import("@redis/gears-api").NativeClient} client
 * @param {Object} data
 * @returns
 */
function addToStream(client, data) {
  if (log) {
    logData(data);
  }

  //if event is without data we cannot match on criteria we will just notify
  if (isEventWithoutData(data.event)) {
    //TODO: Righplace to trim stream here?
    client.call("XADD", outChannel, "*", "event", data.event, "key", data.key);
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
      outChannel,
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
 * @param {import("@redis/gears-api").NativeClient} client
 * @param {object} data
 * @returns
 */
function publishToChannel(client, data) {
  if (log) {
    logData( data);
  }

  //In case of del or expired event just publish the data as we cannot
  //read the value and match on criteria
  if (isEventWithoutData(data.event)) {
    client.call(
      "PUBLISH",
      outChannel,
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
    client.call("PUBLISH", outChannel, fv.join());
  }
}
