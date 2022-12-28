export interface MonitorMetricsReader {
    /**
     * Gets the last elapsed time in milliseconds was necessary to collect and adapt all stats.
     */
    readonly collectingTimeInMs?: number;

    /**
     * Gets the timestamp when stats collected last time
     */
    readonly lastCollected?: number;

    /**
     * Gets the timestamp when the last sample is assembled
     */
    readonly lastSampled?: number;

    /**
     * Gets the timestamp when the last sample is sent
     */
    readonly lastSent?: number;

    /**
     * Gets the number of total entries stored in the monitor
     */
    readonly numberOfStoredEntries: number;

    /**
     * Gets the number of collectors the monitor uses to collect stats
     */
    readonly numberOfCollectors: number;
}

export interface MonitorMetricsWriter {
    setCollectingTimeInMs(value: number): void;
    setLastCollected(value: number): void;
    setLastSampled(value: number): void;
    setLastSent(value: number): void;
}

export abstract class MonitorMetrics implements MonitorMetricsReader, MonitorMetricsWriter {
    private _collectingTimeInMs?: number;
    private _lastCollected?: number;
    private _lastSampled?: number;
    private _lastSent?: number;

    setCollectingTimeInMs(value: number): void {
        this._collectingTimeInMs = value;
    }

    setLastCollected(value: number): void {
        this._lastCollected = value;
    }

    setLastSampled(value: number): void {
        this._lastSampled = value;
    }

    setLastSent(value: number): void {
        this._lastSent = value;
    }

    public get collectingTimeInMs(): number | undefined {
        return this._collectingTimeInMs;
    }

    public get lastCollected(): number | undefined {
        return this._lastCollected;
    }

    public get lastSampled(): number | undefined {
        return this._lastSampled;
    }

    public get lastSent(): number | undefined {
        return this._lastSent;
    }

    public abstract get numberOfStoredEntries(): number;

    public abstract get numberOfCollectors(): number;
}
