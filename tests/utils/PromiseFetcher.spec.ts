import { PromiseFetcher } from "../../src/utils/PromiseFetcher";
describe("PromiseFetcher", () => {
    it ("Fetches sequentially", async () => {
        const fetcher = PromiseFetcher.builder<number>()
            .withPromiseSuppliers(
                () => Promise.resolve(1),
                () => Promise.resolve(2),
                () => Promise.resolve(3)
            )
            .build();
        let expected = 0;
        for await (const actual of fetcher.values()) {
            expect(++expected).toBe(actual);
        }
        expect(3).toBe(expected);
    });

    it ("Fetches even if the batchSize larger than the length of the promises", async () => {
        const fetcher = PromiseFetcher.builder<number>()
            .withPromiseSuppliers(
                () => Promise.resolve(1),
                () => Promise.resolve(2),
                () => Promise.resolve(3)
            )
            .withBatchSize(30)
            .build();
        let expected = 0;
        for await (const actual of fetcher.values()) {
            expect(++expected).toBe(actual);
        }
        expect(3).toBe(expected);
    });

    it ("Fetch sequentially even if promise resolved different times", async () => {
        const fetcher = PromiseFetcher.builder<number>()
            .withPromiseSuppliers(
                () => new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(1);
                    }, 300)
                }),
                () => new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(2);
                    }, 200)
                }),
                () => new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(3);
                    }, 100)
                }),
            )
            .build();
        const values = await fetcher.fetch();
        expect(values).toEqual([1,2,3]);
    });

    it ("Batched fetch stratches collecting time", async () => {
        const fetcher = PromiseFetcher.builder<number>()
            .withPromiseSuppliers(
                () => new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(1);
                    }, 300)
                }),
                () => new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(2);
                    }, 300)
                }),
                () => new Promise<number>(resolve => {
                    setTimeout(() => {
                        resolve(3);
                    }, 300)
                }),
            )
            .withBatchSize(1)
            .build();
        const started = Date.now();
        await fetcher.fetch();
        expect(900 <= Date.now() - started).toBe(true);
    });

    it ("Fetch sequentially when it is batched", async () => {
        const fetcher = PromiseFetcher.builder<number>()
        .withPromiseSuppliers(
            () => Promise.resolve(1),
            () => Promise.resolve(2),
            () => Promise.resolve(3)
        )
        .withBatchSize(1)
        .build();
        const values = await fetcher.fetch();
        expect(values).toEqual([1,2,3]);
    });

    it ("Throw error on the right index", async () => {
        const fetcher = PromiseFetcher.builder<number>()
        .withPromiseSuppliers(
            () => Promise.resolve(1),
            () => Promise.reject(2),
            () => Promise.resolve(3)
        )
        .build();
        await expect(async () => {
            for await (const item of fetcher.values());
        }).rejects.toThrowError();
    });

    it ("Throw error on the right index when it is batched", async () => {
        const fetcher = PromiseFetcher.builder<number>()
        .withPromiseSuppliers(
            () => Promise.resolve(1),
            () => Promise.reject(2),
            () => Promise.resolve(3)
        )
        .withBatchSize(1)
        .build();
        await expect(async () => {
            for await (const item of fetcher.values());
        }).rejects.toThrowError();
    });

    it ("call errorHandler on the right index", async () => {
        let catchedIndex = -1;
        const fetcher = PromiseFetcher.builder<number>()
        .withPromiseSuppliers(
            () => Promise.resolve(1),
            () => Promise.reject(2),
            () => Promise.resolve(3)
        )
        .onCatchedError((err, index) => {
            catchedIndex = index;
        })
        .build();
        for await (const item of fetcher.values());
        expect(1).toBe(catchedIndex);
    });

    it ("Call errorHandler on the right index when it is batched", async () => {
        let catchedIndex = -1;
        const fetcher = PromiseFetcher.builder<number>()
        .withPromiseSuppliers(
            () => Promise.resolve(1),
            () => Promise.reject(2),
            () => Promise.resolve(3)
        )
        .withBatchSize(2)
        .onCatchedError((err, index) => {
            catchedIndex = index;
        })
        .build();
        for await (const item of fetcher.values());
        expect(1).toBe(catchedIndex);
    });
})