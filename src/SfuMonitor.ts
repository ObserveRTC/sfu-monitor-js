import { CustomSfuEvent, ExtensionStat, Samples, SfuSample } from "@observertc/sample-schemas-js";
import { StatsReader } from "./entries/StatsStorage";
import { AccumulatorConfig } from "./Accumulator";
import { MonitorMetrics } from "./MonitorMetrics";
import { AuxCollector } from "./AuxCollector";
import { MediasoupCollector, MediasoupCollectorConfig } from "./mediasoup/MediasoupCollector";
import { LogLevel } from "./utils/logger";

export type SfuMonitorConfig = {
    /**
     * The identifier of the SFU.
     *
     * DEFAULT: a generated unique value
     */
    sfuId: string;

    /**
     * Sets the default logging level for sfu-monitor-js
     */
    logLevel: LogLevel;

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
     * Limits the number of stats polled at once from the collector. 
     */
    pollingBatchSize?: number;

    /**
     * Pacing time between polling batches of stats
     */
    pollingBatchPaceTimeInMs?: number;

    /**
     * Flag indicating if the monitor creates sfu events.
     * If true, events happening on the collected sources create sfu events such as SFU_TRANSPORT_OPENED, SFU_TRANSPORT_CLOSED.
     * 
     * If this flag is false, the application is responsible for adding sfu events by calling the appropriate SfuMonitor method for the corresponding event.
     * 
     * DEFAULT: false
     */
    createSfuEvents?: boolean;

    /**
     * If the sender component is configured,
     * accumulator sets the buffer between sampling and sending.
     */
    accumulator?: AccumulatorConfig;
};

export interface SfuMonitorEventsMap {
    'stats-collected': undefined,
    'sample-created': {
        sfuSample: SfuSample
    },
    'send': {
        samples: Samples[]
    }
}

/**
 * SfuMonitor is responsible for monitoring and collecting SFU-related data.
 */
export interface SfuMonitor {
    
    /**
     * Registers a listener to be invoked when an event of the specified type is emitted.
     *
     * @template K - The event type, extending the keys of the SfuMonitorEventsMap.
     * @param {K} event - The event name.
     * @param {(data: SfuMonitorEventsMap[K]) => void} listener - The callback to be invoked when the event is emitted.
     * @returns {this} - The instance of the class for chaining.
     */
    on<K extends keyof SfuMonitorEventsMap>(event: K, listener: (data: SfuMonitorEventsMap[K]) => void): this;

    /**
     * Registers a listener that will be invoked only once, when an event of the specified type is emitted.
     *
     * @template K - The event type, extending the keys of the SfuMonitorEventsMap.
     * @param {K} event - The event name.
     * @param {(data: SfuMonitorEventsMap[K]) => void} listener - The callback to be invoked when the event is emitted.
     * @returns {this} - The instance of the class for chaining.
     */
    once<K extends keyof SfuMonitorEventsMap>(event: K, listener: (data: SfuMonitorEventsMap[K]) => void): this;

    /**
     * Removes the specified listener from the list of listeners for the specified event.
     *
     * @template K - The event type, extending the keys of the SfuMonitorEventsMap.
     * @param {K} event - The event name.
     * @param {(data: SfuMonitorEventsMap[K]) => void} listener - The callback to be removed from the list of listeners.
     * @returns {this} - The instance of the class for chaining.
     */
    off<K extends keyof SfuMonitorEventsMap>(event: K, listener: (data: SfuMonitorEventsMap[K]) => void): this;

    /**
     * Creates an auxiliary collector.
     *
     * @returns {AuxCollector} - The created auxiliary collector.
     */
    createAuxCollector(): AuxCollector;

    /**
     * Creates a mediasoup collector with the specified configuration.
     *
     * @param {MediasoupCollectorConfig} config - The configuration object for the mediasoup collector.
     * @returns {MediasoupCollector} - The created mediasoup collector.
     */
    createMediasoupCollector(config: MediasoupCollectorConfig): MediasoupCollector;

    /**
     * Access to the collected stats
     */
    readonly storage: StatsReader;

    /**
     * Access to a general monitor related metrics
     */
    readonly metrics: MonitorMetrics;

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
     * Adds a transport opened event to the SFU event list.
     * @param transportId - The identifier of the opened transport.
     * @param timestamp - Optional timestamp for the event. If not provided, the current date and time will be used.
     */
    addTransportOpenedEvent(transportId: string, timestamp?: number): void;

    /**
     * Adds a transport closed event to the custom SFU event list.
     * @param transportId - The identifier of the closed transport.
     * @param timestamp - Optional timestamp for the event. If not provided, the current date and time will be used.
     */
    addTransportClosedEvent(transportId: string, timestamp?: number): void;

    /**
     * Adds an RTP stream added event to the SFU event list.
     * @param transportId - The identifier of the transport associated with the RTP stream.
     * @param rtpPadId - The identifier of the RTP pad.
     * @param sfuStreamId - The identifier of the SFU stream.
     * @param sfuSinkId - Optional identifier of the SFU sink.
     * @param timestamp - Optional timestamp for the event. If not provided, the current date and time will be used.
     */
    addRtpStreamAdded(transportId: string, rtpPadId: string, sfuStreamId: string, sfuSinkId?: string, timestamp?: number): void;

    /**
     * Adds an RTP stream removed event to the SFU event list.
     * @param transportId - The identifier of the transport associated with the RTP stream.
     * @param rtpPadId - The identifier of the RTP pad.
     * @param sfuStreamId - The identifier of the SFU stream.
     * @param sfuSinkId - Optional identifier of the SFU sink.
     * @param timestamp - Optional timestamp for the event. If not provided, the current date and time will be used.
     */
    addRtpStreamRemoved(transportId: string, rtpPadId: string, sfuStreamId: string, sfuSinkId?: string, timestamp?: number): void;


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
    send(): void;

    /**
     * Indicate if the SfuObserver is closed or not
     */
    readonly closed: boolean;

    /**
     * Close the observer and all its used resources
     */
    close(): void;
}

