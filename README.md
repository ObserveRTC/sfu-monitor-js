ObserveRTC Integration for Selective Forwarding Units (SFU)
---

`@observertc/sfu-monitor-js` is an SFU side library to monitor your SFU and integrate with observertc components.

Table of Contents:
 * [Quick Start](#quick-start)
   - [Collect stats from mediasoup](#collect-stats-from-mediasoup)
   - [Collect stats from other SFUs](#collect-stats-from-other-sfus)
   - [Sample and Send](#sample-and-send)
 * [Use collected stats](#use-collected-stats)
 * [Examples](#mediasoup-examples)
    - [Number of RTP sessions](#number-of-rtp-sessions)
    - [Media streams and sinks](#media-streams-and-sinks)
    - [Receiver and sender bitrates](#receiver-and-sender-bitrates)
 * [Configurations](#configurations)
 * [API docs](#api-docs)
 * [NPM package](#npm-package)
 * [Contributions](#contributions)
 * [License](#license)

## Qucik Start

```
npm i @observertc/sfu-monitor-js
```

### Collect stats from mediasoup

If you use [mediasoup:3.x.y]() you can use the built-in integration.

```javascript
import { SfuMonitor, MediasoupCollector } from "@observertc/sfu-monitor-js";
// see full config in Configuration section
const config = {
    collectingPeriodInMs: 5000,
};
const monitor = SfuMonitor.create(config);
const collector = MediasoupCollector.create();
monitor.addStatsCollector(collector);

// ... somewhere in your code
const transport = router.createWebRtcTransport(options);
collector.watchWebRtcTransport(transport);
```

### Collect stats from other SFUs

You can write a stats collector by using `AuxCollector`.
```javascript
import { SfuMonitor, AuxCollector } from "@observertc/sfu-monitor-js";
// see full config in Configuration section
const config = {
    collectingPeriodInMs: 5000,
};
const monitor = SfuMonitor.create(config);
const collector = AuxCollector.create();
monitor.addStatsCollector(collector);

collector.addTransportStatsSupplier("transportId", async () => {
    const stats: SfuTransport = {

    };
    return stats;
});
collector.removeTransportStatsSupplier("transportId");

// similarly:
collector.addInboundRtpPadStatsSupplier("padId", ...);
collector.removeInboundRtpPadStatsSupplier("padId");

collector.addOutboundRtpPadStatsSupplier("padId", ...);
collector.removeOutboundRtpPadStatsSupplier("padId");

collector.addSctpStreamStatsSupplier("channelId", ...);
collector.removeSctpStreamSupplier("channelId");
```

### Sample and Send

Sampling means the sfu-monitor creates a so-called SfuSample. SfuSample is a compound object contains a snapshot from the polled stats. SfuSample is created by a Sampler component.
A created SfuSample is added to Samples object. Samples can be sent to the server by a Sender component.

The above shown examples can be extended to sample and send by adding the following configurations:

```javascript
import { SfuMonitor } from "@observertc/sfu-monitor-js";
// see full config in Configuration section
const config = {
    collectingPeriodInMs: 5000,
    samplingPeriodInMs: 10000,
    sendingPeriodInMs: 10000,
    sender: {
        websocket: {
            urls: ["ws://localhost:7080/samples/myServiceId/myMediaUnitId"]
        }
    }
};
const monitor = SfuMonitor.create(config);
//... the rest of your code
```

## Use collected stats

```javascript
const storage = monitor.storage;
for (const sfuTransportEntry of storage.transports()) {
    // use SfuTransportEntry
}

for (const sfuInboundRtpPadEntry of storage.inboundRtpPads()) {
    // use SfuInboundRtpPadEntry
}

for (const sfuOutboundRtpPadEntry of storage.outboundRtpPads()) {
    // use SfuInboundRtpPadEntry
}

for (const sctpChannelEntry of storage.sctpChannels()) {
    // use SctpChannelEntry
}

for (const mediaStreamEntry of storage.mediaStreams()) {
    // use MediaStreamEntry
}

for (const mediaStreamEntry of storage.audioStreams()) {
    // use MediaStreamEntry
}

for (const mediaStreamEntry of storage.videoStreams()) {
    // use MediaStreamEntry
}

for (const mediaSinkEntry of storage.mediaSinks()) {
    // use MediaSinkEntry
}

for (const mediaSinkEntry of storage.audioSinks()) {
    // use MediaSinkEntry
}

for (const mediaSinkEntry of storage.videoSinks()) {
    // use MediaSinkEntry
}
```


With `observer.stats` you accessing so called Entries. The interface for the entries visualized in the picture below:

![Entry Navigations](puml/navigation.png)


The collected stats from any integration is stored and updated in the 
observer object. The list of collected types are the following:
  * [SfuTransport](https://www.npmjs.com/package/@observertc/schemas#SfuTransport): A Transport level measurements provide data exchange for many inbound, outbound rtp pads, and sctp channels.
 * [SfuInboundRtpPad](https://www.npmjs.com/package/@observertc/schemas#SfuInboundRtpPad): Inbound Rtp Pad provided measurements. This is related to a client side provided [OutboundAudioTrack](https://www.npmjs.com/package/@observertc/schemas#OutboundAudioTrack), or [OutboundVideoTrack](https://www.npmjs.com/package/@observertc/schemas#OutboundVideoTrack) measurements.
  * [SfuOutboundRtpPad](https://www.npmjs.com/package/@observertc/schemas#SfuOutboundRtpPad): Outbound Rtp Pad (each pad relates to one ssrc) provided measurements. This is related to a client side provided [InboundAudioTrack](https://www.npmjs.com/package/@observertc/schemas#InboundAudioTrack), or [InboundVideoTrack](https://www.npmjs.com/package/@observertc/schemas#InboundVideoTrack) measurements.
 * [SfuSctpChannel](https://www.npmjs.com/package/@observertc/schemas#SfuSctpChannel): SCTP channel provided measurements

Additionally the observer groups the collected stats into the following entities:
 * **MediaStream**: a group of InboundRtpPad belongs to the same streamed media traffic. For example a simulcast media typically creates several SSRCs to stream the same media in different spatial or temporal aspective. Thos RTP sessions belong to the same media stream.
 * **MediaSink** A group of OutboundRtpPad sinks out media stream traffic to (typically) a client endpoint or to another SFU.
 

## Examples

### Number of RTP Sessions

```javascript
const storage = monitor.storage;
// The total number of RTP session going through the SFU
const totalNumberOfRtpSessions = storage.getNumberOfInboundRtpPads() + storage.getNumberOfOutboundRtpPads();

// The average number of rtp session in one transport (peer connection) between the SFU and its peers.
const avgNumberOfRtpSessionsPerTransport = totalNumberOfRtpSessions / storage.getNumberOfTransports();
const rtpPadsNum = [];
for (const sfuTransportEntry of storage.transports()) {
    const nrOfRtpSessions = sfuTransportEntry.getNumberOfOutboundRtpPads() + sfuTransportEntry.getNumberOfOutboundRtpPads();
    rtpPadsNum.push(nrOfRtpSessions);
}
// define the getMedian like: https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-88.php
const medianNumberOfRtpSessionsPerTransports = getMedian(rtpPadsNum);

```

### Media streams and sinks

Media streams and sinks, as mentioned above are group of in-, and outbound rtp pads respectively.
For example in simulcast usually 2-3 or even more RTP sessions are used belonging to one media stream.
Media streams are composed by inbound RTP Pads. When a Media Stream is forwarded to a peer, a Media Sink
is created compound outbound RTP sessions, consequently outbound RTP pads.

The following example is created for mediasoup integration, but any other integration respectively provided
`streamId` for inboundRtpPads, and `sinkId` for outbound RTP pads behave similarly.

```javascript
const storage = monitor.storage;

const nrOfProducers = storage.getNumberOfMediaStreams();
const nrOfAudioProducers = storage.getNumberOfAudioStreams();
const nrOfVideoProducers = storage.getNumberOfVideoStreams();

const nrOfConsumers = storage.getNumberOfMediaSinks();
const nrOfAudioConsumers = storage.getNumberOfAudioSinks();
const nrOfVideoConsumers = storage.getNumberOfVideoSinks();

const avgNrOfProducersPerTransport = storage.getNumberOfMediaStreams() / storage.getNumberOfTransports();
```

### Receiver and sender bitrates

```javascript
const storage = monitor.stats;

const traces = new Map();
let lastCheck = Date.now();
monitor.events.onStatsCollected(() => {
    let totalReceivedBytes = 0;
    for (const sfuInboundRtpPadEntry of storage.inboundRtpPads()) {
        const { bytesReceived } = sfuInboundRtpPadEntry.stats;
        const prevBytesReceived = traces.get(sfuInboundRtpPadEntry.id) || 0;
        totalReceivedBytes += bytesReceived - prevBytesReceived;
    }

    let totalSentBytes = 0;
    for (const sfuOutboundRtpPadEntry of storage.outboundRtpPads()) {
        const { bytesSent } = sfuOutboundRtpPadEntry.stats;
        const prevBytesSent = traces.get(sfuOutboundRtpPadEntry.id) || 0;
        totalSentBytes += bytesSent - prevBytesSent;
    }

    const now = Date.now();
    const elapsedTimeInS = (now - lastCheck) / 1000;
    const receivingBitrate = (totalReceivedBytes * 8) / elapsedTimeInS;
    const sendingBitrate = (totalSentBytes * 8) / elapsedTimeInS;
    console.log("Received bytes since last check: ", totalReceivedBytes);
    console.log("Receiving bitrate: ", receivingBitrate);
    console.log("Sent bytes since last check: ", totalSentBytes);
    console.log("Sending bitrate: ", sendingBitrate);
    lastCheck = now;
});
```


## Configurations

```javascript
const config = {
    /**
     * By setting it, the monitor calls the added statsCollectors periodically
     * and pulls the stats.
     * 
     * DEFAULT: undefined
     */
    collectingPeriodInMs: 5000,
    /**
     * By setting it, the monitor make samples periodically.
     * 
     * DEFAULT: undefined
     */
    samplingPeriodInMs: 10000,

    /**
     * By setting it stats items and entries are deleted if they are not updated.
     * 
     * DEFAULT: undefined
     */
    statsExpirationTimeInMs: 60000,

    /**
     * Sampling Component Related configurations
     * 
     */
    sampler: {
            /**
         * The identifier of the SFU.
         * 
         * DEFAULT: a generated unique value
         */
        sfuId: "sfuId",

        /**
         * Indicate if the sampler only sample stats updated since the last sampling.
         * 
         * DEFAULT: true
         */
        incrementalSampling: true,
    },
    sender: {
        /**
         * Configure the codec used to transport samples or receieve 
         * feedback from the server.
         * 
         * Possible values: json, protobuf
         * 
         * DEFAULT: json
         * 
         */
        format: "json",
        /**
         * Websocket configuration to transport the samples
         */
        websocket: {
            /**
             * The target url the websocket is opened for 
             */
            url: "ws://localhost:7080/samples/myServiceId/myMediaUnitId",
            /**
             * The maximum number of try to connect to the server
             * 
             * DEFAULT: 3
             */
            maxRetry: 1,
            /**
             * An optional field for additional socket option from ws package
             */
            socketOptions: {

            },
        },
        /**
         * Configuration to setup a REST api transport method for the samples.
         */
        rest: {
            /**
             * The target url the websocket is opened for 
             */
            url: string;
            /**
             * The maximum number of try to connect to the server
             * 
             * DEFAULT: 3
             */
            maxRetry: 1,
        },
    }
};
```


## API docs

https://observertc.github.io/sfu-monitor-js/interfaces/SfuMonitor.html

## NPM package

https://www.npmjs.com/package/@observertc/sfu-monitor-js

## Schema

https://github.com/observertc/schemas

## Contributions

Open a PR

## License

Apache-2.0