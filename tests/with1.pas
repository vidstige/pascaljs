program with1;
type
    TPerson = record
        name: String;        
        age: Integer;
    end;
var
    owner: TPerson;
begin
    with owner do
    begin
        name := 'Bilbo Baggins';
        age := 111;        
    end;
    WriteLn('name: ', owner.name, ', age: ', owner.age);
end.