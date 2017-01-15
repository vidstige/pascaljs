program pointer;
var
    i: Integer;
    p: ^Integer;
begin
    i := 5;
    p := @i;
    WriteLn('p^=', p^);
end.