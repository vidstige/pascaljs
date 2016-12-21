programrecord1;
type
    TPoint = record
        x: Integer;
        y: Integer
    end;
var
    p: TPoint;
begin
    p.x := 1;
    p.y := 2;
    WriteLn('x: ', p.x, ', y: ', p.y);
end.