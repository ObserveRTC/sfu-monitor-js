import { createLogger } from "./logger";

/* eslint-disable @typescript-eslint/no-unused-vars */
const logger = createLogger(`PromiseFetcher`);

/* eslint-disable @typescript-eslint/no-explicit-any */
type ErrorListener = (err: any, i: number) => void;
export type PromiseSupplier<T> = () => Promise<T>;

/* eslint-disable @typescript-eslint/no-explicit-any */
const EMPTY_ARRAY: any = [];
type Nullable<T> = T | null;

type Pace = {
    minPaceInMs: number;
    maxPaceInMs: number;
};

export interface PromiseFetcherBuilder<U> {
    withBatchSize(value: number): PromiseFetcherBuilder<U>;
    withPromiseSuppliers(...suppliers: PromiseSupplier<U>[]): PromiseFetcherBuilder<U>;
    onCatchedError(listener: ErrorListener): PromiseFetcherBuilder<U>;
    withPace(minPaceInMs: number, maxPaceInMs: number): PromiseFetcherBuilder<U>;
    build(): PromiseFetcher<U>;
}

export class PromiseFetcher<T> {
    public static builder<U>(): PromiseFetcherBuilder<U> {
        const fetcher = new PromiseFetcher<U>();
        const result = {
            withBatchSize: (value: number) => {
                fetcher._batchSize = value;
                return result;
            },
            withPace: (minPaceInMs: number, maxPaceInMs: number) => {
                if (maxPaceInMs < minPaceInMs) {
                    throw new Error(`minPaceInMs: ${minPaceInMs} is larger than the maxPaceInMs: ${maxPaceInMs}`);
                }
                fetcher._pace = {
                    minPaceInMs,
                    maxPaceInMs,
                };
                return result;
            },
            withPromiseSuppliers: (...suppliers: PromiseSupplier<U>[]) => {
                if (!suppliers) return result;
                for (const supplier of suppliers) {
                    const index = fetcher._suppliers.size;
                    fetcher._suppliers.set(index, supplier);
                }
                return result;
            },
            onCatchedError: (listener: ErrorListener) => {
                fetcher._errorHandler = listener;
                return result;
            },
            build: () => {
                return fetcher;
            },
        };
        return result;
    }
    private _pace?: Pace;
    private _batchSize = 0;
    private _suppliers: Map<number, PromiseSupplier<T>> = new Map();
    private _errorHandler?: ErrorListener;
    private constructor() {
        // empty block
    }

    async fetch(): Promise<Nullable<T>[]> {
        if (this._suppliers.size < 1) {
            return EMPTY_ARRAY as Nullable<T>[];
        }
        const result: Nullable<T>[] = [];
        for await (const value of this.values()) {
            result.push(value);
        }
        return result;
    }

    async *values(): AsyncGenerator<T, void, undefined> {
        let errorHandler = this._errorHandler;
        if (!errorHandler) {
            errorHandler = (err, index) => {
                throw new Error(`Promise ${index}th is rejected with an error: ` + err);
            };
        }
        const batchSize = 0 < this._batchSize ? this._batchSize : this._suppliers.size;
        let emittedBatch = 0;
        const values = new Map<number, T>();
        let promises: Promise<void>[] = [];
        for (let index = 0; index < this._suppliers.size; ++index) {
            const supplier = this._suppliers.get(index);
            if (!supplier) continue;
            const promise = supplier()
                .then((item) => {
                    values.set(index, item);
                })
                .catch((err) => {
                    if (errorHandler) {
                        errorHandler(err, index);
                    }
                });
            promises.push(promise);
            if (promises.length < batchSize) continue;
            await Promise.all(promises);
            for (let j = 0; j < promises.length; ++j) {
                const valueIndex = emittedBatch * batchSize + j;
                const value = values.get(valueIndex);
                if (value === undefined) continue;
                yield value;
            }
            ++emittedBatch;
            values.clear();
            promises = [];
            if (emittedBatch * batchSize < this._suppliers.size && this._pace) {
                const { minPaceInMs, maxPaceInMs } = this._pace;
                const timeoutInMs = Math.ceil(minPaceInMs + Math.random() * (maxPaceInMs - minPaceInMs));
                if (1 < timeoutInMs) {
                    await new Promise<void>((resolve) => {
                        setTimeout(() => {
                            resolve();
                        }, timeoutInMs);
                    });
                }
            }
        }
        if (promises.length < 1) return;
        await Promise.all(promises);
        for (let j = 0; j < promises.length; ++j) {
            const valueIndex = emittedBatch * batchSize + j;
            const value = values.get(valueIndex);
            if (!value) continue;
            yield value;
        }
    }
}
