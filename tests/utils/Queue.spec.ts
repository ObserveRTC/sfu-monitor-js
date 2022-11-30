import { Queue } from "../../src/utils/Queue";

describe("Queue", () => {
    describe("Specification Tests", () => {
        it("when queue is created isEmpty should be true and size should be 0", async () => {
            const queue = new Queue();

            expect(true).toBe(queue.isEmpty);
            expect(0).toBe(queue.size);
        });

        it("when an element is added to the queue isEmpty should be false and size should be 1", async () => {
            const queue = new Queue<number>();

            queue.push(1);

            expect(false).toBe(queue.isEmpty);
            expect(1).toBe(queue.size);
        });

        it("when two elements are added to the queue size should be 2 and popped items should be retrieved in order", async () => {
            const queue = new Queue<number>();

            queue.push(3, 4);

            expect(2).toBe(queue.size);
            expect(3).toBe(queue.pop());
            expect(4).toBe(queue.pop());
        });

        it("when two elements are pushed the first one can be peeked", async () => {
            const queue = new Queue<number>();

            queue.push(3, 4);

            expect(3).toBe(queue.peek());
        });
    });

    // scenario
    describe("Given a Queue", () => {
        const queue = new Queue<number>();
        const firstItem = 3;
        const secondItem = 4;
        describe(`When two elements are added`, () => {
            it("then the size is 2", async () => {
                queue.push(firstItem, secondItem);

                expect(2).toBe(queue.size);
            });
        });

        describe(`When element is popped`, () => {
            it("Then the size is 1", async () => {
                const poppedItem = queue.pop();

                expect(1).toBe(queue.size);
                expect(poppedItem).toBe(firstItem);
            });
        });

        describe(`When element is popped`, () => {
            it("Then the size is 0 and it is the second inserted item", async () => {
                const poppedItem = queue.pop();

                expect(0).toBe(queue.size);
                expect(poppedItem).toBe(secondItem);
            });
        });

        describe(`When element is popped from an empty queue`, () => {
            it("Then the size is 0 and the item is undefined", async () => {
                const poppedItem = queue.pop();

                expect(0).toBe(queue.size);
                expect(poppedItem).toBe(undefined);
            });
        });

        describe(`When element is pushed to an empty queue`, () => {
            it("Then the size is 1", async () => {
                queue.push(firstItem);

                expect(1).toBe(queue.size);
            });
        });
    });
});
