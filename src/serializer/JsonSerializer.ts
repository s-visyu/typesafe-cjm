import {
    _SerializedArray,
    _SerializedClass,
    _SerializedObject,
    ClassType,
    JSONValue,
    PropType,
    PropTypeOption,
    PropTypeOptions
} from "./SerializeTypes.ts";
import {InvalidOptionsError, NotImplementedError, UnknownObjectTypeError} from "./SerializeErrors.ts";
import {readJSONValueByString} from "./objAccess.ts";

const ConstructorDecorator = Symbol('ConstructorDecorator');
const JSONDecorator = Symbol('JSONDecorator');

export class Json {

    static MAX_LEVELS = 256;
    circularReferences: any[] = [];

    protected get decorator(): symbol {
        return JSONDecorator
    }

    static Prop(type: PropType) {
        return function (target: any, propertyKey: string) {
            if (!target[JSONDecorator])
                target[JSONDecorator] = {};

            target[JSONDecorator] = {
                ...target[JSONDecorator],
                [propertyKey]: {
                    type,
                    key: propertyKey,
                }
            } as PropTypeOptions;
        };
    }

    static Constructor();

    static Constructor(def: string[]);

    static Constructor(def?: string[]) {
        return function (constructor: Function) {
            constructor[ConstructorDecorator] = def ?? true;
            return constructor;
        }
    }

    public serialize(obj: any, level?: number): JSONValue {
        if (level === undefined
            || level === null)
            this.circularReferences = [];

        if (this.circularReferences.indexOf(obj) !== -1)
            throw new Error(`Circular reference detected: ${obj}`);
        this.circularReferences.push(obj);

        const serialized: JSONValue = {};
        const optionsMap = this.getOptions(obj);
        for (const key in optionsMap) {
            const value = obj[key];
            const options = optionsMap[key];
            options.level = level || 0;
            serialized[key] = this.serializeAny(value, options);
        }
        return serialized;
    }

    public deserialize<T>(serialized: { [key: string]: JSONValue }, reference: ClassType<T>, level?: number): T {
        const instance = this.initClassReference(reference, serialized);
        const optionsMap = this.getOptions(instance);
        for (const key in optionsMap) {
            const value = serialized[key];
            const options = optionsMap[key];
            options.level = level || 0;
            // @ts-ignore
            instance[key] = this.deserializeAny(value, options);
        }
        return instance;
    }

    protected getOptions(obj: any): PropTypeOptions {
        const map = obj[this.decorator];
        if (!map)
            throw new InvalidOptionsError(`Options not found on object: ${obj}`);
        return map;
    }

    protected hasSerializeProperty(c: InstanceType<any>): boolean {
        return !!c[this.decorator];
    }

    protected initClassReference<T>(ref: ClassType<T>, serialized: Record<string, JSONValue>): T {
        let prototype = ref;
        let def: string[] | boolean = [];
        while (prototype) {
            if (Object.hasOwn(prototype, ConstructorDecorator)) {
                def = prototype[ConstructorDecorator];
                break;
            }
            prototype = Object.getPrototypeOf(prototype);
        }

        if (def !== true && !Array.isArray(def))
            return new ref;

        let a: T;
        if (Array.isArray(def)) {
            const cArgs: any[] = [];
            for (const [_, jsonProp] of def.entries()) {
                cArgs.push(readJSONValueByString(jsonProp, serialized));
            }
            a = new ref(...cArgs);
        } else {
            a = new ref(serialized);
        }
        return a;
    }

    /* Serialization */
    protected serializeAny(v: any, options: PropTypeOption): JSONValue {
        if (options.level > Json.MAX_LEVELS)
            throw new Error(`Max levels reached for serialization`);

        if (options.type instanceof _SerializedArray)
            return this.serializeArray(v, options);
        else if (options.type instanceof _SerializedObject)
            return this.serializeObject(v, options);
        else if (options.type instanceof _SerializedClass)
            return this.serializeClass(v, options);
        else
            return this.serializePrimitive(v, options);
    }

    protected serializePrimitive(value: any, options: PropTypeOption): JSONValue {
        switch (options.type) {
            case 'int':
                return parseInt(value.toString());
            case 'float':
                return parseFloat(value.toString());
            case 'string':
                return value;
            case 'boolean':
                return value ? 1 : 0;
            case 'dateTime':
                return value.toString();
            default:
                throw new NotImplementedError(`Serialization of type ${options.type} is not implemented`);
        }
    }

