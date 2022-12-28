import { CustomSfuEvent, ExtensionStat } from "@observertc/schemas";
import { EventsRegister } from "./EventsRelayer";
import { SamplerConfig } from "./Sampler";
import { SamplesSentCallback, SenderConfig } from "./Sender";
import { StatsReader } from "./entries/StatsStorage";
import { AccumulatorConfig } from "./Accumulator";
import { Collectors, CollectorsConfig } from "./Collectors";
import { MonitorMetrics } from "./MonitorMetrics";

export type SfuMonitorConfig = {
    /**
     * Sets the maximum number of listeners for event emitters
     */
    maxListeners?: number;
    
    /**
     * Set the ticking time of the timer invokes processes for collecting, sampling, and sending.
     * 
     * DEFAULT: 1000
     */
    tickingTimeInMs?: number;

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
     * Access to events to subscribe or unsubscribe
     */
    readonly events: EventsRegister;

    /**
     * Access to a general monitor related metrics
     */
    readonly metrics: MonitorMetrics;

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
    sample(): void;

    /**
     * Send samples
     */
    send(callback?: SamplesSentCallback): void;

    /**
     * Indicate if the SfuObserver is closed or not
     */
    readonly closed: boolean;

    /**
     * Close the observer and all its used resources
     */
    close(): void;
}

