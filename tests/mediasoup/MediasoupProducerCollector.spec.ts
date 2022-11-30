import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupProducerCollector, MediasoupProducerCollectorConfig } from "../../src/mediasoup/MediasoupProducerCollector";
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

describe("MediasoupProducerCollector", () => {
    describe("GetStats interaction tests", () => {
        const statsWriter = makeStatsWriterRelayer({
            updateInboundRtpPad: () => {},
            removeInboundRtpPad: () => {},
        });
        const setup = (config: MediasoupProducerCollectorConfig) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const producer = transport.produce();
            const collector = new MediasoupProducerCollector(
                collectors,
                producer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                producer,
                statsWriter,
            }
        }

        it("Given collector on producer, collector.collect method invokes producer getStats", (done) => {
            const config: MediasoupProducerCollectorConfig = {
                pollStats: () => true,
            }
            const { producer, collector } = setup(config);
            const _getStats = producer.getStats;
    
            producer.getStats = async () => {
                done();
                return _getStats();
            }
            collector.collect();
        });
    
        it("Given collector on producer, collector.collect method does not invoke producer getStats because the pollStats method return false", async () => {
            const config: MediasoupProducerCollectorConfig = {
                pollStats: () => false,
            }
            const { producer, collector } = setup(config);
            const _getStats = producer.getStats;
            let invoked = false;
            producer.getStats = async () => {
                invoked = true;
                return _getStats();
            }
            await collector.collect();
            expect(invoked).toBe(false);
        });
    });

    describe("statsWriter interaction tests", () => {
        const collectors = createCollectors();
        const setup = (config: MediasoupProducerCollectorConfig, statsWriter: StatsWriter) => {
            const transport = Generator.createWebRtcTransport();
            const producer = transport.produce();
            const collector = new MediasoupProducerCollector(
                collectors,
                producer,
                transport.id,
                false,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                producer,
                statsWriter,
            }
        }

        it("Given collector on producer, collector.collect method update inboundRtpPad", done => {
            const config: MediasoupProducerCollectorConfig = {
                pollStats: () => true,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateInboundRtpPad: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on producer, collector.collect method update inboundRtpPad even if pollStats is false", done => {
            const config: MediasoupProducerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateInboundRtpPad: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on producer, removeInboundRtpPad is invoked if the collector is closed", done => {
            const config: MediasoupProducerCollectorConfig = {
                pollStats: () => false,
            }
            const statsWriter = makeStatsWriterRelayer({
                updateInboundRtpPad: () => {},
                removeInboundRtpPad: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });
    });

    describe("parent collectors tests", () => {
        const setup = (collectors: Collectors) => {
            const transport = Generator.createWebRtcTransport();
            const producer = transport.produce();
            const collector = new MediasoupProducerCollector(
                collectors,
                producer,
                transport.id,
                false,
            );
            collector.setStatsWriter(makeStatsWriterRelayer({
                updateInboundRtpPad: () => {},
                removeInboundRtpPad: () => {},
            }));
            return {
                collector,
                producer,
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

        it("When producer is closed, collector closes itself", done => {
            const parent = createCollectors(true);
            const { collector, producer } = setup(parent);
            collector.close = () => done();
            producer.close();
        });
    });
});
