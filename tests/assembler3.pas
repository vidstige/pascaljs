program assembler3;
var
    x: Word;
begin
    asm
        xor x, x
        mov cx, 10
    @loop:
        add x, 3
        loop @loop
    end;
    WriteLn('x = ', x);
end.