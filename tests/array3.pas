program array3;
type
    TMAtrix3 = record
        m: array[0..8] of Real;
        strides: array[0..2] of Integer;
    end;
var
  matrix: TMAtrix3;
begin
  matrix.m[1] := 1.5;
  WriteLn('matrix.m[1] = ', matrix.m[1]);
end.