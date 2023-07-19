#!/bin/sh

for DIRECTORY in */; 
do
    pushd $DIRECTORY
    
    echo "Running npm install for ${DIRECTORY} plugin.."
    npm install

    popd
done 