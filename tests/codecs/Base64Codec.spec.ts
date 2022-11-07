import { Base64Codec } from "../../src/codecs/Base64Codec";

describe("Base64Codec", () => {
    it("encodes / decodes", () => {
        const codec = Base64Codec.create();
        const expected: any = { foo: 1, bar: "2" };
        const input: string = JSON.stringify(expected);
        const encoded = codec.encode(Buffer.from(input));
        const decoded = codec.decode(encoded);
        const output = Buffer.from(decoded).toString();
        const actual = JSON.parse(output);
        expect(actual).toEqual(expected);
    });
});
