PoC for an SFU observer

## Quick Start

Navigate to the SFU you want to use:

```shell
    npm i sfu-observer-js
```

Let's say you want to observe a mediasoup SFU.

in your code:

```javascript
    const { MediasoupSfuObserver } = require("sfu-observer-js");

    // ...
    
    const sfuObserver = MediasoupSfuObserver.builder()
        
        // the mediasoup global object
        .withMediasoup(mediasoup) 
        
        // the observer access point for sfu samples
        .withEndpoint("wss://localhost:7080/sfusamples/my-sfu-media-unit") 
        
        .build();

    // hook event handler and start monitoring
    sfuObserver
        .onSample(sample => {
            console.log("sfu sample", sample);
        })
        .onError(error => {
            console.warn("An error occurred", error);
        })

        // Let's Rock!
        .start();

    // and stop monitoring whenever you wish
    sfuObserver.stop();
```
