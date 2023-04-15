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
     * The SfuMonitor configuration object.
     */
    readonly config: SfuMonitorConfig;
    
    /**
     * Access to the collected stats.
     */
    readonly storage: StatsReader;

    /**
     * Access to general monitor-related metrics.
     */
    readonly metrics: MonitorMetrics;

    /**
     * Indicates if the SfuObserver is closed or not.
     */
    readonly closed: boolean;
    
    /**
     * Gets the SFU identifier.
     */
    readonly sfuId: string;

    /**
     * Adds a transport opened event to the custom SFU event list.
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
     * Adds an arbitrary stats object that will be sent to the backend observer.
     * @param stats - The arbitrary stats object.
     */
    addExtensionStats(stats: ExtensionStat): void;

    // Documentation for the addCustomSfuEvent, addTransportOpenedEvent, addTransportClosedEvent, 
    // addRtpStreamAdded, and addRtpStreamRemoved methods is already complete.

    /**
     * Marks all of the created samples with a given string.
     * @param marker - The string to mark the samples with.
     */
    setMarker(marker: string): void;

    /**
     * Collects stats.
     */
    collect(): Promise<void>;

    /**
     * Creates a sfu sample from the collected stats.
     */
    sample(): void;

    /**
     * Sends the samples.
     */
    send(): void;

    /**
     * Closes the observer and all its used resources.
     */
    close(): void;
}


