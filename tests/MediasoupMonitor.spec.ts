import { StatsWriter } from "../src/entries/StatsStorage";
import { MediasoupMonitor, MediasoupMonitorConfig } from "../src/MediasoupMonitor";
import * as Generator from "./helpers/MediasoupTypesGenerator";
import { Collectors } from "../src/Collectors";
import { Collector } from "../src/Collector";
import { makeStatsWriterRelayer } from "./helpers/MediasoupTypesGenerator";


describe("MediasoupCollector", () => {
    describe("media components are added and removed", () => {
        const setup = (addCb?: () => void, removeCb?: () => void) => {
            const mediasoup = Generator.createMediasoupSurrogate();
            const monitor = MediasoupMonitor.create({
                mediasoup
            });
            const _add = monitor.collectors.add.bind(monitor.collectors);
            monitor.collectors.add = (collector: Collector) => {
                addCb?.();
                return _add(collector);
            };
            const _remove = monitor.collectors.remove.bind(monitor.collectors);
            monitor.collectors.remove = (collectorId: string) => {
                removeCb?.();
                return _remove(collectorId);
            };
            return {
                monitor,
                mediasoup
            }
        }

        it("When Worker make a Router Then a new collector is added to the parent collector", done => {
            const { monitor, mediasoup } = setup(done);
            mediasoup.createWorker();
        });

        it("When Worker make a Router and close it Then a new collector is removed from the parent collector", done => {
            const { monitor, mediasoup } = setup(undefined, done);
            const worker = mediasoup.createWorker();
            worker.close();
        });
    });
});
