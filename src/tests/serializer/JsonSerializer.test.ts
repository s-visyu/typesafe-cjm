import {assert, beforeEach, expect, test} from "vitest";
import {Json} from "../../serializer/JsonSerializer.ts";
import {SerializedArray, SerializedClass, SerializedObject} from "../../serializer/SerializeTypes.ts";
import {CircularReferenceError} from "../../serializer/SerializeErrors.ts";

export class TestUser {
    @Json.Prop("int") id: number = 0;
    @Json.Prop("string") name: string = '';
    @Json.Prop("boolean") isActive: boolean = false;
    @Json.Prop(SerializedArray("int")) numbers: number[] = [];
    @Json.Prop(SerializedArray("string")) strings: string[] = [];
    @Json.Prop(SerializedArray("boolean")) booleans: boolean[] = [];
    @Json.Prop(SerializedArray(SerializedArray("int"))) nestedNumbers: number[][] = [];
    @Json.Prop(SerializedArray(SerializedArray(SerializedArray("string")))) multiNestedStrings: string[][][] = [];
    @Json.Prop("dateTime") createdAt = new Date();

    @Json.Prop(SerializedObject({
        id: "int",
        name: "string",
        isActive: "boolean",
        numbers: SerializedArray("int"),
        strings: SerializedArray("string"),
        booleans: SerializedArray("boolean"),
        nestedNumbers: SerializedArray(SerializedArray("int")),
        multiNestedStrings: SerializedArray(SerializedArray(SerializedArray("string"))),
        createdAt: "dateTime",
    })) objectTest = {}
}

const serializer = new Json();

const testUser1 = new TestUser();
beforeEach(() => {
    testUser1.objectTest = {};
    testUser1.id = 100;
    testUser1.name = "Test User 1";
    testUser1.isActive = true;
    testUser1.numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    testUser1.strings = ["string1", "string2", "string3"];
    testUser1.booleans = [true, false, true, true, false];
    testUser1.nestedNumbers = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10]];
    testUser1.multiNestedStrings = [[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['10']]];
    testUser1.createdAt = new Date();
    testUser1.objectTest = {
        ...testUser1,
    }
    delete testUser1.objectTest.objectTest;
})

function checkSerializedTestUser(user: TestUser, serialized: any) {
    expect(serialized).toBeTypeOf("object");

    const objectTest = user.objectTest;
    objectTest.createdAt = objectTest.createdAt.toString();

    expect(serialized).toMatchObject({
        id: user.id,
        name: user.name,
        isActive: user.isActive,
        numbers: user.numbers,
        strings: user.strings,
        booleans: user.booleans,
        nestedNumbers: user.nestedNumbers,
        multiNestedStrings: user.multiNestedStrings,
        createdAt: user.createdAt.toString(),
        objectTest: user.objectTest,
    })
}

test('fn.serialize', () => {
    const serialized = serializer.serialize(testUser1);
    checkSerializedTestUser(testUser1, serialized);
});

test('fn.deserialize', () => {
    const serialized = serializer.serialize(testUser1);
    const deserialized = serializer.deserialize(serialized, TestUser);

    // ToDo write also test dateTime
    deserialized.createdAt = testUser1.createdAt;
    deserialized.objectTest.createdAt = testUser1.createdAt;
    expect(deserialized).toMatchObject(testUser1);
});

test('Extended classes', () => {
    class ExtendedUser extends TestUser {
        @Json.Prop("int") extendedID: number;
    }

    const extendedUser = new ExtendedUser();
    Object.assign(extendedUser, testUser1);
    extendedUser.extendedID = 1000;

    const serialized = serializer.serialize(extendedUser);
    const deseriized = serializer.deserialize(serialized, ExtendedUser);

    // ToDo
    deseriized.createdAt = extendedUser.createdAt;
    deseriized.objectTest.createdAt = extendedUser.createdAt;

    expect(deseriized).toMatchObject(extendedUser);
});

test('Constructor params', () => {
    @Json.Constructor()
    class SimpleClass {
        @Json.Prop("int") id: number;

        constructor(json: { id: number }) {
            this.id = json.id;
        }
    }

    const simpleInstance = new SimpleClass({id: 100});
    let serialized = serializer.serialize(simpleInstance);
    let deserialized = serializer.deserialize(serialized, SimpleClass);

    expect(deserialized).toMatchObject(simpleInstance);

    @Json.Constructor(['id', 'name'])
    class ComplexClass {
        @Json.Prop("int") id: number;
        @Json.Prop("string") name: string;

        constructor(id: number, name: string) {
            this.id = id;
            this.name = name;
        }
    }

    const complexInstance = new ComplexClass(100, "DJias jais ");
    serialized = serializer.serialize(complexInstance);
    deserialized = serializer.deserialize(serialized, ComplexClass);

    expect(deserialized).toMatchObject(complexInstance)
    // ToDO write test for extended classes
    // ToDo write test for SerializedClass properties
});

test('Circular references', () => {
    class CircularRef {
        @Json.Prop(SerializedClass(CircularRef)) circularClass: any;
    }

    const c1 = new CircularRef();
    const c2 = new CircularRef();
    c1.circularClass = c2;
    c2.circularClass = c1;

    assert.throws(() => serializer.serialize(c1), CircularReferenceError);
    assert.throws(() => serializer.serialize(c2), CircularReferenceError);

    class CircularRef2 {
        @Json.Prop(SerializedObject({
            a: SerializedObject({
                a: SerializedClass(CircularRef2)
            })
        })) circularObject: any;
    }

    const c21 = new CircularRef2();
    const c22 = new CircularRef2();
    c21.circularObject = {
        a: {a: c22}
    }
    c22.circularObject = {
        a: {a: c21}
    }

    assert.throws(() => serializer.serialize(c21), CircularReferenceError);
    assert.throws(() => serializer.serialize(c22), CircularReferenceError);
});

test('Max level', () => {

});