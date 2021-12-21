#!/bin/bash
SERVICE_URL="https://twosky.adtidy.org/api/v1/"
workDir=../..
locales=("en")

for locale in "${locales[@]}"; do
    echo "Moving tags.json for $locale locale"
    cp -f $workDir/locales/$locale/tags.json messages.json

    echo "Exporting tags.json for $locale locale"
    node converter.js export messages.json $locale tags.json

    echo "Uploading tags.json for $locale locale"
    curl -XPOST "${SERVICE_URL}upload" -F "format=json" -F "language=${locale}" -F "filename=tags.json" -F "project=filters-registry" -F "file=@./tags.json"

    rm messages.json
    rm tags.json
done

for locale in "${locales[@]}"; do
    echo "Moving filters.json for $locale locale"
    cp -f $workDir/locales/$locale/filters.json messages.json

    echo "Exporting filters.json for $locale locale"
    node converter.js export messages.json $locale filters.json

    echo "Uploading filters.json for $locale locale"
    curl -XPOST "${SERVICE_URL}upload" -F "format=json" -F "language=${locale}" -F "filename=hostlists.json" -F "project=filters-registry" -F "file=@./filters.json"

    rm messages.json
    rm filters.json
done

echo "Upload finished"
