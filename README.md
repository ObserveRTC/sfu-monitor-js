## Install

Install `sfu-observer-js`

```shell
    npm i sfu-observer-js
```

## Observe your SFU

### Mediasoup

```javascript
    const { MediasoupSfuObserver } = require("sfu-observer-js");
    const mediasoup = require('mediasoup');
    // ...
    const POLLING_INTERVAL_IN_MS = 10000;
    const HOST = "localhost:7080";
    const SERVICE_ID = "myServiceId";
    const MEDIAUNIT_ID = "mySFU";
    const sfuObserver = MediasoupSfuObserver.builder()
            .withMediasoup(mediasoup)
            .withPollingInterval(POLLING_INTERVAL_IN_MS)
            .withEndpoint(`ws://${HOST}/sfusamples/${SERVICE_ID}/${MEDIAUNIT_ID}`)
            .build();

    // start monitoring when you want the service to start polling
    sfuObserver.start();
    
    // optionally, you can subscribe to the event emitted when a sample is ready
    sfuObserver
        .onSample(sample => {
            console.log("sfu sample", sample);
        })
        .onError(error => {
            console.warn("An error occurred", error);
        })
    ;

    // stop monitoring whenever you want no longer to monitor the service
    sfuObserver.stop();
```
