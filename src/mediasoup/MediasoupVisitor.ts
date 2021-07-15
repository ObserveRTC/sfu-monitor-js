import { SfuInboundRtpStreamBuilder } from "../SfuInboundRtpStreamBuilder";
import { SfuOutboundRtpStreamBuilder } from "../SfuOutboundRtpStreamBuilder";
import { SfuSctpStreamBuilder } from "../SfuSctpStreamBuilder";
import { SfuTransportStatBuilder } from "../SfuTransportStatBuilder";
import { SfuVisitor } from "../SfuVisitor";
import { MediasoupWrapper } from "./MediasoupWrapper";
import { factory } from "../ConfigLog4j";
import { SctpStream, SfuInboundRtpStream, SfuOutboundRtpStream, SfuTransport } from "../SfuSample";
 
const logger = factory.getLogger("MediasoupVisitor");

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

    private constructor(mediasoup: MediasoupWrapper) {
        this._mediasoup = mediasoup;
    }

    async *visitInboundRtpStreams(): AsyncGenerator<SfuInboundRtpStream, void, void> {
        const version = this._mediasoup.version;
        for await (const producerStats of this._mediasoup.producerStats()) {
            if (producerStats.type !== "inbound-rtp") {
                continue;
            }
            const builder = SfuInboundRtpStreamBuilder.create()
                    .withTransportId(producerStats.transportId)
                    .withTrackId(producerStats.trackId)
                    .withStreamId(producerStats.id)
                    // .withOutboundStreamId
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
                yield builder.build();
        }
    }
    
    async *visitOutboundRtpStreams(): AsyncGenerator<SfuOutboundRtpStream, void, void> {
        const version = this._mediasoup.version;
        for await (const consumerStats of this._mediasoup.consumerStats()) {
            if (consumerStats.type !== "outbound-rtp") {
                continue;
            }
            const builder = SfuOutboundRtpStreamBuilder.create()
                    .withTransportId(consumerStats.transportId)
                    .withTrackId(consumerStats.trackId)
                    .withStreamId(consumerStats.id)
                    .withInboundStreamId(consumerStats.producerId)
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
        for await (const transportStats of this._mediasoup.transportStats()) {
            if (transportStats.type !== "webrtc-transport") {
                continue;
            }
            const builder = SfuTransportStatBuilder.create()
                .withTransportId(transportStats.id)
                .withServiceId(transportStats.serviceId)
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
