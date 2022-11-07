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

    case x of
      0..100: WriteLn('smol');
      101..1000: WriteLn('not smol');
    else
      WriteLn('unknown');
    end;
end.