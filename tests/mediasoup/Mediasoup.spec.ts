import { SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel, SfuTransport } from "@observertc/schemas";
import EventEmitter from "events";
import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupCollector } from "../../src/mediasoup/MediasoupCollector";
import * as Generator from "../helpers/MediasoupTypesGenerator";

function makeStatsWriter({
    removeTransport,
    updateTransport,
    removeInboundRtpPad,
    updateInboundRtpPad,
    removeOutboundRtpPad,
    updateOutboundRtpPad,
    removeSctpChannel,
    updateSctpChannel,
}: {
    removeTransport?: (transportId: string) => void,
    updateTransport?: (stats: SfuTransport) => void,
    removeInboundRtpPad?: (rtpPadId: string) => void,
    updateInboundRtpPad?: (stats: SfuInboundRtpPad) => void,
    removeOutboundRtpPad?: (rtpPadId: string) => void,
    updateOutboundRtpPad?: (stats: SfuOutboundRtpPad) => void,
    removeSctpChannel?: (sctpStreamId: string) => void,
    updateSctpChannel?: (stats: SfuSctpChannel) => void,
}) {
    const errorHandler = (methodName: string) => {
        throw new Error(`${methodName} is called and handler has not been provided`);
    }
    const result: StatsWriter = {
        removeTransport: removeTransport ?? errorHandler("removeTransport"),
        updateTransport: updateTransport ?? errorHandler("updateTransport"),
        
        removeInboundRtpPad: removeInboundRtpPad ?? errorHandler("removeInboundRtpPad"),
        updateInboundRtpPad: updateInboundRtpPad ?? errorHandler("updateInboundRtpPad"),

        removeOutboundRtpPad: removeOutboundRtpPad ?? errorHandler("removeOutboundRtpPad"),
        updateOutboundRtpPad: updateOutboundRtpPad ?? errorHandler("updateOutboundRtpPad"),

        removeSctpChannel: removeSctpChannel ?? errorHandler("removeSctpChannel"),
        updateSctpChannel: updateSctpChannel ?? errorHandler("updateSctpChannel"),
    }
    return result;
}

const REMOVE_TRANSPORT_EVENT = "removeTransport";
const UPDATE_TRANSPORT_EVENT = "updateTransport";
const REMOVE_INBOUND_RTP_PAD_EVENT = "removeInboundRtpPad";
const UPDATE_INBOUND_RTP_PAD_EVENT = "updateInboundRtpPad";
const REMOVE_OUTBOUND_RTP_PAD_EVENT = "removeOutboundRtpPad";
const UPDATE_OUTBOUND_RTP_PAD_EVENT = "updateOutboundRtpPad";
const REMOVE_SCTP_CHANNEL_EVENT = "removeSctpChannel";
const UPDATE_SCTP_CHANNEL_EVENT = "updateSctpChannel";
const makeStatsEventer = (collector: MediasoupCollector) => {
    const emitter = new EventEmitter();
    const statsWriter = makeStatsWriter({
        removeTransport: (transportId: string) => {
            emitter.emit(REMOVE_TRANSPORT_EVENT, transportId);
        },
        updateTransport: (stats: SfuTransport) => {
            emitter.emit(UPDATE_TRANSPORT_EVENT, stats);
        },
        removeInboundRtpPad: (inboundRtpPadId: string) => {
            emitter.emit(REMOVE_INBOUND_RTP_PAD_EVENT, inboundRtpPadId);
        },
        updateInboundRtpPad: (stats: SfuInboundRtpPad) => {
            emitter.emit(UPDATE_INBOUND_RTP_PAD_EVENT, stats);
        },
        removeOutboundRtpPad: (outboundRtpPadId: string) => {
            emitter.emit(REMOVE_OUTBOUND_RTP_PAD_EVENT, outboundRtpPadId);
        },
        updateOutboundRtpPad: (stats: SfuOutboundRtpPad) => {
            emitter.emit(UPDATE_OUTBOUND_RTP_PAD_EVENT, stats);
        },
        removeSctpChannel: (sctpChannelId: string) => {
            emitter.emit(REMOVE_SCTP_CHANNEL_EVENT, sctpChannelId);
        },
        updateSctpChannel: (stats: SfuSctpChannel) => {
            emitter.emit(UPDATE_SCTP_CHANNEL_EVENT, stats);
        },
    });
    collector.setStatsWriter(statsWriter);
    return emitter;
}

