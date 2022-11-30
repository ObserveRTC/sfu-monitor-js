import { Sampler, SamplerConfig } from "../src/Sampler";
import { StatsReader, StatsStorage } from "../src/entries/StatsStorage";
import { v4 as uuidv4 } from "uuid";
import * as Generator from "./helpers/StatsGenerator";

const SFU_ID = uuidv4();
const makeStorage = () => {
    const storage = new StatsStorage();
    return storage;
};
const makeSampler = (config: SamplerConfig, statsProvider: StatsReader) => {
    const sampler = Sampler.create(config);
    sampler.statsProvider = statsProvider;
    return sampler;
};
describe("Sampler", () => {
    describe("Given sampler created with { incrementalSampling: false } ", () => {
        const makeStorageAndSampler = () => {
            const storage = makeStorage();
            const config: SamplerConfig = {
                sfuId: SFU_ID,
                incrementalSampling: false,
            };
            const sampler = makeSampler(config, storage);
            sampler.statsProvider = storage;
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

    describe("Given Sampler created with { incrementalSampling: true } ", () => {
        const makeStorageAndSampler = () => {
            const storage = makeStorage();
            const config: SamplerConfig = {
                sfuId: SFU_ID,
                incrementalSampling: true,
            };
            const sampler = makeSampler(config, storage);
            sampler.statsProvider = storage;
            return { storage, sampler };
        };
        it("When inboundRtpPadStats is provided The second sample does not have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
            storage.updateInboundRtpPad(inboundRtpPadStats);
            sampler.make();
            const sample = sampler.make();

            expect(sample.inboundRtpPads).toEqual(undefined);
        });
        it("When outboundRtpPadStats is provided Then sample.outboundRtpPads have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const outboundRtpPadStats = Generator.createSfuOutboundRtpPad();
            storage.updateOutboundRtpPad(outboundRtpPadStats);
            sampler.make();
            const sample = sampler.make();

            expect(sample.outboundRtpPads).toEqual(undefined);
        });
        it("When transportStats is provided Then sample.transports have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const transportStats = Generator.createSfuTransport();
            storage.updateTransport(transportStats);
            sampler.make();
            const sample = sampler.make();

            expect(sample.transports).toEqual(undefined);
        });
        it("When sctp is provided Then sample.sctpChannels have it", () => {
            const { sampler, storage } = makeStorageAndSampler();
            const sctpChannelStats = Generator.createSfuSctpChannel();
            storage.updateSctpChannel(sctpChannelStats);
            sampler.make();
            const sample = sampler.make();

            expect(sample.sctpChannels).toEqual(undefined);
        });
    });
});
