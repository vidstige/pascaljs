program repeat1;
var
    i: Integer;
begin
    i := 0;
    repeat        
        WriteLn(i);
        i := i + 1;
    until i > 5;
end.