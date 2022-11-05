program assembler3;
var
    x: Word;
begin
    asm
        xor x, x
        mov 10, cx
    @loop:
        add x, 3
        loop @loop
    end;
    WriteLn('x = ', x);
end.