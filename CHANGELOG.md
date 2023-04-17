# 2.0.2
 * Keep polled stats in the storage even if a consecutive poll indicate noReport until sampled

# 2.0.1
 * expose (forgotten) event handler methods for SfuMonitor: `on`, `once`, `off`

# 2.0.0

## Conceptual changes

 * The SfuMonitor is no longer responsible for WebSocket connections, signaling, and transports.
 * The SfuMonitor has become responsible for the following event emissions:
	- SFU_TRANSPORT_OPENED, SFU_TRANSPORT_CLOSED
	- SFU_RTP_STREAM_ADDED, SFU_RTP_STREAM_REMOVED
 

## Major Code changes

 * Removed Sender component and corresponding configuration from SfuMonitor.
 * Removed Transport component, as sending and transporting no longer fall under the responsibility of the SfuMonitor.
 * Removed `events` field from SfuMonitor, as events have become part of the SfuMonitor itself, and SfuMonitor now provides `on`, `off`, `once` interfaces for events.

## Functionality changes

 * Storage entries are removed based on visited ids from collectors. If a stat is no longer present in the `collect()` extracted result, it is removed from the Storage.

## Configuration changes

 * Sampler configuration is reduced.
 * Sender configuration is removed.
 * `statsExpirationTimeInMs` is removed.
 * `createSfuEvents` is added.


# 1.1.1

 * Fix problem of setting statswriter twice
 * Add MonitorMetrics for self checking purposes
 * Set default statsExpirationTimeTo 60s
 * Set package version to 1.1.1
 * Fix schema version to 2.2.0

# 1.1.0

* use schema 2.2.0
* Add MediasoupMonitor, as a specialized SfuMonitor
* Change Collectors interface, from now it is accessable through `monitor.collectors`
* Export CustomSfuEvent from schema 2.2.0, and create method `addCustomSfuEvent` to the monitor
* bugfix for PromiseFetcher if the min and max pacing time is equal
* Make `sample` method sync instead of async
* Fix bug of Timer stays live even there is no listener
* Add tests for mediasoup monitor and collectors
* Make mediasoup integration one line and everything is watched
* Send keepalive samples for in-, and outbound rtp pad when polling stats and no bytes are flowing on them

# 1.0.0

Init
