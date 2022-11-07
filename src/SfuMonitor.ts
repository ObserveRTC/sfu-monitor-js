import { CustomSfuEvent, ExtensionStat } from "@observertc/schemas";
import { EventsRegister } from "./EventsRelayer";
import { SamplerConfig } from "./Sampler";
import { SenderConfig } from "./Sender";
import { StatsReader } from "./entries/StatsStorage";
import { AccumulatorConfig } from "./Accumulator";
import { setLevel as setLoggersLevel } from "./utils/logger";
import { LogLevelDesc } from "loglevel";
import { SfuMonitorImpl } from "./SfuMonitorImpl";
import { Collectors, CollectorsConfig } from "./Collectors";

export type SfuMonitorConfig = {
    /**
     * Sets the maximum number of listeners for event emitters
     */
    maxListeners?: number;
    /**
     * By setting it, the observer calls the added statsCollectors periodically
     * and pulls the stats.
     *
     * DEFAULT: undefined
     */
    collectingPeriodInMs?: number;
    /**
     * By setting it, the observer make samples periodically.
     *
     * DEFAULT: undefined
     */
    samplingPeriodInMs?: number;
    /**
     * By setting it, the observer sends the samples periodically.
     *
     * DEFAULT: undefined
     */
    sendingPeriodInMs?: number;

    /**
     * By setting it stats items and entries are deleted if they are not updated.
     *
     * DEFAULT: undefined
     */
    statsExpirationTimeInMs?: number;

    /**
     * Config related to collecting stats
     */
    collectors?: CollectorsConfig;

    /**
     * Sampling Component Related configurations
     *
     */
    sampler?: SamplerConfig;

    /**
     * Sending Component Related congurations
     *
     * default: undefined, means no sample is sent
     */
    sender?: SenderConfig;

    /**
     * If the sender component is configured,
     * accumulator sets the buffer between sampling and sending.
     */
    accumulator?: AccumulatorConfig;
};

export interface SfuMonitor {
    /**
     * Access to the collectors the monitor has
     */
    readonly collectors: Collectors;

    /**
     * Access to the collected stats
     */
    readonly storage: StatsReader;

    /**
     * Acces to subscribe or unsubscribe to events
     */
    readonly events: EventsRegister;

    /**
     * Indicate if the monitor is connected to an observer or not
     */
    readonly connected: boolean;
    /**
     * Adds an arbitrary stats object will be sent to the backend observer
     * @param stats
     */
    addExtensionStats(stats: ExtensionStat): void;

    /**
     * Adds a custom defined event (SFU_CLIENT_JOINED, SFU_CLIENT_MUTED, etc.)
     * @param event
     */
    addCustomSfuEvent(event: CustomSfuEvent): void;

    /**
     * Connects the Monitor to an observer
     *
     * @param config
     */
    connect(config: SenderConfig): void;

    /**
     * Mark all of the created samples with a given string
     * @param marker
     */
    setMarker(marker: string): void;

    /**
     * Collect Stats.
     */
    collect(): Promise<void>;

    /**
     * Make client sample from a collected stats
     */
    sample(): Promise<void>;

    /**
     * Send samples
     */
    send(): Promise<void>;

    /**
     * Indicate if the SfuObserver is closed or not
     */
    readonly closed: boolean;

    /**
     * Close the observer and all its used resources
     */
    close(): void;
}

/**
 * Sets the level of logging of the module
 *
 * possible values are: "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "SILENT"
 */
export function setLogLevel(level: LogLevelDesc) {
    setLoggersLevel(level);
}

/**
 * Create an SfuMonitor
 * @param config config for the monitor
 */
export function createSfuMonitor(config?: SfuMonitorConfig): SfuMonitor {
    return SfuMonitorImpl.create(config);
}
