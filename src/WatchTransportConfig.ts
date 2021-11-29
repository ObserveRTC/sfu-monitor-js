/**
 * Holds the config on watching transports.
 * 
 * Pulling measurements from all pads and transprots can impact performance, 
 * and not always necessary. by not including measurements the observer can still 
 * have a keep alive messages from pads and transprots but we can avoid of pulling 
 * the stats.
 */
export interface WatchTransportConfig {
    includeInboundRtpPadMeasurements: boolean,
    includeOutboundRtpPadMeasurements: boolean,
    includeTransportMeasurements: boolean,
}