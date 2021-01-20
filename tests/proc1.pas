program proc1;
procedure NoParameter();
begin
    WriteLn('No parameter'); 
end;
procedure NoParameter2;
begin
    WriteLn('No parameter2'); 
end;

procedure Output(A,B: Integer; C: String);
begin
    WriteLn(A, ', ', B, ', ', C); 
end;
begin
  Output(7, 8, 'C');
  NoParameter();
  NoParameter2();
end.