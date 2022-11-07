/* eslint-disable @typescript-eslint/no-explicit-any */
export class Queue<T = any> {
    private _items: any = {};
    private _head = 0;
    private _tail = 0;

    public get size() {
        return this._tail - this._head;
    }

    public get isEmpty() {
        return this._tail === this._head;
    }

    public clear(): void {
        this._items = {};
        this._head = 0;
        this._tail = 0;
    }

    public push(...items: T[]): void {
        if (!Array.isArray(items)) {
            return;
        }
        items.forEach((item) => {
            this._items[this._tail] = item;
            ++this._tail;
        });
    }

    public pop(): T | undefined {
        if (this._head === this._tail) {
            return undefined;
        }
        const item = this._items[this._head];
        delete this._items[this._head];
        ++this._head;
        return item;
    }

    public peek(): T | undefined {
        return this._items[this._head];
    }
}
