import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupConsumerCollector, MediasoupConsumerCollectorConfig } from "../../src/mediasoup/MediasoupConsumerCollector";
import * as Generator from "../helpers/MediasoupTypesGenerator";
import { Collectors } from "../../src/Collectors";
import { Collector } from "../../src/Collector";
import { makeStatsWriterRelayer } from "../helpers/MediasoupTypesGenerator";


const createCollectors: (closed?: boolean) => Collectors = (closed = false) => {
    return {
        add: (collector: Collector) => {
            return false;
        },
        remove: (collectorId: string) => {
            return true;
        },
        [Symbol.iterator]: () => {
            return new Map().values();
        },
        closed,
    };
};

describe("MediasoupConsumerCollector", () => {
    describe("GetStats interaction tests", () => {
        const statsWriter = makeStatsWriterRelayer({
            updateOutboundRtpPad: () => {},
            removeOutboundRtpPad: () => {},
        });
        const setup = (config: MediasoupConsumerCollectorConfig) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const consumer = transport.consume();
            const collector = new MediasoupConsumerCollector(
                collectors,
                consumer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                consumer,
                statsWriter,
            }
        }

        it("Given collector on consumer, collector.collect method invokes consumer getStats", (done) => {
            const config: MediasoupConsumerCollectorConfig = {
                pollStats: () => true,
            }
            const { consumer, collector } = setup(config);
            const _getStats = consumer.getStats;
    
            consumer.getStats = async () => {
                done();
                return _getStats();
            }
            collector.collect();
        });
    
        it("Given collector on consumer, collector.collect method does not invoke consumer getStats because the pollStats method return false", async () => {
            const config: MediasoupConsumerCollectorConfig = {
                pollStats: () => false,
            }
            const { consumer, collector } = setup(config);
            const _getStats = consumer.getStats;
            let invoked = false;
            consumer.getStats = async () => {
                invoked = true;
                return _getStats();
            }
            await collector.collect();
            expect(invoked).toBe(false);
        });
    });

    describe("statsWriter interaction tests", () => {
        const collectors = createCollectors();
        const setup = (config: MediasoupConsumerCollectorConfig, statsWriter: StatsWriter) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const consumer = transport.consume();
            const collector = new MediasoupConsumerCollector(
                collectors,
                consumer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                consumer,
                statsWriter,
            }
        }

        it("Given collector on consumer, collector.collect method update outboundRtpPad", done => {
            const config: MediasoupConsumerCollectorConfig = {
                pollStats: () => true,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateOutboundRtpPad: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on producer, collector.collect method update inboundRtpPad even if pollStats is false", done => {
            const config: MediasoupConsumerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateOutboundRtpPad: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on producer, removeInboundRtpPad is invoked if the collector is closed", done => {
            const config: MediasoupConsumerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateOutboundRtpPad: () => {},
                removeOutboundRtpPad: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });
    });

    describe("parent collectors tests", () => {
        const setup = (collectors: Collectors) => {
            const transport = Generator.createWebRtcTransport();
            const consumer = transport.consume();
            const collector = new MediasoupConsumerCollector(
                collectors,
                consumer,
                transport.id,
                false,
            );
            collector.setStatsWriter(makeStatsWriterRelayer({
                updateOutboundRtpPad: () => {},
                removeOutboundRtpPad: () => {},
            }));
            return {
                collector,
                consumer,
            }
        }
        it("Parent collectors remove method is called when a child collector is closed", done => {
            const parent = createCollectors();
            const { collector } = setup(parent);
            parent.remove = () => done();
            collector.close();
        });

        it("When parent is closed the children will be closed after collect method", done => {
            const parent = createCollectors(true);
            const { collector } = setup(parent);
            collector.close = () => done();
            collector.collect();
        });

        it("When consumer is closed, collector closes itself", done => {
            const parent = createCollectors(true);
            const { collector, consumer } = setup(parent);
            collector.close = () => done();
            consumer.close();
        });
    });
});
