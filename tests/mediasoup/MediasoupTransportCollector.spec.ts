import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupTransportCollector, MediasoupTransportCollectorConfig } from "../../src/mediasoup/MediasoupTransportCollector";
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

describe("MediasoupTransportCollector", () => {
    describe("GetStats interaction tests when pollStats is true", () => {
        const statsWriter = makeStatsWriterRelayer({
            updateTransport: () => {},
            removeTransport: () => {},
        });
        const setup = (config: MediasoupTransportCollectorConfig, done: () => void) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const collector = new MediasoupTransportCollector(
                collectors,
                transport,
                config,
            );
            collector.setStatsWriter(statsWriter);
            const _getStats = transport.getStats;
    
            transport.getStats = async () => {
                done();
                return _getStats();
            }
            return {
                collector,
                transport,
                statsWriter,
            }
        }

        it("Given collector on webrtc-transport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => true,
                transportType: "webrtc-transport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on WebRTCTransport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => true,
                transportType: "WebRtcTransport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on plain-rtp-transport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => true,
                transportType: "plain-rtp-transport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on PlainTransport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => true,
                transportType: "PlainTransport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on direct-transport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollDirectTransportStats: () => true,
                transportType: "direct-transport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on DirectTransport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollDirectTransportStats: () => true,
                transportType: "DirectTransport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on pipe-transport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollPipeTransportStats: () => true,
                transportType: "pipe-transport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });

        it("Given collector on PipeTransport, collector.collect method invokes getStats", (done) => {
            const config: MediasoupTransportCollectorConfig = {
                pollPipeTransportStats: () => true,
                transportType: "PipeTransport"
            }
            const { collector } = setup(config, done);
            
            collector.collect();
        });
    });


    describe("GetStats interaction tests when pollStats is false", () => {
        const statsWriter = makeStatsWriterRelayer({
            updateTransport: () => {},
            removeTransport: () => {},
        });
        const setup = (config: MediasoupTransportCollectorConfig, invokedHolder: any) => {
            const collectors = createCollectors();
            const transport = Generator.createWebRtcTransport();
            const collector = new MediasoupTransportCollector(
                collectors,
                transport,
                config,
            );
            collector.setStatsWriter(statsWriter);
            const _getStats = transport.getStats;
    
            transport.getStats = async () => {
                invokedHolder.invoked = true;
                return _getStats();
            }
            return {
                collector,
                transport,
                statsWriter,
            }
        }

        it("Given collector on webrtc-transport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "webrtc-transport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on WebRTCTransport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "WebRtcTransport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on plain-rtp-transport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => false,
                transportType: "plain-rtp-transport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on PlainTransport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => false,
                transportType: "PlainTransport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on direct-transport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => false,
                transportType: "direct-transport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on DirectTransport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => false,
                transportType: "DirectTransport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on pipe-transport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => false,
                transportType: "pipe-transport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });

        it("Given collector on PipeTransport, collector.collect method invokes getStats", async () => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => false,
                transportType: "PipeTransport"
            }
            const invokeHolder = { invoked: false };
            const { collector } = setup(config, invokeHolder);
            
            await collector.collect();
            expect(invokeHolder.invoked).toBe(false);
        });
    });

    describe("statsWriter interaction tests", () => {
        const collectors = createCollectors();
        const setup = (config: MediasoupTransportCollectorConfig, statsWriter: StatsWriter) => {
            const transport = Generator.createWebRtcTransport();
            const collector = new MediasoupTransportCollector(
                collectors,
                transport,
                config,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                transport,
                statsWriter,
            }
        }

        it("Given collector on transport (webrtc-transport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => true,
                transportType: "webrtc-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (WebRtcTransport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => true,
                transportType: "WebRtcTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (plain-rtp-transport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => true,
                transportType: "plain-rtp-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (PlainTransport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollPlainRtpTransportStats: () => true,
                transportType: "PlainTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (direct-transport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollDirectTransportStats: () => true,
                transportType: "direct-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (DirectTransport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollDirectTransportStats: () => true,
                transportType: "DirectTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (pipe-transport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollPipeTransportStats: () => true,
                transportType: "pipe-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (PipeTransport), collector.collect method update transport", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollPipeTransportStats: () => true,
                transportType: "PipeTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect();
        });

        it("Given collector on transport (webrtc-transport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "webrtc-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (WebRtcTransport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "WebRtcTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (plain-rtp-transport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "plain-rtp-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (PlainTransport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "PlainTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (direct-transport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "direct-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (DirectTransport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollDirectTransportStats: () => false,
                transportType: "DirectTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (pipe-transport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "pipe-transport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });

        it("Given collector on transport (PipeTransport), removeTransport is invoked if the collector is closed", done => {
            const config: MediasoupTransportCollectorConfig = {
                pollWebRtcTransportStats: () => false,
                transportType: "PipeTransport",
            }
            const statsWriter = makeStatsWriterRelayer({
                updateTransport: () => {},
                removeTransport: () => done(),
            });
            const { collector } = setup(config, statsWriter);
            collector.collect().then(() => collector.close());
        });
    });

    describe("parent collectors tests", () => {
        const setup = (collectors: Collectors) => {
            const transport = Generator.createWebRtcTransport();
            const collector = new MediasoupTransportCollector(
                collectors,
                transport,
                {
                    pollWebRtcTransportStats: () => true,
                    transportType: "webrtc-transport",
                },
            );
            return {
                collector,
                transport,
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

        it("When transport is closed, collector closes itself", done => {
            const parent = createCollectors(true);
            const { collector, transport } = setup(parent);
            collector.close = () => done();
            transport.close();
        });
    });

    describe("media components are added and removed", () => {
        const createCollectors = (add: () => void, remove?: () => void) => {
            return {
                add: (collector: Collector) => {
                    add();
                    return false;
                },
                remove: (collectorId: string) => {
                    remove?.();
                    return true;
                },
                [Symbol.iterator]: () => {
                    return new Map().values();
                },
                closed: false,
            }
        };
        const setup = (collectors: Collectors) => {
            const transport = Generator.createWebRtcTransport();
            const statsWriter = makeStatsWriterRelayer({
                removeSctpChannel: () => {},
            });
            const collector = new MediasoupTransportCollector(
                collectors,
                transport,
                {
                    transportType: "webrtc-transport"
                },
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                transport,
                statsWriter,
            }
        }

        it("When transport make a new producer Then new collector as added", done => {
            const parent = createCollectors(done);
            const { transport } = setup(parent);
            transport.produce();
        });

        it("When transport make a new producer and then close it collector is removed", done => {
            const parent = createCollectors(() => {}, done);
            const { transport } = setup(parent);
            const producer = transport.produce();
            producer.close();
        });

        it("When transport make a new consumer Then new collector as added", done => {
            const parent = createCollectors(done);
            const { transport } = setup(parent);
            transport.consume();
        });

        it("When transport make a new consumer and then close it collector is removed", done => {
            const parent = createCollectors(() => {}, done);
            const { transport } = setup(parent);
            const consumer = transport.consume();
            consumer.close();
        });

        it("When transport make a new dataProducer Then new collector as added", done => {
            const parent = createCollectors(done);
            const { transport } = setup(parent);
            transport.produceData();
        });

        it("When transport make a new dataProducer and then close it collector is removed", done => {
            const parent = createCollectors(() => {}, done);
            const { transport } = setup(parent);
            const dataProducer = transport.produceData();
            dataProducer.close();
        });

        it("When transport make a new dataConsumer Then new collector as added", done => {
            const parent = createCollectors(done);
            const { transport } = setup(parent);
            transport.consumeData();
        });

        it("When transport make a new dataConsumer and then close it collector is removed", done => {
            const parent = createCollectors(() => {}, done);
            const { transport } = setup(parent);
            const dataConsumer = transport.consumeData();
            dataConsumer.close();
        });
    });
});
