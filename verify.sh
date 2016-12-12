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
    actual=$(mktemp /tmp/pascaljs.XXXXXX)
    node $obj > $actual && diff $actual $expected
    success=$?
    rm "$actual"
  else
    node $obj > /dev/null
    success=$?
  fi
  if [ ! $success -eq 0 ]; then
    ((fails++))
  fi
  fancy $success $test_name
done
exit $fails
