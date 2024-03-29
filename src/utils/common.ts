/*eslint-disable @typescript-eslint/ban-types*/
/*eslint-disable @typescript-eslint/no-explicit-any*/
export function makePrefixedObj(obj: any, prefix?: string, camelCase?: boolean): Object {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = camelCase ? key.charAt(0).toUpperCase() + key.slice(1) : key;
        result[`${prefix}${newKey}`] = value;
    }
    return result;
}

export const NULL_UUID = "00000000-0000-0000-0000-000000000000";

export enum SFU_EVENT {
    SFU_TRANSPORT_OPENED = "SFU_TRANSPORT_OPENED",
    SFU_TRANSPORT_CLOSED = "SFU_TRANSPORT_CLOSED",
    SFU_RTP_STREAM_ADDED = "SFU_RTP_STREAM_ADDED",
    SFU_RTP_STREAM_REMOVED = "SFU_RTP_STREAM_REMOVED",
}