program Const2;
const
  I: Integer = 123;
  S: String = 'hej';
  A: array[0..3] of Word = (1, 16, 256, 4096);
begin
  WriteLn('I = ', I);
  WriteLn('S = ', S);
  WriteLn('A[1] = ', A[1]);
end.