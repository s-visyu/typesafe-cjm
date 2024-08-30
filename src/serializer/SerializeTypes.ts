export type ClassType<T> = new (...args: any[]) => T;

export class _SerializedArray {
    constructor(public type: PropType) {
    }
}

/**
 * Can be used to define a class property as an Array in combination with Json.Prop
 * @param type
 * @constructor
 */
export function SerializedArray(type: PropType) {
    return new _SerializedArray(type);
}

export class _SerializedObject {
    constructor(public schema: Record<string, PropType>) {
    }
}

/**
 * Can be used to define a class property as an Object in combination with Json.Prop.
 * @param schema
 * @constructor
 */
export function SerializedObject(schema: Record<string, PropType>) {
    return new _SerializedObject(schema);
}

export class _SerializedClass {
    constructor(public reference: ClassType<any>) {
    }
}

/**
 * Can be used to define a class property as a class instance in combination with Json.Prop
 * @param reference
 * @constructor
 */
export function SerializedClass(reference: ClassType<any>) {
    return new _SerializedClass(reference);
}

export type PropType =
    'int'
    | 'float'
    | 'string'
    | 'boolean'
    | 'dateTime'
    | _SerializedArray
    | _SerializedObject
    | _SerializedClass;

export type PropTypeOption = {
    type: PropType
    key: string
    level: number
    required: boolean
}
export type PropTypeOptions = PropTypeOption[];

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONValue[] | {
    [key: string]: JSONValue
}