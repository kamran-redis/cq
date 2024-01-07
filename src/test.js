import { createClient, commandOptions } from "redis";
import { outChannel, pattern } from "./paras.js";

const client = createClient();

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

/* let subClient = client.duplicate();
await subClient.connect();

subClient.subscribe(outChannel, (message) => {
  console.log(`Received message: ${message}`);
}); */

const streamClient = client.duplicate();
await streamClient.connect();
(async () => {
  const response = await streamClient.xRead(
    commandOptions({
      isolated: false,
    }),
    [
      {
        key: outChannel,
        id: "$",
      },
    ],
    {
      COUNT: 1,
      BLOCK: 1000,
    }
  );
  console.log(response);
  if (response != null) {
    console.log("stream: " + response[0].name);
    console.log(response[0].messages[0]);
  } else {
    console.log("no data");
  }
})();

await new Promise((r) => setTimeout(r, 10));
(async () => {
  await client.json.set(pattern + "2", "$", {
    name: "test2",
    value: { answer: 42 },
  });
  await client.json.set(pattern + "1", "$", {
    name: "test",
    value: { answer: 42 },
  });
})();

await new Promise((r) => setTimeout(r, 1000));
client.disconnect();
//subClient.disconnect();
streamClient.disconnect();