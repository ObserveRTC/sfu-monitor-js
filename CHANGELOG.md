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
