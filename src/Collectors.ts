import { Collector } from "./Collector";
import { StatsWriter } from "./entries/StatsStorage";
import { createLogger } from "./utils/logger";
import { PromiseFetcher } from "./utils/PromiseFetcher";

const logger = createLogger(`Collectors`);

export type CollectorsConfig = {
    /**
     * Limits the number of collector pulled at once. When you have 500 collectors,
     * and the batchSize is 50, the resource pull 50 collectors at once.
     */
    batchSize?: number;

    /**
     * Minimum pacing time between two batches to fetch
     */
    minBatchPaceInMs?: number;

    /**
     * Maximum pacing time between two batches
     */
    maxBatchPaceInMs?: number;
};

const supplyDefaultConfig = () => {
    const result: CollectorsConfig = {
        batchSize: 50,
        minBatchPaceInMs: 0,
        maxBatchPaceInMs: 0,
    };
    return result;
};

export interface Collectors extends Iterable<Collector> {
    add(collector: Collector): boolean;
    remove(collectorId: string): boolean;
    readonly closed: boolean;
}

export class CollectorsImpl implements Collectors {
    public static create(config?: CollectorsConfig): CollectorsImpl {
        const appliedConfig = Object.assign(supplyDefaultConfig(), config);
        return new CollectorsImpl(appliedConfig);
    }

    private _config: CollectorsConfig;
    private _closed = false;
    private _collectors = new Map<string, Collector>();
    private _statsWriter?: StatsWriter;
    private constructor(config: CollectorsConfig) {
        this._config = config;
    }

    public set statsWriter(value: StatsWriter) {
        this._statsWriter = value;
    }

    public get size(): number {
        return this._collectors.size;
    }

    public get closed() {
        return this._closed;
    }

    public add(collector: Collector): boolean {
        if (this._collectors.has(collector.id)) {
            logger.warn(`Collector with id ${collector.id} has already been added`);
            return false;
        }
        if (!this._statsWriter) {
            logger.warn(`Cannot add collector if statsWriter is undefined`);
            return false;
        }
        if (!collector.hasStatsWriter) {
            collector.setStatsWriter(this._statsWriter);
        }
        if (this._collectors.has(collector.id)) {
            logger.warn(`Collector ${collector.id} is replaced in collectors`);
        }
        this._collectors.set(collector.id, collector);
        logger.info(`Collector ${collector.id} has been added`);
        return true;
    }

    public remove(collectorId: string): boolean {
        const collector = this._collectors.get(collectorId);
        if (!collector) {
            logger.info(`Attempted to remove a not existing collector ${collectorId}`);
            return false;
        }
        if (!collector.closed) {
            collector.close();
        }
        collector.setStatsWriter(null);
        this._collectors.delete(collectorId);
        logger.info(`Collector ${collector.id} has been removed`);
        return true;
    }

    async collect(): Promise<boolean> {
        let result = true;
        const collectorIds: string[] = [];
        const promiseFetcher = PromiseFetcher.builder()
            .withBatchSize(this._config.batchSize ?? 0)
            .withPace(this._config.maxBatchPaceInMs ?? 0, this._config.maxBatchPaceInMs ?? 0)
            .onCatchedError((err, index) => {
                const collectorId = index < collectorIds.length ? collectorIds[index] : undefined;
                logger.warn(`Error occurred while collecting for ${collectorId}`, err);
                result = false;
            });
        for (const collector of Array.from(this._collectors.values())) {
            promiseFetcher.withPromiseSuppliers(async () => {
                logger.debug(`Collect on ${collector.id} PromiseFetched`);
                collectorIds.push(collector.id);
                return await collector.collect();
            });
        }
        await promiseFetcher.build().fetch();
        return result;
    }

    [Symbol.iterator](): IterableIterator<Collector> {
        return this._collectors.values();
    }
}
