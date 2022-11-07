program case1;
var
    x: Integer;
begin
    x := 9;
    case x of
      8: WriteLn('eight');
      9: WriteLn('nine');
    else
      WriteLn('Unknown number', x);
    end;
end.