import { StatsWriter } from "../../src/entries/StatsStorage";
import { MediasoupWorkerCollector, MediasoupWorkerCollectorConfig } from "../../src/mediasoup/MediasoupWorkerCollector";
import * as Generator from "../helpers/MediasoupTypesGenerator";
import { Collectors } from "../../src/Collectors";
import { Collector } from "../../src/Collector";
import { makeStatsWriterRelayer } from "../helpers/MediasoupTypesGenerator";


describe("MediasoupWorkerCollector", () => {
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
            const worker = Generator.createWorker();
            const collector = new MediasoupWorkerCollector(
                collectors,
                worker,
            );
            collector.setStatsWriter(statsWriter);
            return {
                collector,
                worker,
                statsWriter,
            }
        }

        it("When Worker make a Router Then a new collector is added to the parent collector", done => {
            const parent = createCollectors(done);
            const { worker } = setup(parent);
            worker.createRouter();
        });

        it("When Worker make a Router and close it Then a new collector is removed from the parent collector", done => {
            const parent = createCollectors(() => {}, done);
            const { worker } = setup(parent);
            const router = worker.createRouter();
            router.close();
        });
    });
});
