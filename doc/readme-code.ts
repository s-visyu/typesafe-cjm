import {Json, SerializedArray, SerializedClass, SerializedObject} from "../src";

class ReadmeCode {
    @Json.Prop("string") code: string = "";
}

class Primitives {
    @Json.Prop("int") anInt: number = 0;
    @Json.Prop("float") aFloat: number = 0;
    @Json.Prop("string") aString: string = "";
    @Json.Prop("boolean") aBoolean: boolean = false;
    @Json.Prop("dateTime") aDateTime: Date = new Date();
}

class Array {
    @Json.Prop(SerializedArray(Primitives)) primitives: Primitives[] = [];
}

class Object {
    @Json.Prop(SerializedObject({
        code: "string",
        primitives: SerializedClass(Primitives),
        array: SerializedClass(Array)
    })) obj: any = {};
}

class NestedObject {
    @Json.Prop(SerializedObject({
        code: "string",
        obj: SerializedObject({
            code: "string",
            primitives: SerializedClass(Primitives),
            array: SerializedClass(Array)
        })
    })) obj: any = {};
}

class RequiredProperties {
    @Json.Prop("string", true) requiredString: string = "";
    @Json.Prop("string") optionalString?: string;
}

@Json.Constructor()
class ConstructorInjection {
    @Json.Prop("string") str: string = "";

    constructor(args: { str: string }) {
        this.str = args.str;
    }
}

@Json.Constructor(["str", "number"])
class ConstructorInjection2 {
    @Json.Prop("string") str: string = "";
    @Json.Prop("int") number: number = 0;

    constructor(str: string, number: number) {
        this.str = str;
        this.number = number;
    }
}

// serialize
const serializer = new Json();
const obj = new ConstructorInjection2("test", 123);
const json = serializer.serialize(obj);

// deserialize
const serializer = new Json();
const obj = serializer.deserialize({
    str: "test",
    number: 123
}, ConstructorInjection2);


