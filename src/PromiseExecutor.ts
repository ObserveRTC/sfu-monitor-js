export class Promises {
    static from(promises: Promise<any>[]) {
        const result = new Promises();
        result.add(...promises);
        return result;
    }

    private _promises: Promise<any>[];
    private _errorHandler?: (err: any, i: number) => void;
    constructor() {
        this._promises = [];
    }

    add(...promises: Promise<any>[]): this {
        this._promises.push(...promises);
        return this;
    }

    onError(listener: (err: any, index: number) => void): this {
        this._errorHandler = listener;
        return this;
    }

    execute(): Promise<any> {
        const promises = this._promises;
        if (this._errorHandler === undefined) {
            return Promise.all(promises);
        }
        const errorHandler = this._errorHandler;
        return Promise.all(promises.map((promise, index) => {
            return promise.catch((err: any) => {
                errorHandler(err, index);
            });
        }));
    }
}