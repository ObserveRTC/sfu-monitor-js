import { SfuInboundRtpPad } from "@observertc/sample-schemas-js";
import { MediasoupProducerSurrogate } from "./MediasoupTypes";
import { v4 as uuid } from 'uuid';

const NO_REPORT_SSRC = 0xdeadbeef;

export function collectNoMediaProducerStats(
	transportId: string,
	internal: boolean,
	producer: MediasoupProducerSurrogate,
	ssrcToPadIds: Map<number, string>,
): SfuInboundRtpPad {
	let padId = ssrcToPadIds.get(NO_REPORT_SSRC);
        if (!padId) {
            padId = uuid();
            ssrcToPadIds.set(NO_REPORT_SSRC, padId);
        }
	return {
		ssrc: NO_REPORT_SSRC,
		padId,
		streamId: producer.id,
		mediaType: producer.kind,
		transportId,
		noReport: true,
		internal,
	}
}

export async function collectMediaProducerStats(
	transportId: string,
	internal: boolean,
	producer: MediasoupProducerSurrogate,
	ssrcToPadIds: Map<number, string>,
): Promise<SfuInboundRtpPad[]> {
	const polledStats = await producer.getStats();
	if (polledStats.length < 1) {
		return [collectNoMediaProducerStats(
			transportId,
			internal,
			producer,
			ssrcToPadIds,
		)]
	}

	const result: SfuInboundRtpPad[] = [];
	for (const stats of polledStats) {
		const ssrc = stats.ssrc;
		// if (type === msStats.type) continue;
		let padId = ssrcToPadIds.get(ssrc);
		if (!padId) {
			padId = uuid();
			ssrcToPadIds.set(ssrc, padId);
		}
		const inboundRtpPadStats: SfuInboundRtpPad = {
			transportId,
			noReport: false,
			streamId: producer.id,
			internal,

			padId,
			ssrc,
			mediaType: producer.kind,
			// payloadType: stats.payloadType,
			mimeType: stats.mimeType,
			// clockRate: stats.clockRate,
			sdpFmtpLine: stats.mimeType,
			rid: stats.mimeType,
			rtxSsrc: stats.rtxSsrc,
			// targetBitrate: stats.targetBitrate,
			// voiceActivityFlag: stats.voiceActivityFlag,
			firCount: stats.firCount,
			pliCount: stats.pliCount,
			nackCount: stats.nackCount,
			// sliCount: stats.sliCount,
			packetsLost: stats.packetsLost,
			packetsReceived: stats.packetCount,
			packetsDiscarded: stats.packetsDiscarded,
			packetsRepaired: stats.packetsRepaired,
			// packetsFailedDecryption: stats.packetsFailedDecryption,
			// packetsDuplicated: stats.packetsDuplicated,
			// fecPacketsReceived: stats.fecPacketsReceived,
			// fecPacketsDiscarded: stats.fecPacketsDiscarded,
			bytesReceived: stats.byteCount,
			// rtcpSrReceived: stats.rtcpSrReceived,
			// rtcpRrSent: stats.rtcpRrSent,
			// rtxPacketsReceived: stats.rtxPacketsReceived,
			rtxPacketsDiscarded: stats.rtxPacketsDiscarded,
			fractionLost: stats.fractionLost,
			jitter: stats.jitter,
			roundTripTime: stats.roundTripTime,
		};
		result.push(inboundRtpPadStats);
	}
	return result;
}