import {assert, beforeEach, expect, test} from "vitest";
import {Json} from "../../src/serializer/JsonSerializer.ts";
import {SerializedArray, SerializedClass, SerializedObject} from "../../src/serializer/SerializeTypes.ts";
import {
    CircularReferenceError,
    NotImplementedError,
    UnknownObjectTypeError
} from "../../src/serializer/SerializeErrors.ts";

export class TestUser {
    @Json.Prop("int") id: number = 0;
    @Json.Prop("string") name: string = '';
    @Json.Prop("float") anyFloat: number = 0.205;
    @Json.Prop("boolean") isActive: boolean = false;
    @Json.Prop(SerializedArray("int")) numbers: number[] = [];
    @Json.Prop(SerializedArray("string")) strings: string[] = [];
    @Json.Prop(SerializedArray("boolean")) booleans: boolean[] = [];
    @Json.Prop(SerializedArray(SerializedArray("int"))) nestedNumbers: number[][] = [];
    @Json.Prop(SerializedArray(SerializedArray(SerializedArray("string")))) multiNestedStrings: string[][][] = [];
    @Json.Prop("dateTime") createdAt = new Date();

    @Json.Prop(SerializedObject({
        id: "int",
        anyFloat: "float",
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

test('fn.serialize', () => {
    const serialized = serializer.serialize(testUser1);

    expect(serialized).toBeTypeOf("object");

    const objectTest = testUser1.objectTest;
    objectTest.createdAt = objectTest.createdAt.toString();

    expect(serialized).toMatchObject({
        id: testUser1.id,
        name: testUser1.name,
        isActive: testUser1.isActive,
        numbers: testUser1.numbers,
        strings: testUser1.strings,
        booleans: testUser1.booleans,
        nestedNumbers: testUser1.nestedNumbers,
        multiNestedStrings: testUser1.multiNestedStrings,
        createdAt: testUser1.createdAt.toString(),
        objectTest: testUser1.objectTest,
    })

    class UnknownPropSerialize {
        @Json.Prop("unknown") unknown: string = "";
    }

    assert.throws(() => serializer.serialize(new UnknownPropSerialize()), NotImplementedError);
    assert.throws(() => serializer.deserialize({unknown: "dkasd"}, UnknownPropSerialize), NotImplementedError);

    class UnknownObjectSerialize {
        @Json.Prop(SerializedObject({notAn: "boolean"})) notAnObject = {};
    }

    assert.throws(() => {
        const a = new UnknownObjectSerialize();
        a.notAnObject = "";
        serializer.serialize(a)
    }, UnknownObjectTypeError);
    assert.throws(() => serializer.deserialize({notAnObject: ""}, UnknownObjectSerialize), UnknownObjectTypeError);
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

    // ToDo createdAt
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

    // serialized class prop
    class SerializedClassPropSimple {
        @Json.Prop(SerializedClass(SimpleClass)) simpleClass: SimpleClass = new SimpleClass({id: 0});
    }

    const serializedClassPropSimple = new SerializedClassPropSimple();
    serializedClassPropSimple.simpleClass.id = 100;
    serialized = serializer.serialize(serializedClassPropSimple);
    deserialized = serializer.deserialize(serialized, SerializedClassPropSimple);

    expect(deserialized).toMatchObject(serializedClassPropSimple);

    class SerializedClassPropComplex {
        @Json.Prop(SerializedClass(ComplexClass)) complexClass: ComplexClass = new ComplexClass(0, "");
    }

    const serializedClassPropComplex = new SerializedClassPropComplex();
    serializedClassPropComplex.complexClass.id = 100;
    serializedClassPropComplex.complexClass.name = "DIjasid jaisj asd ";
    serialized = serializer.serialize(serializedClassPropComplex);
    deserialized = serializer.deserialize(serialized, SerializedClassPropComplex);

    expect(deserialized).toMatchObject(serializedClassPropComplex);

    // serialized class prop with any class
    class SerializedClassPropOtherClass {
        @Json.Prop(SerializedClass(Date)) date: Date = new Date();
    }

    const serializedClassPropOtherClass = new SerializedClassPropOtherClass();
    assert.doesNotThrow(() => serialized = serializer.serialize(serializedClassPropOtherClass));
    assert.doesNotThrow(() => deserialized = serializer.deserialize(serialized, SerializedClassPropOtherClass));
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
    let lowLevelSerializer = new Json(1);

    class ClassFail {
        @Json.Prop(SerializedClass(ClassFail)) classOk: ClassFail;
    }

    const a = new ClassFail();
    a.classOk = new ClassFail();

    assert.throws(() => lowLevelSerializer.serialize(a), "Max levels reached for serialization");
    assert.throws(() => lowLevelSerializer.deserialize({classOk: undefined}, ClassFail), "Max levels reached for deserialization");

    lowLevelSerializer = new Json(2);

    class ClassFail2 {
        @Json.Prop(SerializedObject({
            id: "int",
            obj: SerializedObject({name: "string"})
        })) someObj = {};
    }

    const b = new ClassFail2();
    b.someObj = {
        id: 500,
        obj: {name: "Hello world"}
    }

    assert.throws(() => lowLevelSerializer.serialize(b), "Max levels reached for serialization")
    assert.throws(() => lowLevelSerializer.deserialize({
        someObj: {
            id: 450,
            obj: {name: "Hello world2"}
        }
    }, ClassFail2), "Max levels reached for deserialization")
});

test('Required', () => {
    class AnyClass {
        @Json.Prop("int") id?: number;
        @Json.Prop("string") name?: string;
    }

    class RequiredClass {
        @Json.Prop("int", true) id?: number;
        @Json.Prop("string", true) name: string = "";
    }

    class ExtendedRequiredClass extends RequiredClass {
        @Json.Prop("int", true) extendedID?: number;
        @Json.Prop(SerializedArray("int"), true) numbers?: number[];
        @Json.Prop(SerializedObject({a: "int", numbers: SerializedArray("int")}), true) object?: any;
        @Json.Prop(SerializedClass(AnyClass), true) required: AnyClass;

        @Json.Prop("string") ok?: string;
        @Json.Prop("int") ok2?: number;
        @Json.Prop(SerializedClass(RequiredClass), false) ok3?: RequiredClass;
    }

    const a = new RequiredClass();
    assert.throws(() => serializer.serialize(a), "Required prop 'id' is not set");
    assert.throws(() => serializer.deserialize({name: "Hello"}, RequiredClass), "Required prop 'id' is not set");
    assert.throws(() => serializer.deserialize({id: 100}, RequiredClass), "Required prop 'name' is not set");
    assert.doesNotThrow(() => serializer.deserialize({id: 100, name: "Hello"}, RequiredClass));

    const b = new ExtendedRequiredClass();
    b.id = 100;
    assert.throws(() => serializer.serialize(b), "Required prop 'extendedID' is not set");
    b.extendedID = 50;
    assert.throws(() => serializer.serialize(b), "Required prop 'numbers' is not set");
    b.numbers = [1, 2, 3];
    assert.throws(() => serializer.serialize(b), "Required prop 'object' is not set");
    b.object = {a: 100, numbers: [1, 2, 3]};
    assert.throws(() => serializer.serialize(b), "Required prop 'required' is not set");
    b.required = new AnyClass();
    assert.doesNotThrow(() => serializer.serialize(b));

    assert.throws(() => serializer.deserialize({
        name: "Hello",
        extendedID: 100
    }, ExtendedRequiredClass), "Required prop 'id' is not set");
    assert.throws(() => serializer.deserialize({
        id: 100,
        name: "Hello"
    }, ExtendedRequiredClass), "Required prop 'extendedID' is not set");
    assert.throws(() => serializer.deserialize({
        id: 100,
        extendedID: 100
    }, ExtendedRequiredClass), "Required prop 'name' is not set");
    assert.throws(() => serializer.deserialize({
        id: 100,
        name: "Hello",
        extendedID: 100
    }, ExtendedRequiredClass), "Required prop 'numbers' is not set");
    assert.doesNotThrow(() => serializer.deserialize({
        id: 100,
        name: "Hello",
        extendedID: 100,
        numbers: [1, 2, 3],
        object: {a: 100, numbers: [1, 2, 3]},
        required: {id: 100}
    }, ExtendedRequiredClass));
})