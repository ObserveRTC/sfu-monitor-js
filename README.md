## Javascript library to monitor Selective Forwarding Units (SFU)

`@observertc/sfu-monitor-js` is a JavaScript library to monitor your SFU and integrate with ObserveRTC.

Table of Contents:

 * [Quick Start](#quick-start)
 * [Integrations](#integrations)
    - [Mediasoup](#mediasoup)
 * [Configurations](#configurations)
 * [NPM package](#npm-package)
 * [API docs](#api-docs)
 * [Schemas](#schemas)
 * [Getting Involved](#getting-involved)
 * [License](#license)

## Quick Start

Install the library by using NPM:

```
npm i @observertc/sfu-monitor-js
```

Once the library is installed, you need to integrate it.
The first step is to set up a monitor in your application.

```javascript
import * as ObserveRTC from '@observertc/sfu-monitor-js';

// Quick start to create a monitor and log the collected stats
const monitor = ObserveRTC.createSfuMonitor({
  collectingPeriodInMs: 2000,
  samplingPeriodInMs: 4000,
});

monitor.on('sample-created', ({ sfuSample }) => {
  console.log('The created sample', sfuSample);
});
```

A monitor does the following:

1. Collect Stats
2. Make sample based on the collected stats

### Integrate Mediasoup

To integrate [mediasoup:3^](https://mediasoup.org/documentation/v3/) you can use the built-in MediasoupCollector.

```javascript
import * as mediasoup from 'mediasoup';

const sfuMonitor = createSfuMonitor({
  collectingPeriodInMs: 5000,
});

const mediasoupCollector = sfuMonitor.createMediasoupCollector({
  mediasoup,
});


```

With this configuration, the monitor automatically adds and removes mediasoup objects. 

```javascript
monitor.on('stats-collected', () => {
    const storage = monitor.storage
    console.log(`Mediasoup SFU has ${storage.getNumberOfInboundRtpPads()} incoming RTP stream`);
    console.log(`Mediasoup SFU has ${storage.getNumberOfOutboundRtpPads()} outgoing RTP stream`);
    console.log(`Mediasoup SFU has ${storage.getNumberOfTransports()} transports`);
});
```

By default, it does not call `getStats` as it turned out to be performance intensive in some cases.
If you want the collector to call the `getStats` on objects, you can change the configuration like:


```javascript
const mediasoupCollector = sfuMonitor.createMediasoupCollector({
    mediasoup,
    mediasoupCollector: {
        pollWebRtcTransportStats: (transportId) => true,
        pollPlainRtpTransportStats: (transportId) => true,
        pollPipeTransportStats: (transportId) => true,
        pollDirectTransportStats: (transportId) => true,
        pollProducerStats: (producerId) => true,
        pollConsumerStats: (consumerId) => true,
        pollDataProducerStats: (dataProducerId) => true,
        pollDataConsumerStats: (dataProducerId) => true,
    }
});
```

### Integrate other type of SFUs

To have a custom integration, you could use `AuxCollector` as follows:

```javascript

const collector = sfuMonitor.createAuxCollector();

collector.addTransportStatsSupplier("myUniqueGeneratedTransportId", async () => {
    const stats: SfuTransport = {

    };
    return stats;
});
// when you want to remove it:
collector.removeTransportStatsSupplier(transportId);

// similarly:
collector.addInboundRtpPadStatsSupplier("padId", ...);
collector.removeInboundRtpPadStatsSupplier("padId");

collector.addOutboundRtpPadStatsSupplier("padId", ...);
collector.removeOutboundRtpPadStatsSupplier("padId");

collector.addSctpStreamStatsSupplier("channelId", ...);
collector.removeSctpStreamSupplier("channelId");
```

## Configurations

```javascript
const config = {
    /**
  * The identifier of the SFU.
  *
  * DEFAULT: a generated unique value
  */
  sfuId: 'my-sfu-id',

  /**
  * Sets the default logging level for sfu-monitor-js
  * 
  * DEFAULT: warn
  */
  logLevel: LogLevel,

  /**
  * Sets the maximum number of listeners for event emitters
  */
  maxListeners: 1000,
  
  /**
  * Set the ticking time of the timer invokes processes for collecting, sampling, and sending.
  * 
  * DEFAULT: 1000
  */
  tickingTimeInMs: 1000,

  /**
  * By setting it, the observer calls the added statsCollectors periodically
  * and pulls the stats.
  *
  * DEFAULT: undefined
  */
  collectingPeriodInMs: 1000,
  /**
  * By setting it, the observer make samples periodically.
  *
  * DEFAULT: undefined
  */
  samplingPeriodInMs: 1000,

  /**
  * By setting it, the observer sends the samples periodically.
  *
  * DEFAULT: undefined
  */
  sendingPeriodInMs: 1000,

  /**
  * Limits the number of stats polled at once from the collectors. 
  * 
  * DEFAULT: 50
  */
  pollingBatchSize: 50,

  /**
  * Pacing time between polling batches of stats
  * 
  * DEFAULT: undefined
  */
  pollingBatchPaceTimeInMs: 50,

  /**
  * Flag indicating if the monitor creates sfu events.
  * If true, events happening on the collected sources create sfu events such as SFU_TRANSPORT_OPENED, SFU_TRANSPORT_CLOSED.
  * 
  * If this flag is false, the application is responsible for adding sfu events by calling the appropriate SfuMonitor method for the corresponding event.
  * 
  * DEFAULT: false
  */
  createSfuEvents: true,

  /**
  * Configuration for the samples accumulator to balance the transfer the size of the Samples 
  * prepared to be sent to the server
  * 
  */
  accumulator: {
    /**
     * Sets the maximum number of client sample allowed to be in one Sample
     * 
     * DEFAULT: 100
     */
    maxClientSamples: 100,

    /**
     * Sets the maximum number of Samples the accumulator can hold
     * 
     * DEFAULT: 10
     */
    maxSamples: 10,

    /**
     * Forward a Sample to the server even if it is empty
     * 
     * DEFAULT: false
     */
    forwardIfEmpty: false
  }
};
```

## API docs

https://observertc.org/docs/api/sfu-monitor-js-v2/


## NPM package

https://www.npmjs.com/package/@observertc/sfu-monitor-js

## Schemas

https://github.com/observertc/schemas

## Getting Involved

Sfu-monitor is designed to provide an open-source monitoring solution for WebRTC developers. We develop new features and maintain the current product with the help of the community. If you are interested in getting involved, please read our [contribution](CONTRIBUTING.md) guidelines.

### Generate docs:
```
typedoc --out docs ./src
```

## License

Apache-2.0
