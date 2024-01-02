import { createClient, commandOptions } from "redis";
import { outChannel, pattern } from "./paras.js";

const client = createClient();

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

let subClient = client.duplicate();
await subClient.connect();

subClient.subscribe(outChannel, (message) => {
  console.log(`Received message: ${message}`);
});


let streamClient = client.duplicate();
await streamClient.connect();
console.log("a");
(async () => {
  let response = await streamClient.xRead(
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
  if (response != null) {
    console.log(response);
  } else {
    console.log(response);
  }

})();

(async () => {
  await client.hSet(pattern + "1", { name: "test", value: 6 });
  //await client.hSet(pattern + "2", { name: "notest", value: 8 });
  return 1
})();

/*client.disconnect();
subClient.disconnect();
streamClient.disconnect();*/

