programrecord1;
type
    { trailing semi}
    TPoint = record
        x, y: Integer;
    end;
    { no trailing semi}
    TName = record
        first: String;
        last: String
    end;
var
    p: TPoint;
    name: TName;
begin
    p.x := 1;
    p.y := 2;
    WriteLn('x: ', p.x, ', y: ', p.y);
    name.first := 'Peter';
    name.last := 'Forsberg';
    WriteLn(name.first, ' ', name.last);
end.