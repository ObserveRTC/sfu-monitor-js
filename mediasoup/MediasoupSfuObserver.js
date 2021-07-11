import { uuid } from 'uuidv4';
import { SfuObserver } from '../core/lib/SfuObserver';

export class MediasoupSfuObserverBuilder {
    constructor(sfuId = null) {
        this._sfuId = sfuId !== null ? sfuId : uuid();
        this._workers = new Map();
        this._routers = new Map();
        this._transports = new Map();
        this._producers = new Map();
        this._consumers = new Map();
    }
    
    observe(mediasoup) {
        if (!mediasoup) {
            throw new Error("Cannot observe a null mediasoup object");
        }
        // check mediasoup version
        mediasoup.observer.on("newworker", worker => this._observeWorker(worker));
        return this;
    }

    build() {
        const result = new SfuObserver();
        return result;
    }

    _observeWorker(worker) {
        if (!worker) {
            throw new Error("Worker cannot be null");
        }
        if (worker.pid === null || worker.pid === undefined) {
            throw new Error("Added worker pid property cannot be null or undefined");
        }
        if (worker.observer === null || worker.observer === undefined) {
            throw new Error("Added worker observer property cannot be null or undefined");
        }
        if (typeof worker.observer.on !== 'function') {
            throw new Error("Added worker observer.on must be a function");
        }
        this._workers.set(worker.pid, worker);
        worker.observer.on("close", () => this._workers.delete(worker.pid));
        worker.observer.on("newrouter", router => this._observeRouter(router));
    }

    _observeRouter(router) {
        if (!router) {
            throw new Error("Router cannot be null");
        }
        if (router.id === null || router.id === undefined) {
            throw new Error("Added Router id property cannot be null or undefined");
        }
        if (router.observer === null || router.observer === undefined) {
            throw new Error("Added router observer property cannot be null or undefined");
        }
        if (typeof router.observer.on !== 'function') {
            throw new Error("Added router observer.on must be a function");
        }
        this._routers.set(router.id, router);
        router.observer.on("close", () => this._routers.delete(router.id));
        router.observer.on("newtransport", transport => this._observeTransport(router));
    }
}