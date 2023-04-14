export { AuxCollector } from "./AuxCollector";

export type { StatsReader } from "./entries/StatsStorage";
export type {
    SfuTransportEntry,
    SfuInboundRtpPadEntry,
    SfuOutboundRtpPadEntry,
    SfuSctpChannelEntry,
} from "./entries/StatsEntryInterfaces";

export type { SfuMonitorConfig, SfuMonitor, SfuMonitorEventsMap } from "./SfuMonitor";
export type { MediasoupTransportType } from "./mediasoup/MediasoupTypes";
export { 
    MediasoupCollector, 
} from "./mediasoup/MediasoupCollector";

export type { 
    MediasoupCollectorConfig 
} from "./mediasoup/MediasoupCollector";

export type { ExtensionStat } from "@observertc/sample-schemas-js";
export type { CustomSfuEvent } from "@observertc/sample-schemas-js";

import { SfuMonitor, SfuMonitorConfig } from "./SfuMonitor";
import { SfuMonitorImpl } from "./SfuMonitorImpl";

/**
 * Create an SfuMonitor
 * @param config config for the monitor
 */
export function createSfuMonitor(config?: Partial<SfuMonitorConfig>): SfuMonitor {
    return SfuMonitorImpl.create(config);
}

export { setLoggerFactory } from "./utils/logger";

