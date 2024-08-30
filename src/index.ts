import {Json} from "./serializer/JsonSerializer.ts";
import {IncorrectKeyAccess, KeyAccessObjectMisMatch} from "./serializer/ObjAccess.ts";
import {
    CircularReferenceError,
    InvalidOptionsError,
    NotImplementedError,
    PropertyRequiredError,
    UnknownObjectTypeError
} from "./serializer/SerializeErrors.ts";
import {PropType, SerializedArray, SerializedClass, SerializedObject} from "./serializer/SerializeTypes.ts";

export {
    Json,

    SerializedArray, SerializedClass, SerializedObject,

    IncorrectKeyAccess,
    KeyAccessObjectMisMatch,

    CircularReferenceError,
    InvalidOptionsError,
    NotImplementedError,
    UnknownObjectTypeError,
    PropertyRequiredError
};

export type {PropType};