import {
    SfuInboundRtpPad,
    SfuOutboundRtpPad,
    SfuSctpChannel,
    SfuTransport,
    W3CStats as W3C,
} from "@observertc/sample-schemas-js";
import { AuxCollector, AuxCollectorImpl } from "../src/AuxCollector";
import { StatsWriter } from "../src/entries/StatsStorage";
import { createSfuInboundRtpPad } from "./helpers/StatsGenerator";

describe("AuxCollector", () => {
    describe("Smoke Tests", () => {
        const makeCollector = ({
            updateInboundRtpPad,
            updateOutboundRtpPad,
            updateSctpChannel,
            updateTransport,
        }: {
            updateInboundRtpPad?: (stats: SfuInboundRtpPad) => void;
            updateOutboundRtpPad?: (stats: SfuOutboundRtpPad) => void;
            updateSctpChannel?: (stats: SfuSctpChannel) => void;
            updateTransport?: (stats: SfuTransport) => void;
        }) => {
            const defaultHandler = () => {
                throw new Error(`Unhandled listener is called`);
            };
            const statsWriter: StatsWriter = {
                updateInboundRtpPad: updateInboundRtpPad ?? defaultHandler,
                updateOutboundRtpPad: updateOutboundRtpPad ?? defaultHandler,
                updateSctpChannel: updateSctpChannel ?? defaultHandler,
                updateTransport: updateTransport ?? defaultHandler,
            };
            const collector = new class extends AuxCollectorImpl{
                protected onClose() {

                }
            }(statsWriter);
            return collector;
        };

        it("When inboundRtpPadStatsSupplier supplies inbound rtp pad Then collector collects it", async () => {
            const expected = createSfuInboundRtpPad();
            let actual;
            const collector = makeCollector({
                updateInboundRtpPad: (stats) => {
                    actual = stats;
                },
            });
            collector.addInboundRtpPadStatsSupplier(expected.padId, async () => expected);

            await Promise.all(collector.createFetchers().map(getpromise => getpromise()));

            expect(expected).toEqual(actual);
        });
    });

    describe("Error tests", () => {});
});
