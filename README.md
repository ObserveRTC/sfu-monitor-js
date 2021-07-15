SFU observer PoC

## Quick Start

Navigate to the SFU you want to use:

```shell
    npm i sfu-observer-js
```

Let's say you want to observe a mediasoup SFU.

in your code:

```javascript
    const sfuObserver = MediasoupSfuObserver.builder()
        .withMediasoup(mediasoup) 
        .build();

    // hook event handler and start monitoring
    sfuObserver
        .onSample(sample => {
            console.log("sfu sample", sample);
        })
        .onError(error => {
            console.warn("An error occurred", error);
        })
    ;

    // start monitoring wherenewer you want
    sfuObserver.start();

    // and stop monitoring whenever you wish
    sfuObserver.stop();
```
