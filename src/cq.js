#!js api_version=1.0 name=cq

import { redis } from "@redis/gears-api";
import jp from 'jsonpath';
import { outChannel, log, pattern, maxEntries } from "./paras.js";

function stringfyData(data) {
  return JSON.stringify(data, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

function logData(data) {
  redis.log(stringfyData(data));
}

/**
 * Returns true if event key will  have value.
 * @param {string} event
 */
function eventKeyHasValue(event) {
  return !(event == "del" || event == "expired" || event == "evicted");
}

redis.registerKeySpaceTrigger(outChannel + "_cq", pattern, addToStream, {
  description: "add data  to outChannel",
});

/**
 * Add event data to outChannel stream
 * @param {import("@redis/gears-api").NativeClient} client
 * @param {Object} data
 * @returns
 */
function addToStream(client, data) {
  try {
    if (log) {
      logData(data);
    }

    //if event key is without value we cannot match on criteria we just notify the consumer
    if (!eventKeyHasValue(data.event)) {
      //trim the stream first
      client.call("XTRIM", outChannel, "MAXLEN", "~", maxEntries.toString());
      client.call("XADD", outChannel, "*", "event", data.event, "key", data.key);
      return;
    }

    //check type of key
    if (client.call("type", data.key) != "ReJSON-RL") {
      return;
    }

    //get the key value
    const value = client.call("JSON.GET", data.key);
    if (log) {
      logData("value: " + value);
    }
    const jsonValue = JSON.parse(value);

    //check if the key value matches the criteria
    if (jsonValue[0].name == "test") {
      //trim the stream first
      client.call("XTRIM", outChannel, "MAXLEN", "~", maxEntries.toString());
      client.call("XADD", outChannel, "*", "event", data.event, "key", data.key, "value", value);
    }
  } catch (e) {
    redis.log(e)
  }
}
