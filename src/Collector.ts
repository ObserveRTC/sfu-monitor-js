export interface Collector {
    /**
     * Create a list of fetcher functions will fetch and update statsStorage
     */
    createFetchers(): (() => Promise<void>)[];
    /**
     * Indicate if the Collector is closed or not
     */
    readonly closed: boolean;
    /**
     * Close the collector. if any pending collecting process is there those will be interrupted and rejected.
     */
    close(): void;
}