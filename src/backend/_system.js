export var __registers = {};
export function WriteLn() { console.log(Array.prototype.slice.call(arguments).join('')); }

// System
export function Halt(exitcode) {
    process.exit(exitcode);
}

// Strings
export function Length(s) {
    return s.length;
}

export function Byte(char) {
    return char.charCodeAt(0);
}

// File I/O
export function Assign(f, filename) {

}
export function Reset(f) {

}
export function Close(f) {

}
