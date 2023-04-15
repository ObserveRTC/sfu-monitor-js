import { StatsStorage } from "../../src/entries/StatsStorage";
import * as Generator from "../helpers/StatsGenerator";

describe("StatsStorage", () => {
    describe("Given a created StatsStorage and a transportStats", () => {
        const storage = new StatsStorage();
        const transportStats = Generator.createSfuTransport();
        describe("When updateTransport is called", () => {
            it("Then getNumberOfTransports() is 1", () => {
                storage.updateTransport(transportStats);

                expect(storage.getNumberOfTransports()).toBe(1);
            });
        });
        describe("When updateTransport and removeTransport are called", () => {
            it("Then getNumberOfTransports() is 0", () => {
                storage.updateTransport(transportStats);
                storage.clean();
                storage.clean();

                expect(storage.getNumberOfTransports()).toBe(0);
            });
        });

        describe("When updateTransport is called and then trim", () => {
            it("Then getNumberOfTransports() is 0", () => {
                storage.updateTransport(transportStats);
                storage.clean();
                storage.clean();

                expect(storage.getNumberOfTransports()).toBe(0);
            });
        });
    });
    describe("Given a created StatsStorage and a inboundRtpPadStats", () => {
        const storage = new StatsStorage();
        const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
        describe("When updateInboundRtpPad is called", () => {
            it("Then getNumberOfTransports() is 1", () => {
                storage.updateInboundRtpPad(inboundRtpPadStats);

                expect(storage.getNumberOfInboundRtpPads()).toBe(1);
            });
        });
        describe("When updateInboundRtpPad and removeInboundRtpPad are called", () => {
            it("Then getNumberOfInboundRtpPads() is 0", () => {
                storage.updateInboundRtpPad(inboundRtpPadStats);
                storage.clean();
                storage.clean();

                expect(storage.getNumberOfInboundRtpPads()).toBe(0);
            });
        });

        describe("When updateInboundRtpPad is called and then clean", () => {
            it("Then getNumberOfInboundRtpPads() is 0", () => {
                const expirationThresholdInMs = Date.now() + 5000;
                storage.updateInboundRtpPad(inboundRtpPadStats);
                storage.clean();
                storage.clean();

                expect(storage.getNumberOfInboundRtpPads()).toBe(0);
            });
        });
    });

    describe("Given a created StatsStorage and a outboundRtpPadStats", () => {
        const storage = new StatsStorage();
        const outboundRtpPadStats = Generator.createSfuOutboundRtpPad();
        describe("When updateOutboundRtpPad is called", () => {
            it("Then getNumberOfOutboundRtpPads() is 1", () => {
                storage.updateOutboundRtpPad(outboundRtpPadStats);

                expect(storage.getNumberOfOutboundRtpPads()).toBe(1);
            });
        });
        describe("When updateOutboundRtpPad and removeOutboundRtpPad are called", () => {
            it("Then getNumberOfOutboundRtpPads() is 0", () => {
                storage.updateOutboundRtpPad(outboundRtpPadStats);
                storage.clean();
                storage.clean();

                expect(storage.getNumberOfOutboundRtpPads()).toBe(0);
            });
        });
    });

    describe("Given a created StatsStorage and a sctpChannelStats", () => {
        const storage = new StatsStorage();
        const sctpChannelStats = Generator.createSfuSctpChannel();
        describe("When updateSctpChannel is called", () => {
            it("Then getNumberOfSctpChannels() is 1", () => {
                storage.updateSctpChannel(sctpChannelStats);

                expect(storage.getNumberOfSctpChannels()).toBe(1);
            });
        });
        describe("When updateSctpChannel and removeSctpChannel are called", () => {
            it("Then getNumberOfSctpChannels() is 0", () => {
                storage.updateSctpChannel(sctpChannelStats);
                storage.clean();
                storage.clean();

                expect(storage.getNumberOfSctpChannels()).toBe(0);
            });
        });
    });
    describe("Given an updated StatsStorage", () => {
        const storage = new StatsStorage();
        const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
        const outboundRtpPadStats = Generator.createSfuOutboundRtpPad({ mediaType: inboundRtpPadStats.mediaType });
        const sctpChannelStats = Generator.createSfuSctpChannel();
        const transportStats = Generator.createSfuTransport();
        storage.updateInboundRtpPad(inboundRtpPadStats);
        storage.updateOutboundRtpPad(outboundRtpPadStats);
        storage.updateSctpChannel(sctpChannelStats);
        storage.updateTransport(transportStats);
        describe("When transports are iterated", () => {
            const transport = Array.from(storage.transports())[0];
            it("Then transport.stats is equal to the given inboundRtpPadStats", () => {
                expect(transport.stats).toEqual(transportStats);
            });
            it("Then transport.inboundRtpPads().length is 1", () => {
                const inboundRtpPads = Array.from(transport.inboundRtpPads());
                expect(inboundRtpPads.length).toEqual(1);
            });
            it("Then transport.outboundRtpPads().length is 1", () => {
                const outboundRtpPads = Array.from(transport.outboundRtpPads());
                expect(outboundRtpPads.length).toEqual(1);
            });
            it("Then transport.sctpChannels().length is 1", () => {
                const sctpChannels = Array.from(transport.sctpChannels());
                expect(sctpChannels.length).toEqual(1);
            });
        });

        describe("When inboundRtpPads are iterated", () => {
            const inboundRtpPad = Array.from(storage.inboundRtpPads())[0];
            it("Then inboundRtpPad.stats is equal to the given inboundRtpPadStats", () => {
                expect(inboundRtpPad.stats).toEqual(inboundRtpPadStats);
            });
            it("Then inboundRtpPad.getTransport() is not undefined", () => {
                expect(inboundRtpPad.getTransport()).not.toEqual(undefined);
            });
        });
        describe("When outboundRtpPads are iterated", () => {
            const outboundRtpPad = Array.from(storage.outboundRtpPads())[0];
            it("Then outboundRtpPad.stats is equal to the given inboundRtpPadStats", () => {
                expect(outboundRtpPad.stats).toEqual(outboundRtpPadStats);
            });
            it("Then outboundRtpPad.getTransport() is not undefined", () => {
                expect(outboundRtpPad.getTransport()).not.toEqual(undefined);
            });
        });
        describe("When sctpChannels are iterated", () => {
            const sctpChannel = Array.from(storage.sctpChannels())[0];
            it("Then sctpChannel.stats is equal to the given sctpChannelsStats", () => {
                expect(sctpChannel.stats).toEqual(sctpChannelStats);
            });
            it("Then transport.getTransport() is not undefined", () => {
                expect(sctpChannel.getTransport()).not.toEqual(undefined);
            });
        });
        it("Then storage.getNumberOfTransports() is equal to 1", () => {
            expect(storage.getNumberOfTransports()).toEqual(1);
        });
        it("Then storage.getNumberOfInboundRtpPads() is equal to 1", () => {
            expect(storage.getNumberOfInboundRtpPads()).toEqual(1);
        });
        it("Then storage.getNumberOfOutboundRtpPads() is equal to 1", () => {
            expect(storage.getNumberOfOutboundRtpPads()).toEqual(1);
        });
        it("Then storage.getNumberOfSctpChannels() is equal to 1", () => {
            expect(storage.getNumberOfSctpChannels()).toEqual(1);
        });
    });

    describe("Given an updated StatsStorage to which elements are added and then cleaned", () => {
        const storage = new StatsStorage();
        const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
        const outboundRtpPadStats = Generator.createSfuOutboundRtpPad({ mediaType: inboundRtpPadStats.mediaType });
        const sctpChannelStats = Generator.createSfuSctpChannel();
        const transportStats = Generator.createSfuTransport();
        storage.updateInboundRtpPad(inboundRtpPadStats);
        storage.updateOutboundRtpPad(outboundRtpPadStats);
        storage.updateSctpChannel(sctpChannelStats);
        storage.updateTransport(transportStats);

        describe("When transports are iterated", () => {
            const transport = Array.from(storage.transports())[0];
            storage.clean();
            storage.clean();
            it("Then transport.inboundRtpPads().length is 0", () => {
                const inboundRtpPads = Array.from(transport.inboundRtpPads());
                expect(inboundRtpPads.length).toEqual(0);
            });
            it("Then transport.outboundRtpPads().length is 0", () => {
                const outboundRtpPads = Array.from(transport.outboundRtpPads());
                expect(outboundRtpPads.length).toEqual(0);
            });
            it("Then transport.sctpChannels().length is 0", () => {
                const sctpChannels = Array.from(transport.sctpChannels());
                expect(sctpChannels.length).toEqual(0);
            });
        });
    });
});
