// import { uuid } from 'uuidv4';
// import { Comlink } from '../Comlink';
// import { SfuObserver } from "../SfuObserver";
// import * as SfuSampleBuilder from "../SfuSampleBuilder"
// import * as SfuTransportStat from "../SfuTransportStatBuilder"
// import * as SfuSctpStreamBuilder from "../SfuSctpStreamBuilder"
// import * as SfuInboundRtpStreamBuilder from "../SfuInboundRtpStreamBuilder"
// import * as SfuOutboundRtpStreamBuilder from "../SfuOutboundRtpStreamBuilder"
// import { factory } from "../ConfigLog4j";
 
// const logger = factory.getLogger("MediasoupSfuObserverBuilder");
// function parseVersion(version: any): any {
//     const arr = version.split('.');
//     const major = parseInt(arr[0], 10) || 0;
//     const minor = parseInt(arr[1], 10) || 0;
//     const patch = parseInt(arr[2], 10) || 0;
//     return { major, minor, patch };
// }

// function validateMediasoupObject(obj: any, subject: string): void {
//     if (!obj) {
//         throw new Error(`${subject} cannot be null`);
//     }
//     if (obj.id === null || obj.id === undefined) {
//         throw new Error(`${subject} id property cannot be null or undefined`);
//     }
//     if (obj.observer === null || obj.observer === undefined) {
//         throw new Error(`${subject}  observer property cannot be null or undefined`);
//     }
//     if (typeof obj.observer.on !== 'function') {
//         throw new Error(`${subject} observer.on must be a function`);
//     }
// }

// interface Builder {
//     withMediasoup(mediasoup: any): this;
//     withEndpoint(url: string): this,
//     withPollingInterval(intervalInMs: number): this,
//     build(): SfuObserver
// }

// export function mediasoupSfuObserverBuilder(): Builder {
//     const sfuId = uuid();
//     let _intervalInMs: number = 5000;
//     const _workers = new Map();
//     const _routers = new Map();
//     const _transports = new Map();
//     const _streamTransportsMap = new Map();
//     const _producers = new Map();
//     const _consumers = new Map();
//     const _dataProducers = new Map();
//     const _dataConsumers = new Map();
//     const _sctpStreamBuilders = new Map();

//     const _getSfuOutboundRtpStream = function* (): any {
//         for (const consumer of _consumers.values()) {
//             const transportId = _streamTransportsMap.get(consumer.id);
//             if (transportId === null) {
//                 logger.warn("No transportId has been registered for producer " + consumer.id);
//                 continue;
//             }
//             const statsArray = consumer.getStats();
//             if (!Array.isArray(statsArray)) {
//                 logger.warn(`Consumer ${consumer.id} does not provide stats array`);
//                 continue;
//             }
//             for (const stats of statsArray) {
//                 if (stats.type !== "outbound-rtp") {
//                     continue;
//                 }
//                 const builder = SfuOutboundRtpStreamBuilder.builder()
//                     .withTransportId(transportId)
//                     .withTrackId(consumer.appData?.trackId)
//                     .withStreamId(consumer.id)
//                     .withInboundStreamId(consumer.producerId)
//                     .withSsrc(stats.ssrc)
//                     .withMediaType(consumer.kind)
//                     // .withPayloadType(stats.pay)
//                     .withMimeType(stats.mimeType)
//                     // .withClockRate
//                     // .withSdpFmtpLine
//                     .withRid(stats.rid)
//                     .withRtxSsrc(stats.rtxSsrc)
//                     .withTargetBitrate(stats.bitrate)
//                     // .withVoiceActivityFlag
//                     .withFirCount(stats.firCount)
//                     .withPliCount(stats.pliCount)
//                     .withNackCount(stats.nackCount)
//                     // .withSliCount
//                     .withPacketsSent(stats.packetCount)
//                     .withPacketsDiscarded(stats.packetsDiscarded)
//                     .withPacketsRetransmitted(stats.packetsRetransmitted)
//                     // .withPacketsFailedEncryption
//                     // .withPacketsDuplicated
//                     // .withFecPacketsSent
//                     // .withFecPacketsDiscarded
//                     .withBytesSent(stats.byteCount)
//                     // .withRtcpSrSent
//                     // .withRtcpRrReceived
//                     // .withRtxPacketsSent
//                     .withRtxPacketsDiscarded(stats.rtxPacketsDiscarded)
//                     // .withFramesReceived
//                     // .withFramesDecoded
//                     // .withKeyFramesDecoded
//                 ;
//                 yield builder.build();
//             }
//         }
//     };

