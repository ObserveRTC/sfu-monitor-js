import {
    SfuInboundRtpPad,
    SfuOutboundRtpPad,
    SfuSctpChannel,
    SfuTransport,
    W3CStats as W3C,
} from "@observertc/schemas";
import { AuxCollector } from "../src/AuxCollector";
import { StatsWriter } from "../src/entries/StatsStorage";
import { createSfuInboundRtpPad } from "./helpers/StatsGenerator";

describe("AuxCollector", () => {
    describe("Smoke Tests", () => {
        const makeCollector = ({
            updateInboundRtpPad,
            updateOutboundRtpPad,
            updateSctpChannel,
            updateTransport,
            removeInboundRtpPad,
            removeOutboundRtpPad,
            removeSctpChannel,
            removeTransport,
        }: {
            updateInboundRtpPad?: (stats: SfuInboundRtpPad) => void;
            updateOutboundRtpPad?: (stats: SfuOutboundRtpPad) => void;
            updateSctpChannel?: (stats: SfuSctpChannel) => void;
            updateTransport?: (stats: SfuTransport) => void;
            removeInboundRtpPad?: (id: string) => void;
            removeOutboundRtpPad?: (id: string) => void;
            removeSctpChannel?: (id: string) => void;
            removeTransport?: (id: string) => void;
        }) => {
            const collector = AuxCollector.create();
            const defaultHandler = () => {
                throw new Error(`Unhandled listener is called`);
            };
            const statsWriter: StatsWriter = {
                updateInboundRtpPad: updateInboundRtpPad ?? defaultHandler,
                updateOutboundRtpPad: updateOutboundRtpPad ?? defaultHandler,
                updateSctpChannel: updateSctpChannel ?? defaultHandler,
                updateTransport: updateTransport ?? defaultHandler,
                removeInboundRtpPad: removeInboundRtpPad ?? defaultHandler,
                removeOutboundRtpPad: removeOutboundRtpPad ?? defaultHandler,
                removeSctpChannel: removeSctpChannel ?? defaultHandler,
                removeTransport: removeTransport ?? defaultHandler,
            };
            collector.setStatsWriter(statsWriter);
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

            await collector.collect();

            expect(expected).toEqual(actual);
        });
    });

    describe("Error tests", () => {});
});
