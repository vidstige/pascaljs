program assembler1;

var
    x: Word;
begin
    asm
        mov 17, x
        inc x
        add x, 5
        sub x, 10
        dec x
    end;
    WriteLn(x);
end.