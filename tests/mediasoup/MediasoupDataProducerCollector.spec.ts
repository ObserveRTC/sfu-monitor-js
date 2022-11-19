import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupDataProducerCollector, MediasoupDataProducerCollectorConfig } from "../../src/mediasoup/MediasoupDataProducerCollector";
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

describe("MediasoupDataProducerCollector", () => {
    describe("GetStats interaction tests", () => {
        const statsWriter = makeStatsWriterRelayer({
            updateSctpChannel: () => {},
            removeSctpChannel: () => {},
        });
        const setup = (config: MediasoupDataProducerCollectorConfig) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const dataProducer = transport.produceData();
            const collector = new MediasoupDataProducerCollector(
                collectors,
                dataProducer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                dataProducer,
                statsWriter,
            }
        }

        it("Given collector on dataProducer, collector.collect method invokes dataProducer getStats", (done) => {
            const config: MediasoupDataProducerCollectorConfig = {
                pollStats: () => true,
            }
            const { dataProducer, collector } = setup(config);
            const _getStats = dataProducer.getStats;
    
            dataProducer.getStats = async () => {
                done();
                return _getStats();
            }
            collector.collect();
        });
    
        it("Given collector on dataProducer, collector.collect method does not invoke dataProducer getStats because the pollStats method return false", async () => {
            const config: MediasoupDataProducerCollectorConfig = {
                pollStats: () => false,
            }
            const { dataProducer, collector } = setup(config);
            const _getStats = dataProducer.getStats;
            let invoked = false;
            dataProducer.getStats = async () => {
                invoked = true;
                return _getStats();
            }
            await collector.collect();
            expect(invoked).toBe(false);
        });
    });

    describe("statsWriter interaction tests", () => {
        const collectors = createCollectors();
        const setup = (config: MediasoupDataProducerCollectorConfig, statsWriter: StatsWriter) => {
            const transport = Generator.createWebRtcTransport();
            const dataProducer = transport.produceData();
            const collector = new MediasoupDataProducerCollector(
                collectors,
                dataProducer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                dataProducer,
                statsWriter,
            }
        }

        it("Given collector on dataProducer, collector.collect method update updateSctpChannel", done => {
            const config: MediasoupDataProducerCollectorConfig = {
                pollStats: () => true,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateSctpChannel: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on dataProducer, collector.collect method update updateSctpChannel even if pollStats is false", done => {
            const config: MediasoupDataProducerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateSctpChannel: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on dataProducer, removeSctpChannel is invoked if the collector is closed", done => {
            const config: MediasoupDataProducerCollectorConfig = {
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
            const dataProducer = transport.produceData();
            const collector = new MediasoupDataProducerCollector(
                collectors,
                dataProducer,
                transport.id,
                false,
            );
            collector.setStatsWriter(makeStatsWriterRelayer({
                updateSctpChannel: () => {},
                removeSctpChannel: () => {},
            }));
            return {
                collector,
                dataProducer,
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

        it("When dataProducer is closed, collector closes itself", done => {
            const parent = createCollectors(true);
            const { collector, dataProducer } = setup(parent);
            collector.close = () => done();
            dataProducer.close();
        });
    });
});