//     const _getSfuInboundRtpStream = function* (): any {
//         for (const producer of _producers.values()) {
//             const transportId = _streamTransportsMap.get(producer.id);
//             if (transportId === null) {
//                 logger.warn("No transportId has been registered for producer " + producer.id);
//                 continue;
//             }
//             const statsArray = producer.getStats();
//             if (!Array.isArray(statsArray)) {
//                 logger.warn(`Producer ${producer.id} does not provide stats array`);
//                 continue;
//             }

//             for (const stats of statsArray) {
//                 if (stats.type !== "inbound-rtp") {
//                     continue;
//                 }
//                 const builder =  SfuInboundRtpStreamBuilder.builder()
//                     .withTransportId(transportId)
//                     .withTrackId(producer.appData?.trackId)
//                     .withStreamId(producer.id)
//                     // .withOutboundStreamId
//                     .withSsrc(stats.ssrc)
//                     .withMediaType(stats.kind)
//                     // .withPayloadType(stats.pay)
//                     .withMimeType(stats.mimeType)
//                     // .withClockRate
//                     // .withSdpFmtpLine
//                     .withRid(stats.rid)
//                     .withRtxSsrc(stats.rtxSsrc)
//                     .withTargetBitrate(stats.bitrate)
//                     // .withVoiceActivityFlag
//                     .withFirCount(stats.firCount)
//                     .withPliCount(stats.pliCount)
//                     .withNackCount(stats.nackCount)
//                     // .withSliCount
//                     .withPacketsLost(stats.packetsLost)
//                     .withPacketsReceived(stats.packetCount)
//                     .withPacketsDiscarded(stats.packetsDiscarded)
//                     .withPacketsRepaired(stats.packetsRepaired)
//                     // .withPacketsFailedDecryption
//                     // .withPacketsDuplicated
//                     // .withFecPacketsReceived
//                     // .withFecPacketsDiscarded
//                     .withBytesReceived(stats.byteCount)
//                     // .withRtcpSrReceived
//                     // .withRtcpRrSent
//                     // .withRtxPacketsReceived
//                     .withRtxPacketsDiscarded(stats.rtxPacketsDiscarded)
//                     // .withFramesReceived
//                     // .withFramesDecoded
//                     // .withKeyFramesDecoded
//                     .withFractionLost(stats.fractionLost)
//                     .withJitter(stats.jitter)
//                     .withRoundTripTime(stats.roundTripTime)
//                 ;
//                 yield builder.build();
//             }
//         }
//     };

//     const _getSctpStreamBuilder = (transportId: any, streamId: any, stats: any): any => {
//         const retrieveId = transportId + streamId;
//         let builder = _sctpStreamBuilders.get(retrieveId);
//         if (builder) {
//             return builder;
//         }
//         builder = SfuSctpStreamBuilder.create()
//             .withTransportId(transportId)
//             .withStreamId(streamId)
//             .withLabel(stats.label)
//             .withProtocol(stats.protocol)
        
//         _sctpStreamBuilders.set(retrieveId, builder);
//         return builder;   
//     }

