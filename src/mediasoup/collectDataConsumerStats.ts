import { SfuSctpChannel } from "@observertc/sample-schemas-js";
import { MediasoupDataConsumerSurrogate } from "./MediasoupTypes";

export function collectNoDataConsumerStats(
	transportId: string,
	internal: boolean,
	dataConsumer: MediasoupDataConsumerSurrogate,
): SfuSctpChannel {
	return {
		transportId,
		streamId: dataConsumer.id,
		channelId: dataConsumer.id,
		noReport: true,
		internal,
	}
}

export async function collectDataConsumerStats(
	transportId: string,
	internal: boolean,
	dataConsumer: MediasoupDataConsumerSurrogate,
): Promise<SfuSctpChannel[]> {
	const polledStats = await dataConsumer.getStats();
	if (polledStats.length < 1) {
		return [collectNoDataConsumerStats(
			transportId,
			internal,
			dataConsumer,
		)]
	}

	const result: SfuSctpChannel[] = [];
	for (const stats of polledStats) {
		const sctpChannel: SfuSctpChannel = {
			transportId,
			noReport: false,
			streamId: dataConsumer.id,
			channelId: dataConsumer.id,
			label: stats.label,
			protocol: stats.protocol,
			internal,
			// sctpSmoothedRoundTripTime: stats.sctpSmoothedRoundTripTime,
			// sctpCongestionWindow: stats.sctpCongestionWindow,
			// sctpReceiverWindow: stats.sctpReceiverWindow,
			// sctpMtu: stats.sctpMtu,
			// sctpUnackData: stats.sctpUnackData,
			// messageReceived: stats.messagesReceived,
			messageSent: stats.messagesSent,
			// bytesReceived: stats.bytesReceived,
			bytesSent: stats.bytesSent,
		};
		result.push(sctpChannel);
	}
	return result;
}