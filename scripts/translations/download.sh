#!/bin/bash
SERVICE_URL="https://twosky.int.agrd.dev/api/v1/"
workDir=../..
locales=("en" "ru" "ar" "bg" "ca" "zh_CN" "zh_TW" "hr" "da" "nl" "fi" "fr" "de" "he" "hu" "id" "it" "ja" "ko" "no" "fa" "pl" "pt" "pt_BR" "pt_PT" "sr" "sk" "es" "sv" "tr" "uk" "vi" "be" "sl")

for locale in "${locales[@]}"; do
    echo "Download tags.json for $locale locale"
    curl "${SERVICE_URL}download?format=strings&language=${locale}&filename=tags.json&project=hostlists-registry" -o messages.json

    destinationLocale=$locale
    if [ "$locale" = "zh_CN" ]; then
        echo "Change $locale destination dir to zh"
        destinationLocale=zh
    fi

    mkdir -p $workDir/locales/$destinationLocale

    echo "Parsing tags.json for $locale locale for tags.json"
    node converter.js import messages.json $locale converted.json "hostlisttag."

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

for locale in "${locales[@]}"; do
    echo "Download filters.json for $locale locale"
    curl "${SERVICE_URL}download?format=strings&language=${locale}&filename=hostlists.json&project=hostlists-registry" -o messages.json

    destinationLocale=$locale
    if [ "$locale" = "zh_CN" ]; then
        echo "Change $locale destination dir to zh"
        destinationLocale=zh
    fi

    echo "Parsing filters.json for $locale locale for filters.json"
    node converter.js import messages.json $locale converted.json "hostlist."

    echo "Moving filters.json for $locale locale to $workDir/locales/$destinationLocale/"
    cp -f converted.json $workDir/locales/$destinationLocale/filters.json

    if [ "$locale" = "es" ]; then
        echo "Copying filters.json for es locale"
        cp -f converted.json $workDir/locales/es_ES/filters.json
    fi

    if [ "$locale" = "pt" ]; then
        echo "Copying filters.json for pt_PT locale"
        cp -f converted.json $workDir/locales/pt/filters.json
    fi

    rm messages.json
    rm converted.json
done

for locale in "${locales[@]}"; do
    echo "Download groups.json for $locale locale"
    curl "${SERVICE_URL}download?format=strings&language=${locale}&filename=groups.json&project=hostlists-registry" -o messages.json

    destinationLocale=$locale
    if [ "$locale" = "zh_CN" ]; then
        echo "Change $locale destination dir to zh"
        destinationLocale=zh
    fi

    echo "Parsing groups.json for $locale locale"
    node converter.js import messages.json $locale converted.json "hostlistgroup."

    echo "Moving groups.json for $locale locale to $workDir/locales/$destinationLocale/"
    cp -f converted.json $workDir/locales/$destinationLocale/groups.json

    if [ "$locale" = "es" ]; then
        echo "Copying groups.json for es locale"
        cp -f converted.json $workDir/locales/es_ES/groups.json
    fi

    if [ "$locale" = "pt" ]; then
        echo "Copying groups.json for pt_PT locale"
        cp -f converted.json $workDir/locales/pt/groups.json
    fi

    rm messages.json
    rm converted.json
done

echo "Import finished"
