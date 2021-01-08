program record2;
type
    TPoint = record
        x, y: Integer;
    end;
    TSegment = record
        start, stop: TPoint;
    end;
function Point(x, y: Integer): TPoint;
begin
    Point.x := x;
    Point.y := y;
end;
var
    segment: TSegment;
begin
    segment.start := Point(8, 9);
    segment.stop := Point(2, 8);
    WriteLn(segment.start.x, ', ', segment.start.x, ' - ', segment.stop.x, ', ', segment.stop.x);
end.