import { Sampler } from "../src/Sampler";
import { StatsReader, StatsStorage } from "../src/entries/StatsStorage";
import { v4 as uuidv4 } from "uuid";
import * as Generator from "./helpers/StatsGenerator";

const SFU_ID = uuidv4();
const makeStorage = () => {
    const storage = new StatsStorage();
    return storage;
};
const makeSampler = (statsProvider: StatsReader) => {
    const sampler = new Sampler(
        SFU_ID,
        statsProvider
    );
    return sampler;
};
describe("Sampler", () => {
    describe("Given sampler created with { incrementalSampling: false } ", () => {
        const makeStorageAndSampler = () => {
            const storage = makeStorage();
            const sampler = makeSampler(storage);
            return { storage, sampler };
        };
        it("When SfuSample is made Then sfuId is included", () => {
            const { sampler } = makeStorageAndSampler();
            const sample = sampler.make();

            expect(sample.sfuId).toBe(SFU_ID);
        });

        it("When inboundRtpPadStats is provided Then sample.inboundRtpPads have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
            storage.updateInboundRtpPad(inboundRtpPadStats);
            const sample = sampler.make();
            expect(sample.inboundRtpPads![0]).toEqual(inboundRtpPadStats);
        });
        it("When outboundRtpPadStats is provided Then sample.outboundRtpPads have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const outboundRtpPadStats = Generator.createSfuOutboundRtpPad();
            storage.updateOutboundRtpPad(outboundRtpPadStats);
            const sample = sampler.make();

            expect(sample.outboundRtpPads![0]).toEqual(outboundRtpPadStats);
        });
        it("When transportStats is provided Then sample.transports have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const transportStats = Generator.createSfuTransport();
            storage.updateTransport(transportStats);
            const sample = sampler.make();

            expect(sample.transports![0]).toEqual(transportStats);
        });
        it("When sctp is provided Then sample.sctpChannels have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const sctpChannelStats = Generator.createSfuSctpChannel();
            storage.updateSctpChannel(sctpChannelStats);
            const sample = sampler.make();

            expect(sample.sctpChannels![0]).toEqual(sctpChannelStats);
        });
    });
});
