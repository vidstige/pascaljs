# pascaljs

[![CircleCI](https://circleci.com/gh/circleci/circleci-docs.svg?style=svg)](https://circleci.com/gh/vidstige/pascaljs)

[![first-timers-friendly](https://img.shields.io/badge/first--timers--only-friendly-green.svg?style=flat&colorB=FF69B4)](http://www.firsttimersonly.com/)

Pascal parser in js. The goal is to be able to run simple Turbo Pascal demos
made in the 90s that depend on asm, but otherwise very simple pascal.

The generated js output is very sensible and lean. For example the following pascal program:

```pascal
program HelloWorld;
var
    x: String;
begin
    x := 'y';
    WriteLn('x is ', x);
end.
```

Is compiled to just

```js
// Genrated by pascaljs. https://github.com/vidstige/pascaljs
function WriteLn() { var args = Array.prototype.slice.call(arguments); console.log(args.join('')); }
var x = null; // integer
x = 'y';
WriteLn('x is ', x);
```

## Example
[https://vidstige.github.io/pascaljs/](https://vidstige.github.io/pascaljs/)

## Features

- [x] Programs
- [x] Units

### Statements

- [x] Comments
- [x] Invoke Procedures
- [x] `var` parameters
- [x] Compound
- [x] `for`
- [x] `if`
- [x] assignment
- [x] `while`
- [x] `repeat`
- [x] `with`
- [x] `case`
- [x] Recursive calls

### Expressions

- [x] Integer literals
- [x] String literals
- [x] Variables
- [x] Parenthesis
- [x] Boolean operators
- [x] Arithmetic operators
- [x] Comparisions
- [x] Function calls
- [x] Pointers

### Declarations

- [x] Procedures
- [x] Functions
- [x] Variabes
- [x] Constants
- [x] Type aliases
- [x] Records
- [x] Arrays
- [x] Mix declaration order
- [x] Real
- [x] Type checking
- [x] Nested arrays/records

### Assembler

- [x] Parse keywords
- [x] Construct structured JavaScript flow control (`if-then-else`, `do-while`) from assembler
- [ ] Adress variables and pointers
- [x] Basic instruction set
- [ ] `int` for graphics, sleeps, and more

### Stanard unit

- [x] `WriteLn´
- [ ] Arithmetic
- [ ] File  I/O
- [x] In separate file

### Graphics subsystem

- [ ] VGA emulation
- [ ] Palette

## Author
Samuel Carlsson <samuel.carlsson@gmail.com>
