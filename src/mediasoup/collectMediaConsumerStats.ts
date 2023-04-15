import { SfuOutboundRtpPad } from "@observertc/sample-schemas-js";
import { MediasoupConsumerSurrogate } from "./MediasoupTypes";
import { v4 as uuid } from 'uuid';

const NO_REPORT_SSRC = 0xdeadbeef;

export function collectNoMediaConsumerStats(
	transportId: string,
	internal: boolean,
	consumer: MediasoupConsumerSurrogate,
	ssrcToPadIds: Map<number, string>,
): SfuOutboundRtpPad {
	let padId = ssrcToPadIds.get(NO_REPORT_SSRC);
	if (!padId) {
		padId = uuid();
		ssrcToPadIds.set(NO_REPORT_SSRC, padId);
	}
	return {
		ssrc: NO_REPORT_SSRC,
		padId,
		streamId: consumer.producerId,
		sinkId: consumer.id,
		mediaType: consumer.kind,
		transportId: transportId,
		noReport: true,
		internal,
	};
}

export async function collectMediaConsumerStats(
	transportId: string,
	internal: boolean,
	consumer: MediasoupConsumerSurrogate,
	ssrcToPadIds: Map<number, string>,
): Promise<SfuOutboundRtpPad[]> {
	const polledStats = await consumer.getStats();
	if (polledStats.length < 1) {
		return [collectNoMediaConsumerStats(
			transportId,
			internal,
			consumer,
			ssrcToPadIds,
		)]
	}

	const result: SfuOutboundRtpPad[] = [];
	for (const stats of polledStats) {
		const ssrc = stats.ssrc;
		// if (type === msStats.type) continue;
		let padId = ssrcToPadIds.get(ssrc);
		if (!padId) {
			padId = uuid();
			ssrcToPadIds.set(ssrc, padId);
		}
		const inboundRtpPadStats: SfuOutboundRtpPad = {
			transportId,
			noReport: false,
			streamId: consumer.producerId,
			sinkId: consumer.id,
			padId,
			ssrc: stats.ssrc,
			internal,

			mediaType: consumer.kind,
			// payloadType: stats.payloadType,
			mimeType: stats.mimeType,
			// clockRate: stats.clockRate,
			// sdpFmtpLine: stats.sdpFmtpLine,
			// rid: stats.rid,
			rtxSsrc: stats.rtxSsrc,
			// targetBitrate: stats.targetBitrate,
			// voiceActivityFlag: stats.voiceActivityFlag,
			firCount: stats.firCount,
			pliCount: stats.pliCount,
			nackCount: stats.nackCount,
			// sliCount: stats.sliCount,
			packetsLost: stats.packetsLost,
			packetsSent: stats.packetCount,
			packetsDiscarded: stats.packetsDiscarded,
			packetsRetransmitted: stats.packetsRetransmitted,
			// packetsFailedEncryption: stats.packetsFailedEncryption,
			// packetsDuplicated: stats.packetsDuplicated,
			// fecPacketsSent: stats.fecPacketsSent,
			// fecPacketsDiscarded: stats.fecPacketsDiscarded,
			bytesSent: stats.byteCount,
			// rtcpSrSent: stats.rtcpSrSent,
			// rtcpRrReceived: stats.rtcpRrReceived,
			// rtxPacketsSent: stats.rtxPacketsSent,
			// rtxPacketsDiscarded: stats.rtxPacketsDiscarded,
			// framesSent: stats.framesSent,
			// framesEncoded: stats.framesEncoded,
			// keyFramesEncoded: stats.keyFramesEncoded,
			fractionLost: stats.fractionLost,
			// jitter: stats.jitter,
			roundTripTime: stats.roundTripTime,
		};
		result.push(inboundRtpPadStats);
	}
	return result;
}