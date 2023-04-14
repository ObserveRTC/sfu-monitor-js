import { SfuTransport } from "@observertc/sample-schemas-js";
import { createLogger } from "../utils/logger";
import { MediasoupDirectTransportStats, MediasoupPipeTransportStats, MediasoupPlainTransportStats, MediasoupTransportSurrogate, MediasoupWebRtcTransportStats } from "./MediasoupTypes";

const logger = createLogger('CollectTransportStats');

export function getTransportType(transport: MediasoupTransportSurrogate): 'PlainTransport' | 'PipeTransport' | 'WebRtcTransport' | 'DirectTransport' {
	switch (transport.constructor.name) {
		case "PlainTransport":
			return 'PlainTransport';
		case "PipeTransport":
			return 'PipeTransport';
		case "DirectTransport":
			return 'DirectTransport';
		default:
			logger.warn(`Cannot infer transport type from transport constructor: ${transport.constructor.name}`);
			// eslint-disable no-fallthrough
		case "WebRtcTransport":
			return 'WebRtcTransport';
	}
}

export function collectNoTransportStats(
	internal: boolean,
	transport: MediasoupTransportSurrogate,
): SfuTransport {
	return {
		transportId: transport.id,
		internal: internal,
		noReport: true,
	}
}

export async function collectWebRtcTransportStats(
	internal: boolean,
	transport: MediasoupTransportSurrogate,
): Promise<SfuTransport[]> {
	const transportId = transport.id;
	const polledStats = await transport.getStats();
	if (polledStats.length < 1) {
		return [collectNoTransportStats(
			internal,
			transport
		)]
	}
	const result: SfuTransport[] = [];
	for (const msStats of polledStats) {
		const stats = msStats as MediasoupWebRtcTransportStats;
		const {
			localIp: localAddress,
			protocol,
			localPort,
			remoteIp: remoteAddress,
			remotePort,
		} = stats.iceSelectedTuple ?? {};
		const transportStats: SfuTransport = {
			transportId,
			noReport: false,
			dtlsState: stats.dtlsState,
			iceState: stats.iceState,
			sctpState: stats.sctpState,
			iceRole: stats.iceRole,
			localAddress,
			localPort,
			protocol,
			remoteAddress,
			remotePort,
			rtpBytesReceived: stats.rtpBytesReceived,
			rtpBytesSent: stats.rtpBytesSent,
			// rtpPacketsReceived: stats.rtpPacketsReceived,
			// rtpPacketsSent: stats.rtpPacketsSent,
			// rtpPacketsLost: stats.rtpPacketsLost,
			rtxBytesReceived: stats.rtxBytesReceived,
			rtxBytesSent: stats.rtxBytesSent,
			// rtxPacketsReceived: stats.rtxPacketsReceived,
			// rtxPacketsSent: stats.rtxPacketsSent,
			// rtxPacketsLost: stats.rtxPacketsLost,
			// rtxPacketsDiscarded: stats.rtxPacketsDiscarded,
			// sctpBytesReceived: stats.sctpBytesReceived,
			// sctpBytesSent: stats.sctpBytesSent,
			// sctpPacketsReceived: stats.sctpPacketsReceived,
			// sctpPacketsSent: stats.sctpPacketsSent,
		};
		result.push(transportStats);
	}
	return result;
}



export async function collectDirectTransportStats(
	internal: boolean,
	transport: MediasoupTransportSurrogate,
): Promise<SfuTransport[]> {
	const transportId = transport.id;
	const polledStats = await transport.getStats();
	if (polledStats.length < 1) {
		return [collectNoTransportStats(
			internal,
			transport
		)]
	}
	const result: SfuTransport[] = [];
	for (const msStats of polledStats) {
		const stats = msStats as MediasoupDirectTransportStats;
		const transportStats: SfuTransport = {
			transportId,
			noReport: false,
			rtpBytesReceived: stats.rtpBytesReceived,
			rtpBytesSent: stats.rtpBytesSent,
			rtxBytesReceived: stats.rtxBytesReceived,
			rtxBytesSent: stats.rtxBytesSent,
		};
		result.push(transportStats);
	}
	return result;
}

export async function collectPipeTransportStats(
	internal: boolean,
	transport: MediasoupTransportSurrogate,
): Promise<SfuTransport[]> {
	const transportId = transport.id;
	const polledStats = await transport.getStats();
	if (polledStats.length < 1) {
		return [collectNoTransportStats(
			internal,
			transport
		)]
	}
	const result: SfuTransport[] = [];
	for (const msStats of polledStats) {
		const stats = msStats as MediasoupPipeTransportStats;
		const {
			localIp: localAddress,
			protocol,
			localPort,
			remoteIp: remoteAddress,
			remotePort,
		} = stats.tuple ?? {};
		const transportStats: SfuTransport = {
			internal: true,
			noReport: false,
			transportId,
			localAddress,
			localPort,
			protocol,
			remoteAddress,
			remotePort,
			rtpBytesReceived: stats.rtpBytesReceived,
			rtpBytesSent: stats.rtpBytesSent,
			rtxBytesReceived: stats.rtxBytesReceived,
			rtxBytesSent: stats.rtxBytesSent,
		};
		result.push(transportStats);
	}
	return result;
}



export async function collectPlainTransportStats(
	internal: boolean,
	transport: MediasoupTransportSurrogate,
): Promise<SfuTransport[]> {
	const transportId = transport.id;
	const polledStats = await transport.getStats();
	if (polledStats.length < 1) {
		return [collectNoTransportStats(
			internal,
			transport
		)]
	}
	const result: SfuTransport[] = [];
	for (const msStats of polledStats) {
		const stats = msStats as MediasoupPlainTransportStats;
		const {
			localIp: localAddress,
			protocol,
			localPort,
			remoteIp: remoteAddress,
			remotePort,
		} = stats.tuple ?? {};
		const transportStats = {
			transportId,
			noReport: false,
			localAddress,
			localPort,
			protocol,
			remoteAddress,
			remotePort,
			rtpBytesReceived: stats.rtpBytesReceived,
			rtpBytesSent: stats.rtpBytesSent,
			rtxBytesReceived: stats.rtxBytesReceived,
			rtxBytesSent: stats.rtxBytesSent,
		};
		result.push(transportStats);
	}
	return result;
}

