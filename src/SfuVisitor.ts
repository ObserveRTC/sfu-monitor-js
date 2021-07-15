import { SfuInboundRtpStreamBuilder } from "./SfuInboundRtpStreamBuilder";
import { SctpStream, SfuInboundRtpStream, SfuOutboundRtpStream, SfuTransport } from "./SfuSample";

export interface SfuVisitor {
    visitInboundRtpStreams(): AsyncGenerator<SfuInboundRtpStream, void, void>;
    visitOutboundRtpStreams() : AsyncGenerator<SfuOutboundRtpStream, void, void>;
    visitTransports() : AsyncGenerator<SfuTransport, void, void>;
    visitSctpStreams() : AsyncGenerator<SctpStream, void, void>;
}