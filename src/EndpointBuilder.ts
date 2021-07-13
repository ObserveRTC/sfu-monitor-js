export class EndpointBuilder {
    private _mediaUnitId: string | null = null;
    private _host: string | null = null;
    private _port: number | null = null;
    private _ssl = false;
    
    withPortNumber(port: number): EndpointBuilder {
        this._port = port;
        return this;
    }

    withSsl(): EndpointBuilder {
        this._ssl = true;
        return this;
    }

    withMediaUnitId(mediaUnitId: string): EndpointBuilder {
        this._mediaUnitId = mediaUnitId;
        return this;
    }
    
    withHost(host: string): EndpointBuilder {
        this._host = host;
        return this;
    }

    build(): string {
        if (this._host === null || this._mediaUnitId === null) {
            throw new Error(`Neither host (${this._host}) nor the mediaUnitId (${this._mediaUnitId})`);
        }
        let endpoint;
        if (this._port !== null) {
            endpoint = `${this._host}:${this._port}`;
        } else {
            endpoint = `${this._host}`;
        }
        const ws = this._ssl ? "wss" : "ws";
        
        const result = `${ws}://${endpoint}/sfusamples/${this._mediaUnitId}`;
        return result;
    }
}