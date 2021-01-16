# pascaljs

![build-status](https://travis-ci.org/vidstige/pascaljs.svg?branch=master)
[![first-timers-friendly](http://img.shields.io/badge/first--timers--only-friendly-green.svg?style=flat&colorB=FF69B4)](http://www.firsttimersonly.com/)

Pascal parser in js. The goal is to be able to run simple Turbo Pascal demos
made in the 90s that depend on asm, but otherwise very simple pascal.

The generated js output is very sensible and lean. For example the following pascal program:

```pascal
program v;
var
    x: Integer;
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
- [ ] Units

### Statements

- [x] Comments
- [x] Invoke Procedures
- [x] `var` parameters
- [x] Compound
- [x] `for`
- [x] `if`
- [x] assignment
- [x] `while`
- [ ] `repeat`
- [ ] `with`
- [ ] Recursive calls

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

- [ ] Parse keywords
- [ ] Adress variables and pointers
- [ ] mov
- [ ] int
- [ ] loop
- [ ] Conditionals

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
