import { StatsStorage } from "../../src/entries/StatsStorage";
import * as Generator from "../helpers/StatsGenerator";

describe("StatsStorage", () => {
    describe("Given a created StatsStorage and a transportStats", () => {
        const storage = new StatsStorage();
        const transportStats = Generator.createSfuTransport();
        describe("When updateTransport is called", () => {
            it ("Then getNumberOfTransports() is 1", () => {
                storage.updateTransport(transportStats);

                expect(storage.getNumberOfTransports()).toBe(1);
            });
        });
        describe("When updateTransport and removeTransport are called", () => {
            it ("Then getNumberOfTransports() is 0", () => {
                storage.updateTransport(transportStats);
                storage.removeTransport(transportStats.transportId);

                expect(storage.getNumberOfTransports()).toBe(0);
            });
        });

        describe("When updateTransport is called and then trim", () => {
            it ("Then getNumberOfTransports() is 0", () => {
                const expirationThresholdInMs = Date.now() + 5000;
                storage.updateTransport(transportStats);
                storage.trim(expirationThresholdInMs);

                expect(storage.getNumberOfTransports()).toBe(0);
            });
        });
        describe("When updateTransport is calledwith the same stats but different time", () => {
            it ("Then getNumberOfTransports() is 0", async () => {
                storage.updateTransport(transportStats);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        storage.updateTransport(transportStats);
                        resolve();
                    }, 1000);
                });
                
                const transport = Array.from(storage.transports())[0];

                expect(transport.touched).not.toEqual(transport.updated);
                expect(transport.updated).toEqual(transport.created);
            });
        });
    });
    describe("Given a created StatsStorage and a inboundRtpPadStats", () => {
        const storage = new StatsStorage();
        const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
        describe("When updateInboundRtpPad is called", () => {
            it ("Then getNumberOfTransports() is 1", () => {
                storage.updateInboundRtpPad(inboundRtpPadStats);

                expect(storage.getNumberOfInboundRtpPads()).toBe(1);
            });
        });
        describe("When updateInboundRtpPad and removeInboundRtpPad are called", () => {
            it ("Then getNumberOfInboundRtpPads() is 0", () => {
                storage.updateInboundRtpPad(inboundRtpPadStats);
                storage.removeInboundRtpPad(inboundRtpPadStats.padId);

                expect(storage.getNumberOfInboundRtpPads()).toBe(0);
            });
        });

        describe("When updateInboundRtpPad is called and then trim", () => {
            it ("Then getNumberOfInboundRtpPads() is 0", () => {
                const expirationThresholdInMs = Date.now() + 5000;
                storage.updateInboundRtpPad(inboundRtpPadStats);
                storage.trim(expirationThresholdInMs);

                expect(storage.getNumberOfInboundRtpPads()).toBe(0);
            });
        });
        describe("When updateInboundRtpPad is calledwith the same stats but different time", () => {
            it ("Then getNumberOfTransports() is 0", async () => {
                storage.updateInboundRtpPad(inboundRtpPadStats);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        storage.updateInboundRtpPad(inboundRtpPadStats);
                        resolve();
                    }, 1000);
                });
                
                const inboundRtpPad = Array.from(storage.inboundRtpPads())[0];

                expect(inboundRtpPad.touched).not.toEqual(inboundRtpPad.updated);
                expect(inboundRtpPad.updated).toEqual(inboundRtpPad.created);
            });
        });
    });

    describe("Given a created StatsStorage and a outboundRtpPadStats", () => {
        const storage = new StatsStorage();
        const outboundRtpPadStats = Generator.createSfuOutboundRtpPad();
        describe("When updateOutboundRtpPad is called", () => {
            it ("Then getNumberOfOutboundRtpPads() is 1", () => {
                storage.updateOutboundRtpPad(outboundRtpPadStats);

                expect(storage.getNumberOfOutboundRtpPads()).toBe(1);
            });
        });
        describe("When updateOutboundRtpPad and removeOutboundRtpPad are called", () => {
            it ("Then getNumberOfOutboundRtpPads() is 0", () => {
                storage.updateOutboundRtpPad(outboundRtpPadStats);
                storage.removeOutboundRtpPad(outboundRtpPadStats.padId);

                expect(storage.getNumberOfOutboundRtpPads()).toBe(0);
            });
        });

        describe("When updateOutboundRtpPad is called and then trim", () => {
            it ("Then getNumberOfOutboundRtpPads() is 0", () => {
                const expirationThresholdInMs = Date.now() + 5000;
                storage.updateOutboundRtpPad(outboundRtpPadStats);
                storage.trim(expirationThresholdInMs);

                expect(storage.getNumberOfOutboundRtpPads()).toBe(0);
            });
        });
        describe("When updateOutboundRtpPad is calledwith the same stats but different time", () => {
            it ("Then getNumberOfTransports() is 0", async () => {
                storage.updateOutboundRtpPad(outboundRtpPadStats);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        storage.updateOutboundRtpPad(outboundRtpPadStats);
                        resolve();
                    }, 1000);
                });
                
                const outboundRtpPad = Array.from(storage.outboundRtpPads())[0];

                expect(outboundRtpPad.touched).not.toEqual(outboundRtpPad.updated);
                expect(outboundRtpPad.updated).toEqual(outboundRtpPad.created);
            });
        });
    });

    describe("Given a created StatsStorage and a sctpChannelStats", () => {
        const storage = new StatsStorage();
        const sctpChannelStats = Generator.createSfuSctpChannel();
        describe("When updateSctpChannel is called", () => {
            it ("Then getNumberOfSctpChannels() is 1", () => {
                storage.updateSctpChannel(sctpChannelStats);

                expect(storage.getNumberOfSctpChannels()).toBe(1);
            });
        });
        describe("When updateSctpChannel and removeSctpChannel are called", () => {
            it ("Then getNumberOfSctpChannels() is 0", () => {
                storage.updateSctpChannel(sctpChannelStats);
                storage.removeSctpChannel(sctpChannelStats.channelId);

                expect(storage.getNumberOfSctpChannels()).toBe(0);
            });
        });

        describe("When updateOutboundRtpPad is called and then trim", () => {
            it ("Then getNumberOfSctpChannels() is 0", () => {
                const expirationThresholdInMs = Date.now() + 5000;
                storage.updateSctpChannel(sctpChannelStats);
                storage.trim(expirationThresholdInMs);

                expect(storage.getNumberOfSctpChannels()).toBe(0);
            });
        });
        describe("When updateSctpChannel is calledwith the same stats but different time", () => {
            it ("Then getNumberOfSctpChannels() is 0", async () => {
                storage.updateSctpChannel(sctpChannelStats);
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        storage.updateSctpChannel(sctpChannelStats);
                        resolve();
                    }, 1000);
                });
                
                const sctpChannel = Array.from(storage.sctpChannels())[0];

                expect(sctpChannel.touched).not.toEqual(sctpChannel.updated);
                expect(sctpChannel.updated).toEqual(sctpChannel.created);
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
            it("Then transport.mediaSinks().length is 1", () => {
                const mediaSinks = Array.from(transport.mediaSinks());
                expect(mediaSinks.length).toEqual(1);
            });
            it("Then transport.mediaStreams().length is 1", () => {
                const mediaStreams = Array.from(transport.mediaStreams());
                expect(mediaStreams.length).toEqual(1);
            });
            it("Then transport.getNumberOfInboundRtpPads() is 1", () => {
                expect(transport.getNumberOfInboundRtpPads()).toEqual(1);
            });
            it("Then transport.getNumberOfOutboundRtpPads() is 1", () => {
                expect(transport.getNumberOfOutboundRtpPads()).toEqual(1);
            });
            it("Then transport.getNumberOfSctpChannels() is 1", () => {
                expect(transport.getNumberOfSctpChannels()).toEqual(1);
            });
            it("Then transport.getNumberOfMediaStreams() is 1", () => {
                expect(transport.getNumberOfMediaStreams()).toEqual(1);
            });
            it("Then transport.getNumberOfMediaSinks() is 1", () => {
                expect(transport.getNumberOfMediaSinks()).toEqual(1);
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
            it("Then inboundRtpPad.getMediaStream() is not undefined", () => {
                expect(inboundRtpPad.getMediaStream()).not.toEqual(undefined);
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
            it("Then outboundRtpPad.getMediaStream() is not undefined", () => {
                expect(outboundRtpPad.getMediaStream()).not.toEqual(undefined);
            });
        });
        describe("When mediaStreams are iterated", () => {
            const mediaStream = Array.from(storage.mediaStreams())[0];
            it("Then mediaStream.id is equal to inboundRtpPadStats.streamId and outboundRtpPadStats.streamId", () => {
                expect(mediaStream.id).toEqual(inboundRtpPadStats.streamId);
                expect(mediaStream.id).toEqual(outboundRtpPadStats.streamId);
            });
            it("Then mediaStream.kind is equal to inboundRtpPadStats.mediaType and outboundRtpPadStats.mediaType", () => {
                expect(mediaStream.kind).toEqual(inboundRtpPadStats.mediaType);
                expect(mediaStream.kind).toEqual(outboundRtpPadStats.mediaType);
            });
            it("Then mediaStream.inboundRtpPads().length is equal to 1", () => {
                const inboundRtpPads = Array.from(mediaStream.inboundRtpPads());
                expect(inboundRtpPads.length).toEqual(1);
            });
            it("Then mediaStream.mediaSinks().length is equal to 1", () => {
                const mediaSinks = Array.from(mediaStream.mediaSinks());
                expect(mediaSinks.length).toEqual(1);
            });
            it("Then mediaStream.getTransport().length is equal to 1", () => {
                expect(mediaStream.getTransport()).not.toEqual(undefined);
            });
            it("Then mediaStream.getNumberOfInboundRtpPads() is equal to 1", () => {
                expect(mediaStream.getNumberOfInboundRtpPads()).toEqual(1);
            });
            it("Then mediaStream.getNumberOfMediaSinks() is equal to 1", () => {
                expect(mediaStream.getNumberOfMediaSinks()).toEqual(1);
            });
        });
        describe("When mediaSinks are iterated", () => {
            const mediaSink = Array.from(storage.mediaSinks())[0];
            it("Then mediaSink.id is equal to inboundRtpPadStats.streamId and outboundRtpPadStats.streamId", () => {
                expect(mediaSink.id).toEqual(outboundRtpPadStats.sinkId);
            });
            it("Then mediaSink.kind is equal to inboundRtpPadStats.mediaType and outboundRtpPadStats.mediaType", () => {
                expect(mediaSink.kind).toEqual(inboundRtpPadStats.mediaType);
                expect(mediaSink.kind).toEqual(outboundRtpPadStats.mediaType);
            });
            it("Then mediaSink.inboundRtpPads().length is equal to 1", () => {
                const inboundRtpPads = Array.from(mediaSink.outboundRtpPads());
                expect(inboundRtpPads.length).toEqual(1);
            });
            it("Then mediaSink.getMediaStream().length is equal to 1", () => {
                expect(mediaSink.getMediaStream()).not.toEqual(undefined);
            });
            it("Then mediaSink.getTransport().length is equal to 1", () => {
                expect(mediaSink.getTransport()).not.toEqual(undefined);
            });
            it("Then mediaSink.getNumberOfOutboundRtpPads() is equal to 1", () => {
                expect(mediaSink.getNumberOfOutboundRtpPads()).toEqual(1);
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
        it("Then storage.getNumberOfMediaStreams() is equal to 1", () => {
            expect(storage.getNumberOfMediaStreams()).toEqual(1);
        });
        it("Then storage.getNumberOfAudioStreams() is equal to 1 if inbStats is audio", () => {
            const expected = inboundRtpPadStats.mediaType === "audio" ? 1 : 0;
            expect(storage.getNumberOfAudioStreams()).toEqual(expected);
        });
        it("Then storage.getNumberOfVideoStreams() is equal to 1 if inbStats is video", () => {
            const expected = inboundRtpPadStats.mediaType === "video" ? 1 : 0;
            expect(storage.getNumberOfVideoStreams()).toEqual(expected);
        });
        it("Then storage.getNumberOfMediaSinks() is equal to 1", () => {
            expect(storage.getNumberOfMediaSinks()).toEqual(1);
        });
        it("Then storage.getNumberOfAudioSinks() is equal to 1 if inbStats is audio", () => {
            const expected = inboundRtpPadStats.mediaType === "audio" ? 1 : 0;
            expect(storage.getNumberOfAudioSinks()).toEqual(expected);
        });
        it("Then storage.getNumberOfVideoSinks() is equal to 1 if inbStats is video", () => {
            const expected = inboundRtpPadStats.mediaType === "video" ? 1 : 0;
            expect(storage.getNumberOfVideoSinks()).toEqual(expected);
        });
    });

    describe("Given an updated StatsStorage to which elements are added and then removed all except transport", () => {
        const storage = new StatsStorage();
        const inboundRtpPadStats = Generator.createSfuInboundRtpPad();
        const outboundRtpPadStats = Generator.createSfuOutboundRtpPad({ mediaType: inboundRtpPadStats.mediaType });
        const sctpChannelStats = Generator.createSfuSctpChannel();
        const transportStats = Generator.createSfuTransport();
        storage.updateInboundRtpPad(inboundRtpPadStats);
        storage.updateOutboundRtpPad(outboundRtpPadStats);
        storage.updateSctpChannel(sctpChannelStats);
        storage.updateTransport(transportStats);
        it("When inboundRtpPads are iterated Then the length is 0", () => {
            storage.removeInboundRtpPad(inboundRtpPadStats.padId);
            const inboundRtpPads = Array.from(storage.inboundRtpPads());
            expect(inboundRtpPads.length).toEqual(0);
        });
        it("When outboundRtpPads are iterated Then the length is 0", () => {
            storage.removeOutboundRtpPad(outboundRtpPadStats.padId);
            const outboundRtpPads = Array.from(storage.outboundRtpPads());
            expect(outboundRtpPads.length).toEqual(0);
        });
        it("When sctpChannels are iterated Then the length is 0", () => {
            storage.removeSctpChannel(sctpChannelStats.channelId);
            const sctpChannels = Array.from(storage.sctpChannels());
            expect(sctpChannels.length).toEqual(0);
        });

        describe("When transports are iterated", () => {
            const transport = Array.from(storage.transports())[0];
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
            it("Then transport.mediaSinks().length is 0", () => {
                const mediaSinks = Array.from(transport.mediaSinks());
                expect(mediaSinks.length).toEqual(0);
            });
            it("Then transport.mediaStreams().length is 0", () => {
                const mediaStreams = Array.from(transport.mediaStreams());
                expect(mediaStreams.length).toEqual(0);
            });
            it("Then transport.getNumberOfInboundRtpPads() is 0", () => {
                expect(transport.getNumberOfInboundRtpPads()).toEqual(0);
            });
            it("Then transport.getNumberOfOutboundRtpPads() is 0", () => {
                expect(transport.getNumberOfOutboundRtpPads()).toEqual(0);
            });
            it("Then transport.getNumberOfSctpChannels() is 0", () => {
                expect(transport.getNumberOfSctpChannels()).toEqual(0);
            });
            it("Then transport.getNumberOfMediaStreams() is 0", () => {
                expect(transport.getNumberOfMediaStreams()).toEqual(0);
            });
            it("Then transport.getNumberOfMediaSinks() is 0", () => {
                expect(transport.getNumberOfMediaSinks()).toEqual(0);
            });
        });
    });
})