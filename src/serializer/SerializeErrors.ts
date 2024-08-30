export class InvalidOptionsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidOptionsError';
    }
}

export class UnknownObjectTypeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnknownObjectTypeError';
    }
}

export class MissingRequiredPropertyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MissingRequiredPropertyError';
    }
}

export class NotImplementedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotImplementedError';
    }
}

export class CircularReferenceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircularReferenceError';
    }
}

export class PropertyRequiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PropertyRequiredError';
    }
}