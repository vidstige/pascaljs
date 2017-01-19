unit a;

interface

type
  TAngle = Integer;

const
    A = 17;

procedure wrap(angle: TAngle);

implementation

procedure wrap(angle: TAngle);
begin
    WriteLn(angle);
end;

end.