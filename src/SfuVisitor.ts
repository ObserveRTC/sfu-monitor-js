import { SfuRtpSourceBuilder } from "./SfuRtpSourceBuilder";
import { SctpStream, SfuRtpSource, SfuRtpSink, SfuTransport } from "./SfuSample";

export interface SfuVisitor {
    visitRtpSources(): AsyncGenerator<SfuRtpSource, void, void>;
    visitRtpSinks() : AsyncGenerator<SfuRtpSink, void, void>;
    visitTransports() : AsyncGenerator<SfuTransport, void, void>;
    visitSctpStreams() : AsyncGenerator<SctpStream, void, void>;
}