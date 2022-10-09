program assembler1;

var
    x: Word;
begin
    asm
        mov 17, x
    end;
    WriteLn(x);
end.