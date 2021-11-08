This client application helps you sampling your SFU. After configuring the client app it generates an [SfuSample](https://github.com/ObserveRTC/schemas-2.0/blob/main/generated-schemas/samples/v2/SfuSample.md), which can be processed by an [observer](https://github.com/ObserveRTC/observer). Observer match [samples originated from client applications](https://github.com/ObserveRTC/schemas-2.0/blob/main/generated-schemas/samples/v2/ClientSample.md) and samples originated from SFU. After you setup an observer, you can integrate your SFU and start watching your transports.

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
