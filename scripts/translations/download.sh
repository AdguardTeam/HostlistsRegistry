#!/bin/bash
SERVICE_URL="https://twosky.adtidy.org/api/v1/"
workDir=../..
locales=("en" "ru" "ar" "bg" "ca" "zh_CN" "zh_TW" "hr" "da" "nl" "fi" "fr" "de" "he" "hu" "id" "it" "ja" "ko" "no" "fa" "pl" "pt" "pt_BR" "pt_PT" "sr" "sk" "es" "sv" "tr" "uk" "vi" "be" "sl")

for locale in "${locales[@]}"
do
    echo "Download tags.json for $locale locale"
    curl "${SERVICE_URL}download?format=strings&language=${locale}&filename=tags.json&project=filters-registry" -o messages.json

    destinationLocale=$locale
    if [ "$locale" = "zh_CN" ]; then
        echo "Change $locale destination dir to zh"
        destinationLocale=zh
    fi

    mkdir -p $workDir/locales/$destinationLocale

    echo "Parsing tags.json for $locale locale for tags.json"
    node converter.js import messages.json $locale converted.json "tag."

    echo "Moving tags.json for $locale locale to $workDir/locales/$destinationLocale/"
    cp -f converted.json $workDir/locales/$destinationLocale/tags.json

    if [ "$locale" = "es" ]; then
        echo "Copying tags.json for es_ES locale"
        cp -f converted.json $workDir/locales/es_ES/tags.json
    fi

    if [ "$locale" = "pt" ]; then
        echo "Copying tags.json for pt_PT locale"
        cp -f converted.json $workDir/locales/pt_PT/tags.json
    fi

    rm messages.json
    rm converted.json
done

echo "Import finished"
