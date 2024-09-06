#!/bin/bash

cd "$(dirname "$0")"

rm -rf out/

mkdir out
mkdir out/IllegalMap

rsync -av --exclude-from=".gitignore"\
    --exclude="*.git*"\
    --exclude="IllegalMapAPI.json"\
    --exclude="README.md"\
    * out/IllegalMap/

cd out/
zip -r IllegalMap.zip IllegalMap/
rm -rf IllegalMap