//     const _setDataProducersSctpStream = (): void => {
//         for (const dataProducer of _dataConsumers.values()) {
//             const transportId = _streamTransportsMap.get(dataProducer.id);
//             if (transportId === null) {
//                 logger.warn("No transportId has been registered for dataProducer " + dataProducer.id);
//                 continue;
//             }
//             const stats = dataProducer.getStats();
//             if (stats.type !== "data-producer") {
//                 continue;
//             }
//             const streamId = dataProducer.id;
//             const builder = _getSctpStreamBuilder(transportId, streamId, stats);
//             builder
//                 .withMessageSent(stats.messagesSent)
//                 .withBytesSent(stats.bytesSent);
//         }
//     }

//     const _setDataConsumersSctpStream = (): void => {
//         for (const dataConsumer of _dataConsumers.values()) {
//             const stats = dataConsumer.getStats();
//             const transportId = _streamTransportsMap.get(dataConsumer.id);
//             if (transportId === null) {
//                 logger.warn("No transportId has been registered for dataProducer " + dataConsumer.id);
//                 continue;
//             }
//             if (stats.type !== "data-consumer") {
//                 continue;
//             }
//             const streamId = dataConsumer.dataProducerId;
//             const builder = _getSctpStreamBuilder(transportId, streamId, stats);
//             builder
//                 .withMessageReceived(stats.messagesReceived)
//                 .withBytesReceived(stats.bytesReceived);
//         }
//     }

//     const _getSfuTransportStat = function* (): any {
//         for (const transport of _transports.values()) {
//             const stats = transport.getStats();
//             if (stats.type !== "webrtc-transport") {
//                 continue;
//             }
//             const selectedIce = stats.iceSelectedTuple;
//             const builder =  SfuTransportStat.builder()
//                 .withTransportId(transport.id)
//                 .withServiceId(transport.appData?.serviceId)
//                 .withDtlsState(stats?.dtlsState)
//                 .withIceState(stats?.iceState)
//                 .withSctpState(stats?.sctpState)
//                 .withIceRole(stats?.iceRole)
//                 .withLocalAddress(selectedIce?.localIp)
//                 .withLocalPort(selectedIce?.localPort)
//                 .withProtocol(selectedIce?.protocol)
//                 .withRemoteAddress(selectedIce?.remoteIp)
//                 .withRemotePort(selectedIce?.remotePort)
//                 .withRtpBytesReceived(stats?.rtpBytesReceived)
//                 .withRtpBytesSent(stats?.rtpBytesSent)
//                 .withRtxBytesReceived(stats?.rtxBytesReceived)
//                 .withRtxBytesSent(stats?.rtxBytesSent)
//             ;
//             yield builder.build();
//         }
//     };
    
//     const _buildSample = () => {
//         const builder = SfuSampleBuilder.builder()
//             .withSfuId(sfuId)
//         ;
//         for (const sfuTransportStat of _getSfuTransportStat()) {
//             builder.addTransportStat(sfuTransportStat);
//         }
//         _setDataProducersSctpStream();
//         _setDataConsumersSctpStream();
//         for (const sctpStreamBuilder of _sctpStreamBuilders.values()) {
//             const sctpStream = sctpStreamBuilder.build();
//             builder.addSctpStream(sctpStream);
//         }
//         for (const sfuInboundRtpStream of _getSfuInboundRtpStream()) {
//             builder.addInboundRtpStream(sfuInboundRtpStream);
//         }
//         for (const sfuOutboundRtpStream of _getSfuOutboundRtpStream()) {
//             builder.addOutboundRtpStream(sfuOutboundRtpStream);
//         }
//         _sctpStreamBuilders.clear();
//         return builder.build();
//     };

//     // Observe functionality

//     const _observeDataProducer = (dataProducer: any) => {
//         validateMediasoupObject(dataProducer, "dataProducer");
//         _dataProducers.set(dataProducer.id, dataProducer);
//         dataProducer.observer.on("close", () => {
//             _dataProducers.delete(dataProducer.id);
//             _streamTransportsMap.delete(dataProducer.id);
//         });
//     };

