import {resolve} from "path";
import pkg from "./package.json";

export default {
    build: {
        lib: {
            entry: resolve(__dirname, pkg.module),
            formats: ['es'],
            name: 'JsonClassMap',
        },
    }
}