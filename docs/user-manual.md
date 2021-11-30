Sfu-Observer Javascript SDK
===

Javascript library to create and send [SfuSample](https://github.com/ObserveRTC/schemas-2.0/blob/main/generated-schemas/samples/v2/SfuSample.md)s. SfuSamples can be processed by an [observer](https://github.com/ObserveRTC/observer). Observer match [samples originated from client applications](https://github.com/ObserveRTC/schemas-2.0/blob/main/generated-schemas/samples/v2/ClientSample.md) and samples originated from SFU. After you setup an observer, you can integrate your SFU and start watching your transports.

## Integrate your SFU

### Install

Add the npm package to your SFU project.

```shell
    npm i sfu-observer-js
```

### Build supported SFU-Observer

In order to provide and send [SfuSample]()s from your SFU, you need to 
provide components for it. Currently the following SFUs are supported by the 
library:
 * [mediasoup]() integration

#### Mediasoup

Take a look the following example to integrate mediaosup:

```javascript
    const { MediasoupSfuObserver } = require("sfu-observer-js");
    const mediasoup = require('mediasoup');
    // ...
    const POLLING_INTERVAL_IN_MS = 10000;
    const OBSERVER_ADDRESS = "localhost:7080";
    const SERVICE_ID = "myServiceId";
    const MEDIAUNIT_ID = "mySFU";
    const sfuObserver = MediasoupSfuObserver.builder()
            .withMediasoup(mediasoup)
            .withPollingInterval(POLLING_INTERVAL_IN_MS)
            .withEndpoint(`ws://${OBSERVER_ADDRESS}/sfusamples/${SERVICE_ID}/${MEDIAUNIT_ID}`)
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

where 
 * `POLLING_INTERVAL_IN_MS` is the period of the sampling
 * `OBSERVER_ADDRESS` is the address where an [observer]() listens for samples
 * `SERVICE_ID`, and `MEDIAUNIT_ID` corresponds to the Service and Media identifiers 
 used matching and report generation processes.
 * `sfuObserver.start();` starts making and sending samples
 * `sfuObserver.stop();` stops making and seding samples.

 ## Appendixes

