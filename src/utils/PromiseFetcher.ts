type ErrorListener = (err: any, i: number) => void;
export type PromiseSupplier<T> = () => Promise<T>;

const EMPTY_ARRAY: any = [];
type Nullable<T> = T | null;

interface Builder<U> {
    withBatchSize(value: number): Builder<U>;
    withPromiseSuppliers(...suppliers: PromiseSupplier<U>[]): Builder<U>;
    onCatchedError(listener: ErrorListener): Builder<U>;
    build(): PromiseFetcher<U>;
}

export class PromiseFetcher<T> {
    public static builder<U>(): Builder<U> {
        const fetcher = new PromiseFetcher<U>();
        const result = {
            withBatchSize: (value: number) => {
                fetcher._batchSize = value;
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
            }
        };
        return result;
    }
    private _batchSize: number = 0;
    private _suppliers: Map<number, PromiseSupplier<T>> = new Map();
    private _errorHandler?: ErrorListener;
    private constructor() {

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
            }
        }
        const batchSize = 0 < this._batchSize ? this._batchSize : this._suppliers.size;
        const values = new Map<number, T>();
        let promises: Promise<void>[] = [];
        for (let index = 0; index < this._suppliers.size; ++index) {
            const supplier = this._suppliers.get(index);
            if (!supplier) continue;
            const promise = supplier()
                .then(item => {
                    values.set(index, item);
                })
                .catch((err) => {
                    errorHandler!(err, index);
                });
            promises.push(promise);
            if (promises.length < batchSize) continue;
            await Promise.all(promises);
            for (let j = 0; j < promises.length; ++j) {
                const valueIndex = index + 1 - batchSize + j;
                const value = values.get(valueIndex);
                if (!value) continue;
                yield value;
            }
            values.clear();
            promises = [];
        }
        if (promises.length < 1) return;
        await Promise.all(promises);
        for (let j = 0; j < promises.length; ++j) {
            const valueIndex = this._suppliers.size - batchSize + j;
            const value = values.get(valueIndex);
            if (!value) continue;
            yield value;
        }
    }
}