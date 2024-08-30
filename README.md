# Typesafe json-class-mapper

This is a simple library that allows you to map JSON objects to javascript classes and vice versa.
It is written in typescript and is type-safe.

It uses decorators to define the mapping between the JSON object and the class, e.g.:

``` 
class ReadmeCode {
    @Json.Prop("string") code: string = "";
}
```

## Installation

For now, you can clone the repository and use the library directly from the source code, or you can add it via npm: (
Other package managers are not tested yet.)

`npm i --save-dev github:s-visyu/typesafe-cjm`

Use the library in combination with a typescript transpiler like `esbuild` or `tsc`.

## Features

- Type-safe mapping between JSON objects and classes
- Mapping of primitive types
- Mapping of nested objects
- Mapping of arrays
- Mapping of classes
- Handle extended classes
- Handle circular references
- Handle required properties
- Limit depth of mapping
- Constructor injection

## Usage

### Primitives

```
class Primitives {
    @Json.Prop("int") anInt: number = 0;
    @Json.Prop("float") aFloat: number = 0;
    @Json.Prop("string") aString: string = "";
    @Json.Prop("boolean") aBoolean: boolean = false;
    @Json.Prop("dateTime") aDateTime: Date = new Date();
}
```

### Arrays

```
class Array {
    @Json.Prop(SerializedArray(Primitives)) primitives: Primitives[] = [];
}
```

### Objects

```
class Object {
    @Json.Prop(SerializedObject({
        code: "string",
        primitives: SerializedClass(Primitives),
        array: SerializedClass(Array)
    })) obj: any = {};
}
```

```
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
```

### Required Properties

```
class RequiredProperties {
    @Json.Prop("string", true) requiredString: string = "";
    @Json.Prop("string") optionalString?: string;
}
```

### Constructor Injection

Pass the constructor as JSON object:

``` 
@Json.Constructor()
class ConstructorInjection {
    @Json.Prop("string") str: string = "";
    
    constructor(args: {str: string}) {
        this.str = args.str;
    }
}
```

Define a schema using the json keys:

```
@Json.Constructor(["str", "number"])
class ConstructorInjection2 {
    @Json.Prop("string") str: string = "";
    @Json.Prop("int") number: number = 0;
    
    constructor(str: string, number: number) {
        this.str = str;
        this.number = number;
    }
}
```

### Serialization

```
const serializer = new Json(256);
const obj = new ConstructorInjection2("test", 123);
const json = serializer.serialize(obj);
```

### Deserialization

```
const serializer = new Json();
const obj = serializer.deserialize({
    str: "test",
    number: 123
}, ConstructorInjection2);
```

## Errors

### Mapping Errors

- **IncorrectKeyAccessError**: This error is thrown when you try to access a key that does not exist in the JSON object.
- **KeyAccessObjectMisMatchError**: This error is thrown when you try to access a key that is not an object.

### Serialization Errors

- **CircularReferenceError**: This error is thrown when a circular reference is detected in the class being serialized.
- **InvalidOptionsError**: This error is thrown when trying to serialize a class with no definitions.
- **NotImplementedError**: You probably use a type that is not yet implemented.
- **UnknownObjectTypeError**: Type mismatch between the class and the JSON object.
- **PropertyRequiredError**: A property is required but not found in the JSON object or class instance.

### Note

- The library is still in development and is not yet published to npm
- The library is not yet tested in a production environment
- The library is not yet tested with large JSON objects
- No benchmarks are available yet
- The library has not yet proven to be practical