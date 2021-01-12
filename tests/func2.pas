program Func2;
function Add(A, B: Integer): Integer;
begin
    Add := A + B;
end;
function IsEven(i: Integer): Integer;
begin
    IsEven := (i mod 2) = 0;
end;
begin
  WriteLn('Is 3 + 4 even? ', IsEven(Add(3, 4)));
end.