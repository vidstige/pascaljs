program assembler2;

var
    x: Word;
begin
    x := 7;
    asm
        cmp x, 8
        jne @nope
        add x, 10
    @nope:
        add x, 1
    end;
    WriteLn('x = ', x);
end.