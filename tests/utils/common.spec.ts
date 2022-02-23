import { makePrefixedObj } from "../../src/utils/common";

describe("common", () => {
    describe("makePrefixedObj", () => {
        it ("When prefix is given Then it adds the prefix", () => {
            const obj = {
                key: "value",
            }
            const prefixedObj = makePrefixedObj(obj, `prefixed`);
            expect(prefixedObj).toEqual({
                prefixedkey: "value",
            })
        });
        it ("When prefix is given with camelCase true Then it adds the prefix with camelCase", () => {
            const obj = {
                key: "value",
            }
            const prefixedObj = makePrefixedObj(obj, `prefixed`, true);
            expect(prefixedObj).toEqual({
                prefixedKey: "value",
            })
        })
    })
})