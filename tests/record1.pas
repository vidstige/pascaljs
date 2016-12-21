programrecord1;
type
    TPoint = record
        x: Integer;
        y: Integer
    end;
var
    p: TPoint;
begin
    WriteLn('x: ', p, ', y: ', p);
end.