import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupDataConsumerCollector, MediasoupDataConsumerCollectorConfig } from "../../src/mediasoup/MediasoupDataConsumerCollector";
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

describe("MediasoupDataConsumerCollector", () => {
    describe("GetStats interaction tests", () => {
        const statsWriter = makeStatsWriterRelayer({
            updateSctpChannel: () => {},
            removeSctpChannel: () => {},
        });
        const setup = (config: MediasoupDataConsumerCollectorConfig) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const dataConsumer = transport.consumeData();
            const collector = new MediasoupDataConsumerCollector(
                collectors,
                dataConsumer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                dataConsumer,
                statsWriter,
            }
        }

        it("Given collector on dataConsumer, collector.collect method invokes dataConsumer getStats", (done) => {
            const config: MediasoupDataConsumerCollectorConfig = {
                pollStats: () => true,
            }
            const { dataConsumer, collector } = setup(config);
            const _getStats = dataConsumer.getStats;
    
            dataConsumer.getStats = async () => {
                done();
                return _getStats();
            }
            collector.collect();
        });
    
        it("Given collector on dataConsumer, collector.collect method does not invoke dataConsumer getStats because the pollStats method return false", async () => {
            const config: MediasoupDataConsumerCollectorConfig = {
                pollStats: () => false,
            }
            const { dataConsumer, collector } = setup(config);
            const _getStats = dataConsumer.getStats;
            let invoked = false;
            dataConsumer.getStats = async () => {
                invoked = true;
                return _getStats();
            }
            await collector.collect();
            expect(invoked).toBe(false);
        });
    });

    describe("statsWriter interaction tests", () => {
        const collectors = createCollectors();
        const setup = (config: MediasoupDataConsumerCollectorConfig, statsWriter: StatsWriter) => {
            const transport = Generator.createWebRtcTransport();
            const dataConsumer = transport.consumeData();
            const collector = new MediasoupDataConsumerCollector(
                collectors,
                dataConsumer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                dataConsumer,
                statsWriter,
            }
        }

        it("Given collector on dataConsumer, collector.collect method update updateSctpChannel", done => {
            const config: MediasoupDataConsumerCollectorConfig = {
                pollStats: () => true,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateSctpChannel: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on dataConsumer, collector.collect method update updateSctpChannel even if pollStats is false", done => {
            const config: MediasoupDataConsumerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateSctpChannel: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on dataConsumer, removeSctpChannel is invoked if the collector is closed", done => {
            const config: MediasoupDataConsumerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateSctpChannel: () => {},
                removeSctpChannel: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });
    });

    describe("parent collectors tests", () => {
        const setup = (collectors: Collectors) => {
            const transport = Generator.createWebRtcTransport();
            const dataConsumer = transport.consumeData();
            const collector = new MediasoupDataConsumerCollector(
                collectors,
                dataConsumer,
                transport.id,
                false,
            );
            collector.setStatsWriter(makeStatsWriterRelayer({
                updateSctpChannel: () => {},
                removeSctpChannel: () => {},
            }));
            return {
                collector,
                dataConsumer,
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

        it("When dataConsumer is closed, collector closes itself", done => {
            const parent = createCollectors(true);
            const { collector, dataConsumer } = setup(parent);
            collector.close = () => done();
            dataConsumer.close();
        });
    });
});
