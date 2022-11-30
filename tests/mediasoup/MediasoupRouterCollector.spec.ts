import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupRouterCollector, MediasoupRouterCollectorConfig } from "../../src/mediasoup/MediasoupRouterCollector";
import * as Generator from "../helpers/MediasoupTypesGenerator";
import { Collectors } from "../../src/Collectors";
import { Collector } from "../../src/Collector";
import { makeStatsWriterRelayer } from "../helpers/MediasoupTypesGenerator";


describe("MediasoupRouterCollector", () => {
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
            const statsWriter = makeStatsWriterRelayer({
                removeTransport: () => {}
            });
            const router = Generator.createRouter();
            const collector = new MediasoupRouterCollector(
                collectors,
                router,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                router,
                statsWriter,
            }
        }

        it("When Router make a WebRTC Transport Then a new collector is added to the parent collector", done => {
            const parent = createCollectors(done);
            const { router } = setup(parent);
            router.createWebRtcTransport();
        });

        it("When Router make a WebRTC Transport and close it Then a new collector is removed from the parent collector", done => {
            const parent = createCollectors(() => {}, done);
            const { router } = setup(parent);
            const transport = router.createWebRtcTransport();
            transport.close();
        });

        it("When Router make a Pipe Transport Then a new collector is added to the parent collector", done => {
            const parent = createCollectors(done);
            const { router } = setup(parent);
            router.createPipeTransport();
        });

        it("When Router make a Pipe Transport and close it Then a new collector is removed from the parent collector", done => {
            const parent = createCollectors(() => {}, done);
            const { router } = setup(parent);
            const transport = router.createPipeTransport();
            transport.close();
        });

        it("When Router make a Direct Transport Then a new collector is added to the parent collector", done => {
            const parent = createCollectors(done);
            const { router } = setup(parent);
            router.createDirectTransport();
        });

        it("When Router make a Direct Transport and close it Then a new collector is removed from the parent collector", done => {
            const parent = createCollectors(() => {}, done);
            const { router } = setup(parent);
            const transport = router.createDirectTransport();
            transport.close();
        });

        it("When Router make a Plain Rtp Transport Then a new collector is added to the parent collector", done => {
            const parent = createCollectors(done);
            const { router } = setup(parent);
            router.createPlainTransport();
        });

        it("When Router make a Plain Rtp Transport and close it Then a new collector is removed from the parent collector", done => {
            const parent = createCollectors(() => {}, done);
            const { router } = setup(parent);
            const transport = router.createPlainTransport();
            transport.close();
        });

    });
});
