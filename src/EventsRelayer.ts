import { EventEmitter } from "events";
import { SfuSample } from "@observertc/schemas";
type StatsCollectedListener = () => void;
type SampleCreatedListener = (clientSample: SfuSample) => void;
type SampleSentListener = () => void;

export interface EventsRegister {
    onStatsCollected(listener: StatsCollectedListener): EventsRegister;
    offStatsCollected(listener: StatsCollectedListener): EventsRegister;

    onSampleCreated(listener: SampleCreatedListener): EventsRegister;
    offSampleCreated(listener: SampleCreatedListener): EventsRegister;

    onSamplesSent(listener: SampleSentListener): EventsRegister;
    offSamplesSent(listener: SampleSentListener): EventsRegister;

    onSenderDisconnected(listener: SampleSentListener): EventsRegister;
    offSenderDisconnected(listener: SampleSentListener): EventsRegister;
}

export interface EventsEmitter {
    emitStatsCollected(peerConnectionId: string): void;
    emitSampleCreated(sfuSample: SfuSample): void;
    emitSamplesSent(): void;
    emitSenderDisconnected(): void;
}

const ON_STATS_COLLECTED_EVENT_NAME = "onStatsCollected";
const ON_SAMPLE_CREATED_EVENT_NAME = "onSampleCreated";
const ON_SAMPLES_SENT_EVENT_NAME = "onSamplesSent";
const ON_SENDER_DISCONNECTED_EVENT_NAME = "onSenderDisconnected";

export class EventsRelayer implements EventsRegister, EventsEmitter {
    public static create(): EventsRelayer {
        return new EventsRelayer();
    }
    private _emitter: EventEmitter;
    private constructor() {
        this._emitter = new EventEmitter();
    }

    onStatsCollected(listener: StatsCollectedListener): EventsRegister {
        this._emitter.on(ON_STATS_COLLECTED_EVENT_NAME, listener);
        return this;
    }

    emitStatsCollected(): void {
        this._emitter.emit(ON_STATS_COLLECTED_EVENT_NAME);
    }

    offStatsCollected(listener: StatsCollectedListener): EventsRegister {
        this._emitter.off(ON_STATS_COLLECTED_EVENT_NAME, listener);
        return this;
    }

    onSampleCreated(listener: SampleCreatedListener): EventsRegister {
        this._emitter.on(ON_SAMPLE_CREATED_EVENT_NAME, listener);
        return this;
    }

    emitSampleCreated(sfuSample: SfuSample): void {
        this._emitter.emit(ON_SAMPLE_CREATED_EVENT_NAME, sfuSample);
    }

    offSampleCreated(listener: SampleCreatedListener): EventsRegister {
        this._emitter.off(ON_SAMPLE_CREATED_EVENT_NAME, listener);
        return this;
    }

    onSamplesSent(listener: SampleSentListener): EventsRegister {
        this._emitter.on(ON_SAMPLES_SENT_EVENT_NAME, listener);
        return this;
    }

    emitSamplesSent(): void {
        this._emitter.emit(ON_SAMPLES_SENT_EVENT_NAME);
    }

    offSamplesSent(listener: SampleSentListener): EventsRegister {
        this._emitter.off(ON_SAMPLES_SENT_EVENT_NAME, listener);
        return this;
    }

    onSenderDisconnected(listener: SampleSentListener): EventsRegister {
        this._emitter.on(ON_SENDER_DISCONNECTED_EVENT_NAME, listener);
        return this;
    }

    emitSenderDisconnected(): void {
        this._emitter.emit(ON_SENDER_DISCONNECTED_EVENT_NAME);
    }

    offSenderDisconnected(listener: SampleSentListener): EventsRegister {
        this._emitter.off(ON_SENDER_DISCONNECTED_EVENT_NAME, listener);
        return this;
    }
}
