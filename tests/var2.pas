program var2;
procedure modify(var x, y: Integer; z: Integer);
begin
    x := z;
    y := z;
end;
var
    variable: Integer;
    foobar: Integer;
begin
    variable := 0;
    modify(variable, foobar, 7);
    WriteLn(variable, foobar);
end.