import { SfuSctpChannel } from "@observertc/sample-schemas-js";
import { MediasoupDataProducerSurrogate } from "./MediasoupTypes";

export function collectNoDataProducerStats(
	transportId: string,
	internal: boolean,
	dataProducer: MediasoupDataProducerSurrogate,
): SfuSctpChannel {
	return {
		transportId,
		streamId: dataProducer.id,
		channelId: dataProducer.id,
		noReport: true,
		internal,
	}
}

export async function collectDataProducerStats(
	transportId: string,
	internal: boolean,
	dataProducer: MediasoupDataProducerSurrogate,
): Promise<SfuSctpChannel[]> {
	const polledStats = await dataProducer.getStats();
	if (polledStats.length < 1) {
		return [collectNoDataProducerStats(
			transportId,
			internal,
			dataProducer,
		)]
	}

	const result: SfuSctpChannel[] = [];
	for (const stats of polledStats) {
		const sctpChannel: SfuSctpChannel = {
			transportId,
			noReport: false,
			streamId: dataProducer.id,
			channelId: dataProducer.id,
			label: stats.label,
			protocol: stats.protocol,
			internal,
			// sctpSmoothedRoundTripTime: stats.sctpSmoothedRoundTripTime,
			// sctpCongestionWindow: stats.sctpCongestionWindow,
			// sctpReceiverWindow: stats.sctpReceiverWindow,
			// sctpMtu: stats.sctpMtu,
			// sctpUnackData: stats.sctpUnackData,
			messageReceived: stats.messagesReceived,
			// messageSent: stats.messageSent,
			bytesReceived: stats.bytesReceived,
			// bytesSent: stats.bytesSent,
		};
		result.push(sctpChannel);
	}
	return result;
}