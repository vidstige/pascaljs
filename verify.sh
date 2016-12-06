#!/bin/bash
for obj in $1; do
  tmp="${obj/build/tests/expectations}"
  expected="${tmp%.js}.out"
  echo `basename ${obj%.js}`...
  if [ -f $expected ]; then
    node $obj | diff $expected -

  else
    node $obj > /dev/null
  fi
done
