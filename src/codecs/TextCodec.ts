import { Codec } from "./Codec";

/*eslint-disable  @typescript-eslint/ban-types*/
type EncodingType = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';
export type TextCodecConfig = {
    textEncoding?: EncodingType;
}

type TextCodecConstructorConfig = TextCodecConfig & {
    textEncoding: EncodingType;
};

const defaultConfig: TextCodecConstructorConfig = {
    textEncoding: "utf-8",
}

export class TextCodec implements Codec<string, Uint8Array> {
    public static create(config?: TextCodecConstructorConfig): TextCodec {
        const appliedConfig = Object.assign(defaultConfig, config);
        return new TextCodec(appliedConfig);
    }
    /*eslint-disable @typescript-eslint/no-unused-vars*/
    private _config: TextCodecConstructorConfig;
    private constructor(config: TextCodecConstructorConfig) {
        this._config = config;
    }

    encode(data: string): Uint8Array {
        const buffer = Buffer.from(data, "utf-8");
        return Uint8Array.from(buffer);
    }

    decode(data: Uint8Array): string {
        const buffer = Buffer.from(data);
        return buffer.toString("utf-8");
    }
}