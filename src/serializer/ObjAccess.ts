export class IncorrectKeyAccess extends Error {
}

export class KeyAccessObjectMisMatch extends Error {
}

/**
 * Resolves the given string representation to the property of 'obj'.
 * @param strRep - e.g. key1.key2.arrayKey[0].key3
 * @param obj - the object
 * @param prefix - internal used parameter for improved error message
 */
export function readJSONValueByString(strRep: string, obj: Record<string, any>, prefix: string = ""): any {
    let nextKey = strRep.substring(0, strRep.indexOf('.'));
    if (!nextKey.length && !strRep.length) {
        throw new IncorrectKeyAccess(prefix);
    } else if (!nextKey.length) {
        nextKey = strRep; // the last access
    }

    prefix = prefix ? prefix + '.' + nextKey : nextKey;

    const isLastAccess = nextKey === strRep;
    const restKey = strRep.substring(strRep.indexOf('.') + 1);

    const isArrayAccess = nextKey.includes('[') && nextKey.endsWith(']');
    if (isArrayAccess) {
        const key = nextKey.match(/^([^\[]+)/i);
        const indices = nextKey.match(/(\[(\d+)])/g);
        if (!key && (!indices || !indices.length))
            throw new IncorrectKeyAccess('key: ' + nextKey);
        if (!indices || !indices.length || indices.length !== nextKey.split('[').length - 1) {
            throw new IncorrectKeyAccess(`cannot access invalid indices ${nextKey}`)
        }

        const prop = key?.[1] ?? undefined;
        if (prop) {
            if (obj[prop] === undefined)
                throw new KeyAccessObjectMisMatch(`Tried to access ${prefix} of ${JSON.stringify(obj)}`);
            else
                obj = obj[prop];
        }

        // iterate indices
        for (const [_, iBrackets] of indices.slice(0, indices.length - 1).entries()) {
            const i = iBrackets.substring(1).substring(0, iBrackets.length - 2);
            if (obj[i] === undefined)
                throw new KeyAccessObjectMisMatch(`Tried to access ${iBrackets} of ${JSON.stringify(obj)}`);
            obj = obj[i];
        }

        nextKey = indices[indices.length - 1].substring(1).substring(0, indices[indices.length - 1].length - 2);
    }

    if (obj[nextKey] === undefined)
        throw new KeyAccessObjectMisMatch(`Tried to access ${prefix} of ${JSON.stringify(obj)}`)

    if (isLastAccess)
        return obj[nextKey];

    return readJSONValueByString(restKey, obj[nextKey], prefix);
}