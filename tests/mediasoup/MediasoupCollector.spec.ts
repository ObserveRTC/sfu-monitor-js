import { StatsStorage, StatsWriter } from "../../src/entries/StatsStorage";
import * as Generator from "../helpers/MediasoupTypesGenerator";
import { Collector } from "../../src/Collector";
import { MediasoupCollectorImpl } from '../../src/mediasoup/MediasoupCollector';
import { makeStatsWriterRelayer } from "../helpers/MediasoupTypesGenerator";


describe("MediasoupCollector", () => {
    describe("media components are added and removed", () => {
        const createCollector = (statsWriter: StatsWriter) => {
            return new class extends MediasoupCollectorImpl {
                protected onClose() {
                    
                }
            }({}, statsWriter);
        }
        

        it("When Worker make a Router Then a new collector is added to the parent collector", done => {
            const collector = createCollector(makeStatsWriterRelayer({
                updateInboundRtpPad: (stats) => {

                }
            }));
            const router = Generator.createRouter();
            // collector.addWorker()
            // const { worker } = setup(parent);
            // worker.createRouter();
            done();
        });

    });
});
