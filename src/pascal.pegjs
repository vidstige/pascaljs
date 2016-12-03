program
  = "program" _ identifier ";" _ block "."

block
  = "begin" _ "end"

identifier "identifier"
   = [A-Za-z0-9]+ 

_ "whitespace"
  = [ \t\n\r]*