import { SfuInboundRtpPadBuilder } from "../SfuInboundRtpPadBuilder";
import { SfuOutboundRtpPadBuilder } from "../SfuOutboundRtpPadBuilder";
import { SfuSctpStreamBuilder } from "../SfuSctpStreamBuilder";
import { SfuTransportStatBuilder } from "../SfuTransportStatBuilder";
import { SfuVisitor } from "../SfuVisitor";
import { MediasoupWrapper } from "./MediasoupWrapper";
import { factory } from "../ConfigLog4j";
import { SctpStream, SfuOutboundRtpPad, SfuInboundRtpPad, SfuTransport } from "../SfuSample";
 
const logger = factory.getLogger("SfuObserver.MediasoupVisitor");

interface Builder {
    withMediasoupWrapper(mediasoupWrapper: MediasoupWrapper): Builder;
    build(): MediasoupVisitor;
}

export class MediasoupVisitor implements SfuVisitor {
    
    public static builder(): Builder {
        let _wrapper : MediasoupWrapper | null = null;
        const result: Builder = {
            withMediasoupWrapper(wrapper): Builder {
                _wrapper = wrapper;
                return result;
            },
            build(): MediasoupVisitor {
                if (_wrapper === null) {
                    throw new Error("Mediasoup Wrapper cannot be null");
                }
                return new MediasoupVisitor(_wrapper);
            }
        }
        return result;
    }

    private _mediasoup: MediasoupWrapper;
    private _enabled: boolean = false;

    private constructor(mediasoup: MediasoupWrapper) {
        this._mediasoup = mediasoup;
    }

    enable(): void {
        this._enabled = true;
        this._mediasoup.enable();
        logger.info("Enabled");
    }

    disable(): void {
        this._enabled = false;
        this._mediasoup.disable();
        logger.info("Disabled");
    }

    async *visitInboundRtpPads(): AsyncGenerator<SfuInboundRtpPad, void, void> {
        if (!this._enabled) {
            return;
        }
        const version = this._mediasoup.version;
        for await (const producerStats of this._mediasoup.producerStats()) {
            const statsIncluded = producerStats.statsIncluded;
            if (statsIncluded && producerStats.type !== "inbound-rtp") {
                continue;
            }
            const builder = SfuInboundRtpPadBuilder.create()
                    .withTransportId(producerStats.transportId)
                    .withRtpStreamId(producerStats.id)
                    .withInternal(producerStats.piped)
                    .withSkipMeasurements(!statsIncluded)
                    .withPadId(producerStats.padId)
                    .withSsrc(producerStats.ssrc)
                    .withMediaType(producerStats.kind)
                    // .withPayloadType(stats.pay)
                    .withMimeType(producerStats.mimeType)
                    // .withClockRate
                    // .withSdpFmtpLine
                    .withRid(producerStats.rid)
                    .withRtxSsrc(producerStats.rtxSsrc)
                    .withTargetBitrate(producerStats.bitrate)
                    // .withVoiceActivityFlag
                    .withFirCount(producerStats.firCount)
                    .withPliCount(producerStats.pliCount)
                    .withNackCount(producerStats.nackCount)
                    // .withSliCount
                    .withPacketsLost(producerStats.packetsLost)
                    .withPacketsReceived(producerStats.packetCount)
                    .withPacketsDiscarded(producerStats.packetsDiscarded)
                    .withPacketsRepaired(producerStats.packetsRepaired)
                    // .withPacketsFailedDecryption
                    // .withPacketsDuplicated
                    // .withFecPacketsReceived
                    // .withFecPacketsDiscarded
                    .withBytesReceived(producerStats.byteCount)
                    // .withRtcpSrReceived
                    // .withRtcpRrSent
                    // .withRtxPacketsReceived
                    .withRtxPacketsDiscarded(producerStats.rtxPacketsDiscarded)
                    // .withFramesReceived
                    // .withFramesDecoded
                    // .withKeyFramesDecoded
                    .withFractionLost(producerStats.fractionLost)
                    .withJitter(producerStats.jitter)
                    .withRoundTripTime(producerStats.roundTripTime)
                ;
                if (producerStats.piped) {
                    builder.withOutboundPadId(producerStats.id);
                }
                yield builder.build();
        }
    }
    
