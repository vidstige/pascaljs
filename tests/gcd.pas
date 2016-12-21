program gcd;
function gcd(a: Integer; b: Integer): Integer;
begin
    while a <> b do
    begin
        if a > b then
           a := a - b
        else
           b := b - a;
    end;
    gcd := a;
end;

begin
    WriteLn('gcd(77, 4) = ', gcd(77, 4));
end.