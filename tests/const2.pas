program Const2;
type
  TRgb = record
    r, g, b: Byte;
  end;
const
  I: Integer = 123;
  S: String = 'hej';
  A: array[0..3] of Word = (1, 16, 256, 4096);
  HEX10 = $10;
  HEX3f = $3f;
  HEX3F = $3F;
  BLACK: TRgb = (r:$00; g:$00; b:$00);
begin
  WriteLn('I = ', I);
  WriteLn('S = ', S);
  WriteLn('A[1] = ', A[1]);
  WriteLn('HEX10 = ', HEX10);
  WriteLn('HEX3f = ', HEX3f);
  WriteLn('HEX3F = ', HEX3F);
end.