    protected serializeArray(value: any, options: PropTypeOption): JSONValue {
        if (!(options.type instanceof _SerializedArray))
            throw new UnknownObjectTypeError(`Type ${options.type} is not an array, but is being used as one`);

        if (!Array.isArray(value))
            throw new UnknownObjectTypeError(`Value ${value} is not an array`);

        const nextType = options.type as _SerializedArray;
        return value.map((v: any) => this.serializeAny(v, {
            type: nextType.type,
            key: options.key,
            level: options.level + 1
        }));
    }

    protected serializeObject(value: any, options: PropTypeOption): Record<string, JSONValue> {
        if (!(options.type instanceof _SerializedObject))
            throw new UnknownObjectTypeError(`Type ${options.type} is not an object, but is being used as one`);

        if (typeof value !== 'object') {
            throw new UnknownObjectTypeError(`Value ${value} is not an object`);
        }

        const nextType = options.type as _SerializedObject;
        const serialized: JSONValue = {};
        for (const key in nextType.schema) {
            const propType = nextType.schema[key];
            serialized[key] = this.serializeAny(value[key], {type: propType, key, level: options.level + 1});
        }
        return serialized;
    }

    protected serializeClass(value: any, options: PropTypeOption): JSONValue {
        if (!(options.type instanceof _SerializedClass))
            throw new UnknownObjectTypeError(`Type ${options.type} is not a class, but is being used as one`);

        const classType = (options.type as _SerializedClass).reference;
        if (!(value instanceof classType))
            throw new UnknownObjectTypeError(`Value ${value} is not of type ${classType}`);

        if (!this.hasSerializeProperty(value))
            return value.toString();

        return this.serialize(value, options.level + 1);
    }

    /* Deserialization */
    protected deserializeAny(value: JSONValue, options: PropTypeOption): any {
        if (options.level > Json.MAX_LEVELS)
            throw new Error(`Max levels reached for deserialization`);

        if (options.type instanceof _SerializedArray)
            return this.deserializeArray(value, options);
        else if (options.type instanceof _SerializedObject)
            return this.deserializeObject(value, options);
        else if (options.type instanceof _SerializedClass)
            return this.deserializeClass(value, options);
        else
            return this.deserializePrimitive(value, options);
    }

    protected deserializePrimitive(value: JSONValue, options: PropTypeOption): any {
        switch (options.type) {
            case 'int':
            case 'float': {
                const num = Number(value);
                if (isNaN(num))
                    throw new UnknownObjectTypeError(`Value ${value} is not a number`);
                return num;
            }
            case 'string':
                return String(value);
            case 'boolean':
                return Boolean(value);
            case 'dateTime':
                return new Date(value as string | number);
            default:
                throw new NotImplementedError(`Serialization of type ${options.type} is not implemented`);
        }
    }

    protected deserializeArray(value: JSONValue, options: PropTypeOption): any[] {
        if (!(options.type instanceof _SerializedArray))
            throw new UnknownObjectTypeError(`Type ${options.type} is not an array, but is being used as one`);

        if (!Array.isArray(value))
            throw new UnknownObjectTypeError(`Value ${value} is not an array`);

        const nextType = options.type as _SerializedArray;
        return value.map((v: any) => this.deserializeAny(v, {
            type: nextType.type,
            key: options.key,
            level: options.level + 1
        }));
    }

    protected deserializeObject(value: JSONValue, options: PropTypeOption): JSONValue {
        if (!(options.type instanceof _SerializedObject))
            throw new UnknownObjectTypeError(`Type ${options.type} is not an object, but is being used as one`);

        if (typeof value !== 'object' || value === null)
            throw new UnknownObjectTypeError(`Value ${value} is not an object`);
        value = value as Record<string, JSONValue>;

        const nextType = options.type as _SerializedObject;
        const instance: any = {};
        for (const key in nextType.schema) {
            const propType = nextType.schema[key];
            instance[key] = this.deserializeAny(value[key], {type: propType, key, level: options.level + 1});
        }
        return instance;
    }

    protected deserializeClass(value: JSONValue, options: PropTypeOption): JSONValue {
        if (!(options.type instanceof _SerializedClass))
            throw new UnknownObjectTypeError(`Type ${options.type} is not a class, but is being used as one`);

        const classType = (options.type as _SerializedClass).reference;
        if (!this.hasSerializeProperty(new classType))
            return new classType(value);

        return this.deserialize(value, classType, options.level + 1);
    }
}