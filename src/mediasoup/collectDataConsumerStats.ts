import { SfuSctpChannel } from "@observertc/sample-schemas-js";
import { MediasoupDataConsumerSurrogate } from "./MediasoupTypes";

/**
 * Creates an SfuSctpChannel object with noReport set to true.
 * This function is used when there are no stats available for a data consumer.
 *
 * @param transportId - The ID of the transport.
 * @param internal - Indicates whether the data consumer is internal.
 * @param dataConsumer - The MediasoupDataConsumerSurrogate object.
 * @returns A new SfuSctpChannel object.
 */
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

/**
 * Collects stats from a Mediasoup data consumer and returns an array of SfuSctpChannel objects.
 * If no stats are available, it returns an array with a single SfuSctpChannel object created by collectNoDataConsumerStats.
 *
 * @param transportId - The ID of the transport.
 * @param internal - Indicates whether the data consumer is internal.
 * @param dataConsumer - The MediasoupDataConsumerSurrogate object.
 * @returns A Promise that resolves to an array of SfuSctpChannel objects.
 */
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