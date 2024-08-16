import {Json} from "./JsonSerializer.ts";
import {SerializedArray, SerializedClass, SerializedObject} from "./SerializeTypes.ts";

class SomeEmptyClass {

}

class OtherClass {
    @Json.Prop("int") id: number = 0;
    @Json.Prop("string") name: string = '';
    @Json.Prop("boolean") isActive: boolean = false;
}

export class TestUser {
    @Json.Prop("int") id: number = 0;
    @Json.Prop("string") name: string = '';
    @Json.Prop("boolean") isActive: boolean = false;
    @Json.Prop(SerializedArray("int")) numbers: number[] = [];
    @Json.Prop(SerializedArray("string")) strings: string[] = [];
    @Json.Prop(SerializedArray("boolean")) booleans: boolean[] = [];
    @Json.Prop(SerializedArray(SerializedArray("int"))) nestedNumbers: number[][] = [];
    @Json.Prop(SerializedArray(SerializedArray(SerializedArray("string")))) multiNestedStrings: string[][][] = [];
    @Json.Prop(SerializedObject({
        id: "int",
        name: "string",
        isActive: "boolean",
        numbers: SerializedArray("int"),
        strings: SerializedArray("string"),
        booleans: SerializedArray("boolean"),
        nestedNumbers: SerializedArray(SerializedArray("int")),
        multiNestedStrings: SerializedArray(SerializedArray(SerializedArray("string"))),
    })) objectTest = {}
    @Json.Prop(SerializedClass(OtherClass)) otherClass = new OtherClass();
    @Json.Prop("dateTime") createdAt = new Date();
    @Json.Prop(SerializedClass(SomeEmptyClass)) emptyClass = new SomeEmptyClass();

    constructor(id: number, name: string, oneNumber: number) {
        console.log(id, name, oneNumber);
    }
}

export class SuperUser extends TestUser {
    @Json.Prop("string") superName = '';
}

const testUser = new SuperUser();
testUser.id = 1;
testUser.name = 'John Doe';
testUser.isActive = true;
testUser.numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
testUser.booleans = [true, false, true, false, true, false, true, false, true, false];
testUser.strings = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
testUser.nestedNumbers = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14, 15], [16, 17, 18], [19, 20, 21], [22, 23, 24], [25, 26, 27], [28, 29, 30]];
testUser.multiNestedStrings = [
    [['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i']],
    [['j', 'k', 'l'], ['m', 'n', 'o'], ['p', 'q', 'r']],
    [['s', 't', 'u'], ['v', 'w', 'x'], ['y', 'z', 'A']],
    [['B', 'C', 'D'], ['E', 'F', 'G'], ['H', 'I', 'J']],
    [['K', 'L', 'M'], ['N', 'O', 'P'], ['Q', 'R', 'S']],
    [['T', 'U', 'V'], ['W', 'X', 'Y'], ['Z', '0', '1']],
    [['2', '3', '4'], ['5', '6', '7'], ['8', '9', '0']],
    [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']],
    [['0', '1', '2'], ['3', '4', '5'], ['6', '7', '8']],
    [['9', '0', '1'], ['2', '3', '4'], ['5', '6', '7']],
];
testUser.objectTest = {
    ...testUser
}
testUser.otherClass.id = 100;
testUser.otherClass.name = 'Jane Doe';
testUser.otherClass.isActive = false;
testUser.superName = 'Super John Doe';

console.log(testUser);
const JSONSerializer = new Json();
const s = JSONSerializer.serialize(testUser);
console.log('serialized', s);
const i = JSONSerializer.deserialize(s, SuperUser);
console.log('deserialized', i);