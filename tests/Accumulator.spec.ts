import { Accumulator } from "../src/Accumulator";

describe("Accumulator", () => {
    it("When two SfuSamples are added Then they were accumulated", () => {
        const accumulator = Accumulator.create();
        let invoked = false;
        accumulator.addSfuSample({
            sfuId: "sfuId1",
            timestamp: Date.now(),
        });
        accumulator.addSfuSample({
            sfuId: "sfuId1",
            timestamp: Date.now(),
        });

        accumulator.drainTo((samples) => {
            expect(samples!.sfuSamples!.length).toBe(2);
            invoked = true;
        });
        expect(invoked).toBe(true);
    });

    it("When two SfuSamples are added and the Accumulator is limited for the clientsamples Then they were accumulated in two separated Samples", () => {
        const accumulator = Accumulator.create({
            maxSfuSamples: 1,
        });
        let invoked = 0;
        accumulator.addSfuSample({
            sfuId: "clientId1",
            timestamp: Date.now(),
        });
        accumulator.addSfuSample({
            sfuId: "clientId2",
            timestamp: Date.now(),
        });

        accumulator.drainTo((samples) => {
            expect(samples!.sfuSamples!.length).toBe(1);
            ++invoked;
        });
        expect(invoked).toBe(2);
    });

    it("When Accumulator is set to forward empty Samples Then it creates samples even if no data is added", () => {
        const accumulator = Accumulator.create({
            forwardIfEmpty: true,
        });
        let invoked = 0;

        accumulator.drainTo((samples) => {
            expect(samples).toBe(undefined);
            ++invoked;
        });
        expect(invoked).toBe(1);
    });

    it("When it is drained Then no new samples can be drained", () => {
        const accumulator = Accumulator.create({
            forwardIfEmpty: false,
        });
        let invoked = false;
        accumulator.addSfuSample({
            sfuId: "sfuId1",
            timestamp: Date.now(),
        });
        accumulator.drainTo(() => {
            // empty consumer
        });
        accumulator.drainTo((samples) => {
            invoked = true;
        });
        expect(invoked).toBe(false);
    });
});
