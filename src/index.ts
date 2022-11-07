export { AuxCollector } from "./AuxCollector";
export type { AuxCollectorConfig } from "./AuxCollector";

export { TransportTypeFunction } from "./mediasoup/MediasoupRouterCollector";
export { MediasoupCollector } from "./mediasoup/MediasoupCollector";
export type { MediasoupCollectorConfig } from "./mediasoup/MediasoupCollector";

export type { SenderConfig } from "./Sender";
export type { SamplerConfig } from "./Sampler";

export type { StatsReader } from "./entries/StatsStorage";
export type {
    SfuTransportEntry,
    SfuInboundRtpPadEntry,
    SfuOutboundRtpPadEntry,
    SfuMediaStreamEntry,
    SfuMediaSinkEntry,
    SfuSctpChannelEntry,
} from "./entries/StatsEntryInterfaces";

export type { SfuMonitorConfig, SfuMonitor } from "./SfuMonitor";
export type { MediasoupMonitorConfig, MediasoupMonitor } from "./MediasoupMonitor";
export type { MediasoupTransportType } from "./mediasoup/MediasoupTypes";

export type { ExtensionStat } from "@observertc/schemas";

import { MediasoupMonitor, MediasoupMonitorConfig } from "./MediasoupMonitor";
import { SfuMonitor, SfuMonitorConfig } from "./SfuMonitor";
import { SfuMonitorImpl } from "./SfuMonitorImpl";
/**
 * Create an SfuMonitor
 * @param config config for the monitor
 */
export function createSfuMonitor(config?: SfuMonitorConfig): SfuMonitor {
    return SfuMonitorImpl.create(config);
}

/**
 * Create a monitor for mediasoup
 * @param config config for the monitor
 */
export function createMediasoupMonitor(config?: MediasoupMonitorConfig): MediasoupMonitor {
    return MediasoupMonitor.create(config);
}
