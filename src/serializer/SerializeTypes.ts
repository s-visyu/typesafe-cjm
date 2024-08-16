import {PropType} from "./JsonSerializer.ts";

export type ClassType<T> = new (...args: any[]) => T;

export class _SerializedArray {
    constructor(public type: PropType) {
    }
}

export function SerializedArray(type: PropType) {
    return new _SerializedArray(type);
}

export class _SerializedObject {
    constructor(public schema: Record<string, PropType>) {
    }
}

export function SerializedObject(schema: Record<string, PropType>) {
    return new _SerializedObject(schema);
}

export class _SerializedClass {
    constructor(public reference: ClassType<any>) {
    }
}

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
}
export type PropTypeOptions = PropTypeOption[];

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONValue[] | {
    [key: string]: JSONValue
}