import { SfuInboundRtpPad, SfuOutboundRtpPad, SfuSctpChannel, SfuTransport } from "@observertc/schemas";
import EventEmitter from "events";
import { StatsStorage, StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupProducerCollector } from "../../src/mediasoup/MediasoupProducerCollector";
import { MediasoupCollector, MediasoupTransportWatchConfig } from "../../src/mediasoup/MediasoupCollector";
import * as Generator from "../helpers/MediasoupTypesGenerator";
import { Collectors } from "../../src/Collectors";
import { Collector } from "../../src/Collector";


const collectors: Collectors = {
    add: (collector: Collector) => {
        return false;
    },
    remove: (collectorId: string) => {
        return true;
    },
    [Symbol.iterator]: () => {

    },
    closed: false,
}
describe("MediasoupProducerCollector", () => {
    const transport = Generator.createWebRtcTransport();

    describe("Given a mediasoup producer collector, a statsStorage, and a watched mediasoup transport", () => {
        const producer = transport.produce();
        const collector = new MediasoupProducerCollector(
            collectors,
            producer,
            transport.id,
            false
        );
        const emitter = makeStatsEventer(collector);
        collector.watchWebRtcTransport(transport, {
            pollStats: true,
        });

        describe("When transport create a new producer", () => {
            const producer = transport.produce();
            it("Then collector collect stats from it", (done) => {
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
                });
                collector.collect();
            });
        });
        describe("When transport create a new consumer", () => {
            const consumer = transport.consume();
            it("Then collector collect stats from it", (done) => {
                emitter.once(UPDATE_OUTBOUND_RTP_PAD_EVENT, async (actual: SfuOutboundRtpPad) => {
                    const consumerStats = (await consumer.getStats()).filter(
                        (stats) => stats.type === "outbound-rtp"
                    )[0];
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
        it("When transport create a new dataProducer Then collector collect stats from it", (done) => {
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
        it("When transport create a new dataConsumer Then collector collect stats from it", (done) => {
            const dataConsumer = transport.consumeData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.channelId).toEqual(dataConsumer.id);
                expect(actual.streamId).toEqual(dataConsumer.dataProducerId);
                expect(actual.transportId).toEqual(transport.id);
                expect(actual.noReport).toEqual(false);
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
            it("Then collector collect stats with a noReport flag", (done) => {
                emitter.once(UPDATE_INBOUND_RTP_PAD_EVENT, async (actual: SfuInboundRtpPad) => {
                    expect(actual.noReport).toEqual(true);
                    producer.close();
                    done();
                });
                collector.collect();
            });
        });
        describe("When transport create a new consumer", () => {
            const consumer = transport.consume();
            it("Then collector collect stats with a noReport flag", (done) => {
                emitter.once(UPDATE_OUTBOUND_RTP_PAD_EVENT, async (actual: SfuOutboundRtpPad) => {
                    expect(actual.noReport).toEqual(true);
                    consumer.close();
                    done();
                });
                collector.collect();
            });
        });
        it("When transport create a new dataProducer Then collector collect stats from it", (done) => {
            const dataProducer = transport.produceData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.noReport).toEqual(true);
                dataProducer.close();
                done();
            });
            collector.collect();
        });
        it("When transport create a new dataConsumer Then collector collect stats from it", (done) => {
            const dataConsumer = transport.consumeData();
            emitter.once(UPDATE_SCTP_CHANNEL_EVENT, async (actual: SfuSctpChannel) => {
                expect(actual.noReport).toEqual(true);
                dataConsumer.close();
                done();
            });
            collector.collect();
        });
    });

    describe("Given a mediasoup collector a statsStorage, and a watched mediasoup, transport on which only slices of stats are polled", () => {
        type CollectConfig = MediasoupTransportWatchConfig;
        const collect = async (test: string, config: CollectConfig, numberOfCollecting?: number) => {
            const transport = Generator.createWebRtcTransport();
            const collector = MediasoupCollector.create();
            collector.watchWebRtcTransport(transport, config);
            let inboundRtpPadNoReport: boolean | undefined;
            let outboundRtpPadNoReport: boolean | undefined;
            let sctpChannelNoReport: boolean | undefined = true;
            let transportNoReport: boolean | undefined;
            const statsWriter = makeStatsWriter({
                updateInboundRtpPad: (inboundRtpPad) => {
                    inboundRtpPadNoReport = inboundRtpPad.noReport;
                },
                removeInboundRtpPad: () => {},
                updateOutboundRtpPad: (outboundRtpPad) => {
                    outboundRtpPadNoReport = outboundRtpPad.noReport;
                },
                removeOutboundRtpPad: () => {},
                updateSctpChannel: (sctpChannel) => {
                    sctpChannelNoReport = sctpChannelNoReport && sctpChannel.noReport;
                },
                removeSctpChannel: () => {},
                updateTransport: (transport) => {
                    transportNoReport = transport.noReport;
                },
                removeTransport: () => {},
            });
            collector.setStatsWriter(statsWriter);
            transport.produce();
            transport.consume();
            transport.produceData();
            transport.consumeData();
            if (numberOfCollecting) {
                for (let i = 0; i < numberOfCollecting; ++i) {
                    await collector.collect();
                }
            } else {
                await collector.collect();
            }
            const result = {
                inboundRtpPadNoReport,
                outboundRtpPadNoReport,
                sctpChannelNoReport,
                transportNoReport,
            };
            transport.close();
            collector.close();
            return result;
        };
        describe("When only Producer stats are polled", () => {
            const promise = collect("Producer", {
                pollProducerStats: true,
            });
            it("Then only inbound Rtp pad has reports", async () => {
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(false);
                expect(!!outboundRtpPadNoReport).toEqual(true);
                expect(!!sctpChannelNoReport).toEqual(true);
                expect(!!transportNoReport).toEqual(true);
            });
        });
        describe("When only Consumer stats are polled", () => {
            const promise = collect("Consumer", {
                pollConsumerStats: true,
            });
            it("Then only outbound Rtp pad has reports", async () => {
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
                expect(!!outboundRtpPadNoReport).toEqual(false);
                expect(!!sctpChannelNoReport).toEqual(true);
                expect(!!transportNoReport).toEqual(true);
            });
        });
        describe("When only DataConsumer stats are polled", () => {
            const promise = collect("DataConsumer", {
                pollDataConsumerStats: true,
            });
            it("Then only SctpChannel has reports", async () => {
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
                expect(!!outboundRtpPadNoReport).toEqual(true);
                expect(!!sctpChannelNoReport).toEqual(false);
                expect(!!transportNoReport).toEqual(true);
            });
        });
        describe("When only DataProducer are polled", () => {
            const promise = collect("DataProducer", {
                pollDataProducerStats: true,
            });
            it("Then only SctpChannel has reports", async () => {
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
                expect(!!outboundRtpPadNoReport).toEqual(true);
                expect(!!sctpChannelNoReport).toEqual(false);
                expect(!!transportNoReport).toEqual(true);
            });
        });
        describe("When only transport is polled", () => {
            const promise = collect("pollTransportStats", {
                pollTransportStats: true,
            });
            it("Then only transport has reports", async () => {
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
                expect(!!outboundRtpPadNoReport).toEqual(true);
                expect(!!sctpChannelNoReport).toEqual(true);
                expect(!!transportNoReport).toEqual(false);
            });
        });
        describe("When transport is polled only once", () => {
            it("Then at first transport has reports", async () => {
                const promise = collect("pollTransportStats", {
                    pollTransportStats: 1,
                });
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
                expect(!!outboundRtpPadNoReport).toEqual(true);
                expect(!!sctpChannelNoReport).toEqual(true);
                expect(!!transportNoReport).toEqual(false);
            });

            it("Then at second transport has no reports", async () => {
                const promise = collect(
                    "pollTransportStats",
                    {
                        pollTransportStats: 1,
                    },
                    2
                );
                const { inboundRtpPadNoReport, outboundRtpPadNoReport, sctpChannelNoReport, transportNoReport } =
                    await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
                expect(!!outboundRtpPadNoReport).toEqual(true);
                expect(!!sctpChannelNoReport).toEqual(true);
                expect(!!transportNoReport).toEqual(true);
            });
        });
    });

    describe("Given a mediasoup collector a statsStorage, and a watched mediasoup transport, producer and consumer is only polled when they are not paused", () => {
        type CollectConfig = MediasoupTransportWatchConfig;
        const collect = async (
            test: string,
            config: CollectConfig,
            pausedProducer?: boolean,
            pausedConsumer?: boolean
        ) => {
            const transport = Generator.createWebRtcTransport();
            const collector = MediasoupCollector.create();
            collector.watchWebRtcTransport(transport, config);
            let inboundRtpPadNoReport: boolean | undefined;
            let outboundRtpPadNoReport: boolean | undefined;
            const statsWriter = makeStatsWriter({
                updateInboundRtpPad: (inboundRtpPad) => {
                    inboundRtpPadNoReport = inboundRtpPad.noReport;
                },
                removeInboundRtpPad: () => {},
                updateOutboundRtpPad: (outboundRtpPad) => {
                    outboundRtpPadNoReport = outboundRtpPad.noReport;
                },
                removeOutboundRtpPad: () => {},
                updateTransport: () => {},
                removeTransport: () => {},
            });
            collector.setStatsWriter(statsWriter);
            const producer = transport.produce();
            const consumer = transport.consume();
            producer.paused = pausedProducer === true;
            consumer.paused = pausedConsumer === true;
            await collector.collect();
            const result = {
                inboundRtpPadNoReport,
                outboundRtpPadNoReport,
            };
            transport.close();
            collector.close();
            return result;
        };
        describe("When Producer is paused", () => {
            const promise = collect(
                "Producer",
                {
                    pollProducerStats: true,
                },
                true, // pausedProducer
                false // pausedConsumer
            );
            it("Then it does not reports", async () => {
                const { inboundRtpPadNoReport } = await promise;
                expect(!!inboundRtpPadNoReport).toEqual(true);
            });
        });
        describe("When Consumer is paused", () => {
            const promise = collect(
                "Producer",
                {
                    pollProducerStats: true,
                },
                false, // pausedProducer
                true // pausedConsumer
            );
            it("Then it does not reports", async () => {
                const { outboundRtpPadNoReport } = await promise;
                expect(!!outboundRtpPadNoReport).toEqual(true);
            });
        });
    });
    describe("Given a mediasoup collector", () => {
        const makeTransport = () => {
            const transport = Generator.createWebRtcTransport();
            const collector = MediasoupCollector.create();
            collector.watchWebRtcTransport(transport, {
                pollStats: true,
            });
            const statsStorage = new StatsStorage();
            collector.setStatsWriter(statsStorage);
            return { transport, collector, statsStorage };
        };
        const { transport, collector, statsStorage } = makeTransport();
        const producerPromise = new Promise<Generator.ProvidedProducer>((resolve) => {
            it("When Transport add a producer Then the number of inbound rtp is 1", async () => {
                const result = transport.produce();
                await collector.collect();
                expect(statsStorage.getNumberOfInboundRtpPads()).toBe(1);
                resolve(result);
            });
        });
        const consumerPromise = new Promise<Generator.ProvidedConsumer>((resolve) => {
            it("When producer is closed and consumer is requested Then the number of inbound rtp pad is 0 and the number of outbound rtp pad is 1", async () => {
                const producer = await producerPromise;
                const consumer = transport.consume();
                producer.close();
                expect(statsStorage.getNumberOfInboundRtpPads()).toBe(0);
                await collector.collect();
                expect(statsStorage.getNumberOfOutboundRtpPads()).toBe(1);
                resolve(consumer);
            });
        });
        const dataConsumerPromise = new Promise<Generator.ProvidedDataConsumer>((resolve) => {
            it("When consumer is closed and dataconsumer is requested Then the number of outbound rtp pad is 0 and the number of sctp channel is 1", async () => {
                const consumer = await consumerPromise;
                const dataConsumer = transport.consumeData();
                consumer.close();
                expect(statsStorage.getNumberOfOutboundRtpPads()).toBe(0);
                await collector.collect();
                expect(statsStorage.getNumberOfSctpChannels()).toBe(1);
                resolve(dataConsumer);
            });
        });
        const dataProducerPromise = new Promise<Generator.ProvidedDataProducer>((resolve) => {
            it("When data consumer is requested Then the number of sctp channel is 0", async () => {
                const dataConsumer = await dataConsumerPromise;
                dataConsumer.close();
                expect(statsStorage.getNumberOfSctpChannels()).toBe(0);
                await collector.collect();
                const dataProducer = transport.produceData();
                resolve(dataProducer);
            });
        });
        it("When data producer is requested Then the number of inbound rtp pad is 1 and when its closed the number is 0", async () => {
            const dataProducer = await dataProducerPromise;
            await collector.collect();
            expect(statsStorage.getNumberOfSctpChannels()).toBe(1);
            dataProducer.close();
            await collector.collect();
            expect(statsStorage.getNumberOfSctpChannels()).toBe(0);
        });
    });
});