    async *visitOutbooundRtpPads(): AsyncGenerator<SfuOutboundRtpPad, void, void> {
        if (!this._enabled) {
            return;
        }
        const version = this._mediasoup.version;
        for await (const consumerStats of this._mediasoup.consumerStats()) {
            const statsIncluded = consumerStats.statsIncluded;
            if (!statsIncluded && consumerStats.type !== "outbound-rtp") {
                continue;
            }
            const builder = SfuOutboundRtpPadBuilder.create()
                    .withTransportId(consumerStats.transportId)
                    .withRtpStreamId(consumerStats.producerId)
                    .withPadId(consumerStats.padId)
                    .withInternal(consumerStats.piped)
                    .withSkipMeasurements(!statsIncluded)
                    .withSsrc(consumerStats.ssrc)
                    .withMediaType(consumerStats.kind)
                    // .withPayloadType(stats.pay)
                    .withMimeType(consumerStats.mimeType)
                    // .withClockRate
                    // .withSdpFmtpLine
                    .withRid(consumerStats.rid)
                    .withRtxSsrc(consumerStats.rtxSsrc)
                    .withTargetBitrate(consumerStats.bitrate)
                    // .withVoiceActivityFlag
                    .withFirCount(consumerStats.firCount)
                    .withPliCount(consumerStats.pliCount)
                    .withNackCount(consumerStats.nackCount)
                    // .withSliCount
                    .withPacketsSent(consumerStats.packetCount)
                    .withPacketsDiscarded(consumerStats.packetsDiscarded)
                    .withPacketsRetransmitted(consumerStats.packetsRetransmitted)
                    // .withPacketsFailedEncryption
                    // .withPacketsDuplicated
                    // .withFecPacketsSent
                    // .withFecPacketsDiscarded
                    .withBytesSent(consumerStats.byteCount)
                    // .withRtcpSrSent
                    // .withRtcpRrReceived
                    // .withRtxPacketsSent
                    .withRtxPacketsDiscarded(consumerStats.rtxPacketsDiscarded)
                    // .withFramesReceived
                    // .withFramesDecoded
                    // .withKeyFramesDecoded
                ;
                yield builder.build();
        }
    }
    
    async *visitTransports(): AsyncGenerator<SfuTransport, void, void> {
        if (!this._enabled) {
            return;
        }
        for await (const transportStats of this._mediasoup.transportStats()) {
            const statsIncluded = transportStats.statsIncluded;
            if (!statsIncluded && transportStats.type !== "webrtc-transport") {
                continue;
            }
            const builder = SfuTransportStatBuilder.create()
                .withTransportId(transportStats.id)
                .withInternal(transportStats.piped)
                .withSkipMeasurements(!statsIncluded)
                .withDtlsState(transportStats.dtlsState)
                .withIceState(transportStats.iceState)
                .withSctpState(transportStats.sctpState)
                .withIceRole(transportStats.iceRole)
                .withLocalAddress(transportStats.localIp)
                .withLocalPort(transportStats.localPort)
                .withProtocol(transportStats.protocol)
                .withRemoteAddress(transportStats.remoteIp)
                .withRemotePort(transportStats.remotePort)
                .withRtpBytesReceived(transportStats.rtpBytesReceived)
                .withRtpBytesSent(transportStats.rtpBytesSent)
                .withRtxBytesReceived(transportStats.rtxBytesReceived)
                .withRtxBytesSent(transportStats.rtxBytesSent)
            ;
            yield builder.build();
        }
        
    }
    
    async *visitSctpStreams(): AsyncGenerator<SctpStream, void, void> {
        if (!this._enabled) {
            return;
        }
        const sctpStreamBuilders = new Map<string, SfuSctpStreamBuilder>();
        const _getSctpStreamBuilder = (transportId: any, streamId: any, label: any, protocol: any): SfuSctpStreamBuilder => {
            const retrieveId = transportId + streamId;
            let builder = sctpStreamBuilders.get(retrieveId);
            if (builder) {
                return builder;
            }
            builder = SfuSctpStreamBuilder.create()
                .withTransportId(transportId)
                .withStreamId(streamId)
                .withLabel(label)
                .withProtocol(protocol)
            
            sctpStreamBuilders.set(retrieveId, builder);
            return builder;   
        }
        for await (const dataConsumerStats of this._mediasoup.dataConsumerStats()) {
            const builder = _getSctpStreamBuilder(
                dataConsumerStats.transportId,
                dataConsumerStats.streamId,
                dataConsumerStats.label,
                dataConsumerStats.protocol,
            );
            builder
                .withMessageReceived(dataConsumerStats.messagesReceived)
                .withBytesReceived(dataConsumerStats.bytesReceived)
            ;
        }
        for await (const dataProducerStats of this._mediasoup.dataProducerStats()) {
            const builder = _getSctpStreamBuilder(
                dataProducerStats.transportId,
                dataProducerStats.streamId,
                dataProducerStats.label,
                dataProducerStats.protocol,
            );
            builder
                .withMessageReceived(dataProducerStats.messagesSent)
                .withBytesReceived(dataProducerStats.bytesSent)
            ;
        }
        for (const builder of sctpStreamBuilders.values()) {
            yield builder.build();
        }
    }
}
