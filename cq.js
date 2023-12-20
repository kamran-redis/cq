#!js api_version=1.0 name=cq
/*global redis */

function stringfyEvent(event) {
    return JSON.stringify(event, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    );
  }
  
  // eslint-disable-next-line no-unused-vars
  function logEvent(client, event) {
    redis.log("logEvent: " + stringfyEvent(event));
  }

 
  redis.registerKeySpaceTrigger("publish", "feed:", publish, {
    description: "publish",
  });

  function publish(client, event) {
    if (client.call("type", event.key) != "hash") {
        return;
    }
    
    // eslint-disable-next-line no-undef
    let m = client.call("HGETALL", event.key)
    if (m["name"] == "test") {
        let am = Object.entries(m).flat(2)
        client.call("XADD", "cq", "*" ,...am)
    }
    
  }

 

