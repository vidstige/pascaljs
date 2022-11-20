export var __registers = {};
export function WriteLn() { console.log(Array.prototype.slice.call(arguments).join('')); }

export function Halt(exitcode) {
    process.exit(exitcode);
}