//     const _observeDataConsumer = (dataConsumer: any) => {
//         validateMediasoupObject(dataConsumer, "dataConsumer");
//         _dataConsumers.set(dataConsumer.id, dataConsumer);
//         dataConsumer.observer.on("close", () => {
//             _dataConsumers.delete(dataConsumer.id);
//             _streamTransportsMap.delete(dataConsumer.id);
//         });
//     };

//     const _observeProducer = (producer: any) => {
//         validateMediasoupObject(producer, "producer");
//         _producers.set(producer.id, producer);
//         producer.observer.on("close", () => {
//             _producers.delete(producer.id);
//             _streamTransportsMap.delete(producer.id);
//         });
//     };

//     const _observeConsumer = (consumer: any) => {
//         validateMediasoupObject(consumer, "consumer");
//         _consumers.set(consumer.id, consumer);
//         consumer.observer.on("close", () => {
//             _consumers.delete(consumer.id);
//             _streamTransportsMap.delete(consumer.id);
//         });
//     };

//     const _observeTransport = (transport: any) => {
//         validateMediasoupObject(transport, "transport");
//         _transports.set(transport.id, transport);
//         const transportId = transport.id;
//         transport.observer.on("close", () => _transports.delete(transportId));
//         transport.observer.on("newproducer", (producer: any) => {
//             _streamTransportsMap.set(producer.id, transportId);
//             _observeProducer(producer);
//         });
//         transport.observer.on("newconsumer", (consumer: any) => {
//             _streamTransportsMap.set(consumer.id, transportId);
//             _observeConsumer(consumer);
//         });
//         transport.observer.on("newdataproducer", (dataProducer: any) => {
//             _streamTransportsMap.set(dataProducer.id, transportId);
//             _observeDataProducer(dataProducer);
//         });
//         transport.observer.on("newdataconsumer", (dataConsumer: any) => {
//             _streamTransportsMap.set(dataConsumer.id, transportId);
//             _observeDataConsumer(dataConsumer)
//         });
//     };

//     const _observeRouter = (router: any) => {
//         validateMediasoupObject(router, "router");
//         _routers.set(router.id, router);
//         router.observer.on("close", () => _routers.delete(router.id));
//         router.observer.on("newtransport", (transport: any) => _observeTransport(transport));
//     };

//     const _observeWorker = (worker: any) => {
//         validateMediasoupObject(worker, "worker");
//         _workers.set(worker.pid, worker);
//         worker.observer.on("close", () => _workers.delete(worker.pid));
//         worker.observer.on("newrouter", (router: any) => _observeRouter(router));
//     };
//     let comlink : Comlink | null = null;
//     const result = {
//         withMediasoup(mediasoup: any) {
//             if (!mediasoup) {
//                 throw new Error("Cannot observe a null mediasoup object");
//             }
//             const { major, minor, patch } = parseVersion(mediasoup.version);
//             if (major < 3) {
//                 throw new Error("Can only observe mediasoup major version 3");
//             }
//             // here it comes the hook!
//             mediasoup.observer.on("newworker", (worker: any) => _observeWorker(worker));
//             return result;
//         },

//         withEndpoint(endpoint: string) {
//             comlink = Comlink.builder()
//                 .withEndpoint(endpoint)
//                 .build();
//             return result;
//         },

//         withPollingInterval(intervalInMs: number) {
//             _intervalInMs = intervalInMs;
//             return result;
//         },

//         build() {
//             const sampleProvider = {
//                 getSample: () => _buildSample(),
//             };
//             const sfuObserverBuilder = SfuObserver.builder()
//                 .withIntervalInMs(_intervalInMs)
//                 .withSampleProvider(sampleProvider);
//             if (comlink !== null) {
//                 sfuObserverBuilder.withComlink(comlink);
//             }
//             return sfuObserverBuilder.build();
//         }
//     }
//     return result;
// }
