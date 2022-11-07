import { StatsWriter } from "./entries/StatsStorage";

export interface Collector {
    readonly id: string;
    setStatsWriter(writer: StatsWriter | null): void;
    /**
     * Collect stats and push it to the Observer
     */
    collect(): Promise<void>;
    /**
     * Indicate if the Collector is closed or not
     */
    readonly closed: boolean;
    /**
     * Close the collector. if any pending collecting process is there those will be interrupted and rejected.
     */
    close(): void;
}
