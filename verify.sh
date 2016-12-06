#!/bin/bash
function fancy {
    if [ $1 -eq 0 ]; then
        echo "✓ " $2
    else
        echo "✗ " $2
    fi 
}

fails=0
for obj in $1; do
  tmp="${obj/build/tests/expectations}"
  expected="${tmp%.js}.out"
  test_name=`basename ${obj%.js}`
  if [ -f $expected ]; then
    node $obj | diff $expected -
  else
    node $obj > /dev/null
  fi
  success=$?
  if [ ! $success -eq 0 ]; then
    ((fails++))
  fi
  fancy $success $test_name
done
exit $fails
