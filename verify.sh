#!/bin/bash
function fancy {
    if [ $1 -eq 0 ]; then
        echo "✓ " $2
    else
        echo "✗ " $2
    fi 
}
diff $1 $2  
success=$?
fancy "$success" $(basename -s .out $1)
exit $success