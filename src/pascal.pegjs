program
  = "program" _ identifier ";" _ block "."

block
  = "begin" _ statement? _ "end"

statement "statement"
  = identifier _ "(" _ ")" _ ";"

identifier "identifier"
   = [A-Za-z0-9]+ 

literal "literal"
  = 'hi'

_ "whitespace"
  = [ \t\n\r]*