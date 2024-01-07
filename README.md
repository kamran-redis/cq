IMDG's provide continious query(CQ) <sup>[1](https://geode.apache.org/docs/guide/115/developing/continuous_querying/chapter_overview.html) [2](https://docs.oracle.com/middleware/1212/coherence/COHDG/api_continuousquery.htm#COHDG126) [3](https://docs.hazelcast.com/hazelcast/5.3/data-structures/listening-for-map-entries)</sup>. 


This  is an attempt to experiment and explore CQ using [redis triggers and functions](https://github.com/RedisGears/RedisGears) 

Basic flow:
1. Register a keysapce trigger function that either wirtes to stream or publishes to a channel
2. Application can use standard redis stream or pub/sub functionality to get change events


## Quick Start

Start redis stack `docker run -it  --name redis-stack -p 6379:6379 -p 8001:8001    --rm redis/redis-stack:latest`

To install the listner `npm run deploy -- -r redis://localhost:6379`

To test `npm run test`

The trigger function will add an entry to a stream that the application can use to get notification on data
`xrange feed_out - +`


## To DO:
* ~~Refine DX with hash and then use JSON~~
* use Search to load initail state of world
* Stable view
* ~~Clean up after client disconnects OOM!~~ Added maxEtries parameter to trim the stream
* SQL like where clause over Dictionary and  JSON (Find library JSONPath?)

