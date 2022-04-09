import { RestTransportConfig } from "./RestTransport";
import { WebsocketTransportConfig } from "./WebsocketTransport";

type MessageListener = (data: string) => void;
/*eslint-disable @typescript-eslint/no-explicit-any*/

export type TransportConfig = {
    websocket?: WebsocketTransportConfig;
    rest?: RestTransportConfig;
}

export interface Transport {
    send(data: Uint8Array): Promise<void>;

    onReceived(listener: MessageListener): Transport;
    offReceived(listener: MessageListener): Transport;

    readonly closed: boolean;
    close(): void;
}
