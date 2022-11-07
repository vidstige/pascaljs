program assembler4;

function f1(): Word; assembler;
asm
    mov ax, 90
end;

begin
  WriteLn('f1 = ', f1());
end.