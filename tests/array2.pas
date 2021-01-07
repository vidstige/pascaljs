program array2;
type
    TPoint = record
        x, y: Integer;
    end;
var
  a: array[1..2] of TPoint;
begin
  a[1].x := 2;
  a[1].y := 3;
  WriteLn('a[1].x = ', a[1].x, ', a[1].y = ', a[1].y);
end.