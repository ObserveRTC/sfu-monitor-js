import { SfuInboundRtpPadBuilder } from "./SfuInboundRtpPadBuilder";
import { SctpStream, SfuInboundRtpPad, SfuOutboundRtpPad, SfuTransport } from "./SfuSample";

export interface SfuVisitor {
    visitInboundRtpPads(): AsyncGenerator<SfuInboundRtpPad, void, void>;
    visitOutbooundRtpPads() : AsyncGenerator<SfuOutboundRtpPad, void, void>;
    visitTransports() : AsyncGenerator<SfuTransport, void, void>;
    visitSctpStreams() : AsyncGenerator<SctpStream, void, void>;
}