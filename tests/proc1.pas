program Sample;
procedure NoParameter();
begin
    WriteLn('No parameter'); 
end;

procedure Output(A,B: Integer; C: String);
begin
    WriteLn(A, ', ', B, ', ', C); 
end;
begin
  Output(7, 8, 'C');
  NoParameter();
end.