describe("MediasoupCollector", () => {
    describe("Given a mediasoup collector a statsStorage, and a watched mediasoup transport", () => {
        const collector = MediasoupCollector.create();
        const transport = Generator.createWebRtcTransport();
        const emitter = makeStatsEventer(collector);
        collector.watchWebRtcTransport(transport);

        describe("When transport create a new producer", () => {
            const producer = transport.produce();
            it ("Then collector collect stats from it", done => {
                emitter.once(UPDATE_INBOUND_RTP_PAD_EVENT, async (actual: SfuInboundRtpPad) => {
                    const producerStats = (await producer.getStats())[0];
                    expect(actual.ssrc).toEqual(producerStats.ssrc);
                    expect(actual.streamId).toEqual(producer.id);
                    expect(actual.mediaType).toEqual(producer.kind);
                    expect(actual.transportId).toEqual(transport.id);
                    expect(!!actual.noReport).toEqual(false);
                    emitter.once(REMOVE_INBOUND_RTP_PAD_EVENT, (removedPadId: string) => {
                        expect(removedPadId).toBe(actual.padId);
                        done();
                    });
                    producer.close();
                })
                collector.collect();
            })
        });
        describe("When transport create a new consumer", () => {
            const consumer = transport.consume();
            it ("Then collector collect stats from it", done => {
                emitter.once(UPDATE_OUTBOUND_RTP_PAD_EVENT, async (actual: SfuOutboundRtpPad) => {
                    const consumerStats = (await consumer.getStats())[0];
                    expect(actual.ssrc).toEqual(consumerStats.ssrc);
                    expect(actual.sinkId).toEqual(consumer.id);
                    expect(actual.streamId).toEqual(consumer.producerId);
                    expect(actual.mediaType).toEqual(consumer.kind);
                    expect(actual.transportId).toEqual(transport.id);
                    expect(!!actual.noReport).toEqual(false);
                    emitter.once(REMOVE_OUTBOUND_RTP_PAD_EVENT, (removedPadId: string) => {
                        expect(removedPadId).toBe(actual.padId);
                        done();
                    });
                    consumer.close();
                });
                collector.collect();
            });
        });
        it ("When transport create a new dataProducer Then collector collect stats from it", done => {
            const dataProducer = transport.produceData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.channelId).toEqual(dataProducer.id);
                expect(actual.streamId).toEqual(dataProducer.id);
                expect(actual.transportId).toEqual(transport.id);
                expect(!!actual.noReport).toEqual(false);
                emitter.once(REMOVE_SCTP_CHANNEL_EVENT, (removedPadId: string) => {
                    expect(removedPadId).toBe(actual.channelId);
                    done();
                });
                dataProducer.close();
            });
            collector.collect();
        });
        it ("When transport create a new dataConsumer Then collector collect stats from it", done => {
            const dataConsumer = transport.consumeData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.channelId).toEqual(dataConsumer.id);
                expect(actual.streamId).toEqual(dataConsumer.dataProducerId);
                expect(actual.transportId).toEqual(transport.id);
                expect(actual.noReport).toEqual(undefined);
                emitter.once(REMOVE_SCTP_CHANNEL_EVENT, (removedChannelId: string) => {
                    expect(removedChannelId).toBe(actual.channelId);
                    done();
                });
                dataConsumer.close();
            });
            collector.collect();
        });
    });
    describe("Given a mediasoup collector a statsStorage, and a watched mediasoup, but not polled transport", () => {
        const collector = MediasoupCollector.create();
        const transport = Generator.createWebRtcTransport();
        const emitter = makeStatsEventer(collector);
        collector.watchWebRtcTransport(transport, { pollStats: false });

        describe("When transport create a new producer", () => {
            const producer = transport.produce();
            it ("Then collector collect stats with a noReport flag", done => {
                emitter.once(UPDATE_INBOUND_RTP_PAD_EVENT, async (actual: SfuInboundRtpPad) => {
                    expect(actual.noReport).toEqual(true);
                    producer.close();
                    done();
                })
                collector.collect();
            })
        });
        describe("When transport create a new consumer", () => {
            const consumer = transport.consume();
            it ("Then collector collect stats with a noReport flag", done => {
                emitter.once(UPDATE_OUTBOUND_RTP_PAD_EVENT, async (actual: SfuOutboundRtpPad) => {
                    expect(actual.noReport).toEqual(true);
                    consumer.close();
                    done();
                });
                collector.collect();
            });
        });
        it ("When transport create a new dataProducer Then collector collect stats from it", done => {
            const dataProducer = transport.produceData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.noReport).toEqual(true);
                dataProducer.close();
                done();
            });
            collector.collect();
        });
        it ("When transport create a new dataConsumer Then collector collect stats from it", done => {
            const dataConsumer = transport.consumeData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.noReport).toEqual(true);
                dataConsumer.close();
                done();
            });
            collector.collect();
        });
    });
});