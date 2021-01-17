program Fibonacci;
function Fibonacci(n: Integer): Integer;
begin
    if n = 0 then
        Fibonacci := 0
    else if n = 1 then
        Fibonacci := 1
    else
        Fibonacci := Fibonacci(n - 2) + Fibonacci(n - 1);
end;
begin
    WriteLn(Fibonacci(7));
end.