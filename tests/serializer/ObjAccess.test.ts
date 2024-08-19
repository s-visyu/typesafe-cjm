import {IncorrectKeyAccess, KeyAccessObjectMisMatch, readJSONValueByString} from "../../src/serializer/ObjAccess.ts";
import {assert, describe, expect, test} from "vitest";

describe('readJSONValueByString', () => {
    test('simpleKeys', () => {
        const testObj = {
            'simple1': true,
            'simple2': false,
            'simple3': "string",
            'simple4': 1,
            'simple5': [0, "string1", "string2", true, false],
            'simple6': {a: "string1", b: true, c: 2}
        };

        expect(readJSONValueByString('simple1', testObj)).toBeTruthy();
        expect(readJSONValueByString('simple2', testObj)).toBeFalsy();
        expect(readJSONValueByString('simple3', testObj)).toMatch('string');
        expect(readJSONValueByString('simple4', testObj)).toEqual(1);

        expect(readJSONValueByString('simple5', testObj)).toSatisfy((e) => Array.isArray(e));
        expect(readJSONValueByString('simple5[0]', testObj)).toEqual(0);
        expect(readJSONValueByString('simple5[1]', testObj)).toMatch('string1');
        expect(readJSONValueByString('simple5[2]', testObj)).toMatch('string2');
        expect(readJSONValueByString('simple5[3]', testObj)).toBeTruthy();
        expect(readJSONValueByString('simple5[4]', testObj)).toBeFalsy();

        expect(readJSONValueByString('simple6', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('simple6.a', testObj)).toMatch('string1');
        expect(readJSONValueByString('simple6.b', testObj)).toBeTruthy();
        expect(readJSONValueByString('simple6.c', testObj)).toEqual(2);
    });

    test('complexKeys', () => {
        const testObj = {
            c1: {c11: 'string', c12: 1, c13: {c131: [0, true]}},
            c2: [{
                c210: [1, {c2101: "string"}, "string"],
                c211: true, c212: {c2111: "string"}
            }],
            c3: [[{c3001: [0]}]]
        }

        expect(readJSONValueByString('c1', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('c1.c11', testObj)).toMatch('string');
        expect(readJSONValueByString('c1.c12', testObj)).toBe(1);

        expect(readJSONValueByString('c1.c13', testObj)).toBeTypeOf("object");
        expect(readJSONValueByString('c1.c13.c131', testObj)).toSatisfy(e => Array.isArray(e));
        expect(readJSONValueByString('c1.c13.c131[0]', testObj)).toEqual(0);
        expect(readJSONValueByString('c1.c13.c131[1]', testObj)).toBeTruthy;

        expect(readJSONValueByString('c2[0]', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('c2[0].c210', testObj)).toSatisfy(e => Array.isArray(e));
        expect(readJSONValueByString('c2[0].c210[0]', testObj)).toEqual(1);
        expect(readJSONValueByString('c2[0].c210[1]', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('c2[0].c210[1].c2101', testObj)).toMatch('string');
        expect(readJSONValueByString('c2[0].c210[2]', testObj)).toMatch('string');

        expect(readJSONValueByString('c2[0].c211', testObj)).toBeTruthy;

        expect(readJSONValueByString('c2[0].c212', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('c2[0].c212.c2111', testObj)).toMatch('string');

        expect(readJSONValueByString('c3', testObj)).toSatisfy(e => Array.isArray(e));
        expect(readJSONValueByString('c3[0]', testObj)).toSatisfy(e => Array.isArray(e));
        expect(readJSONValueByString('c3[0][0]', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('c3[0][0].c3001', testObj)).toSatisfy(e => Array.isArray(e));
        expect(readJSONValueByString('c3[0][0].c3001[0]', testObj)).toEqual(0);
    });

    test('arrayStart', () => {
        const testObj = [{a: 'string'}, 1, true];

        expect(readJSONValueByString('[0]', testObj)).toBeTypeOf('object');
        expect(readJSONValueByString('[1]', testObj)).toEqual(1);
        expect(readJSONValueByString('[2]', testObj)).toBeTruthy();
    });

    test('errorHandling', () => {
        const testObj = {a: 1, b: [0]};

        assert.throws(() => readJSONValueByString("", testObj), IncorrectKeyAccess);
        assert.throws(() => readJSONValueByString("a.", testObj), IncorrectKeyAccess);
        assert.throws(() => readJSONValueByString("[a]", testObj), IncorrectKeyAccess, 'key: [a]');

        assert.throws(() => readJSONValueByString("a[0]", testObj), KeyAccessObjectMisMatch, 'Tried to access a[0] of 1');
        assert.throws(() => readJSONValueByString("a[2]", testObj), KeyAccessObjectMisMatch, 'Tried to access a[2] of 1');

        assert.throws(() => readJSONValueByString("b[1][1]", testObj), KeyAccessObjectMisMatch, 'Tried to access [1] of [0]');
        assert.throws(() => readJSONValueByString("b[0][1]", testObj), KeyAccessObjectMisMatch);

        assert.throws(() => readJSONValueByString("b[][][]", testObj), IncorrectKeyAccess, /cannot access invalid indices .*/);
        assert.throws(() => readJSONValueByString("b[0][][a]", testObj), IncorrectKeyAccess);
        assert.throws(() => readJSONValueByString("b[0][a][0]", testObj), IncorrectKeyAccess);
    })
});