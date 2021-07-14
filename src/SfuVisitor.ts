import { SctpStream, SfuInboundRtpStream, SfuOutboundRtpStream, SfuTransport } from "./SfuSample";

export interface SfuVisitor {
    visitInboundRtpStreams(): IterableIterator<SfuInboundRtpStream>;
    visitOutboundRtpStreams() : IterableIterator<SfuOutboundRtpStream>;
    visitTransports() : IterableIterator<SfuTransport>;
    visitSctpStreams() : IterableIterator<SctpStream>;
}