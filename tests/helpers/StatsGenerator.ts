import { v4 as uuidv4 } from "uuid";
import { SfuInboundRtpPad, SfuOutboundRtpPad, SfuTransport, SfuSctpChannel } from "@observertc/schemas";

const DEFAULT_MEDIA_STREAM_ID = uuidv4();
const DEFAULT_MEDIA_SINK_ID = uuidv4();
const DEFAULT_INBOUND_RTP_PAD_ID = uuidv4();
const DEFAULT_OUTBOUND_RTP_PAD_ID = uuidv4();
const DEFAULT_TRANSPORT_ID = uuidv4();
const DEFAULT_SCTP_STREAM_ID = uuidv4();
const DEFAULT_SCTP_CHANNEL_ID = uuidv4();
const DEFAULT_INBOUND_RTP_SSRC = generateIntegerBetween(199999, 9999999);
const DEFAULT_OUTBOUND_RTP_SSRC = generateIntegerBetween(199999, 9999999);

function generateFloat(min = 0.0, max = 100.0): number {
    const result = Math.random() * (max - min + 1) + min;
    return result;
}

function generateIntegerBetween(min = 0, max = 1000): number {
    const float = generateFloat(min, max);
    const result = Math.floor(float);
    return result;
}

function generateFrom<T>(...params: T[]): T{
    if (!params) {
        throw new Error(`Cannot generate random items from an empty array`);
    }
    const result = params[Math.floor(Math.random() * params.length)];
    return result;
}

export function createSfuInboundRtpPad(data?: any) {
    const result: SfuInboundRtpPad = {
        transportId: DEFAULT_TRANSPORT_ID,
        streamId: DEFAULT_MEDIA_STREAM_ID,
        padId: DEFAULT_INBOUND_RTP_PAD_ID,
        ssrc: DEFAULT_INBOUND_RTP_SSRC,
        mediaType: generateFrom<"audio" | "video">("audio", "video"),
        ...(data || {}),
    };
    return result;
}

export function createSfuOutboundRtpPad(data?: any) {
    const result: SfuOutboundRtpPad = {
        transportId: DEFAULT_TRANSPORT_ID,
        streamId: DEFAULT_MEDIA_STREAM_ID,
        sinkId: DEFAULT_MEDIA_SINK_ID,
        padId: DEFAULT_OUTBOUND_RTP_PAD_ID,
        ssrc: DEFAULT_OUTBOUND_RTP_SSRC,
        mediaType: generateFrom<"audio" | "video">("audio", "video"),
        ...(data || {}),
    };
    return result;
}

export function createSfuTransport(data?: any) {
    const result: SfuTransport = {
        transportId: DEFAULT_TRANSPORT_ID,
        ...(data || {}),
    };
    return result;
}

export function createSfuSctpChannel(data?: any) {
    const result: SfuSctpChannel = {
        transportId: DEFAULT_TRANSPORT_ID,
        streamId: DEFAULT_SCTP_STREAM_ID,
        channelId: DEFAULT_SCTP_CHANNEL_ID,
        ...(data || {}),
    };
    return result;
}
