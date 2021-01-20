program func1;
function simple(A, B: Boolean): Boolean;
begin
  simple := A or B;
end;
function NoParameters: Boolean;
begin
  NoParameters := false;
end;
var
  r: Boolean;
begin
  r := simple(true, false);
  WriteLn('A or B ', r);
  WriteLn('NoParameters() ', NoParameters());
end.