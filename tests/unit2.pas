unit a;

interface

type
  TAngle = Integer;

const
    REVOLUTION = 256;

function NormalizeAngle(angle: TAngle): TAngle;
function AngleDifference(a: TAngle; b: TAngle): TAngle;
procedure DisplayAngle(a: TAngle);

implementation

function NormalizeAngle(angle: TAngle): TAngle;
begin
    NormalizeAngle := angle mod REVOLUTION;
end;

function AngleDifference(a: TAngle; b: TAngle): TAngle;
begin
    AngleDifference := b - a;
end;

procedure DisplayAngle(a: TAngle);
begin
    WriteLn(a);
end;

end.