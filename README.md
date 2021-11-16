# DNS Host lists

## Filters metadata

- `metadata.json`

  Filter metadata. Includes name, description, etc.

    * `filterId` — unique human-readable filter identifier (string)
    * `id` - unique internal filter identifier (integer)
    * `name` — filter name; can be localized
    * `description` — filter description
    * `timeAdded` — time when this filter was added to the registry; milliseconds since January 1, 1970; you can exec `new Date().getTime()` in the browser console to get the current time
    * `homepage` — filter website/homepage
    * `expires` — filter's default expiration period
    * `displayNumber` — this number is used when AdGuard sorts available filters (GUI)
    * `tags` — a list of [tags](#tags)

    <details>
      <summary>Metadata example</summary>

    ```json
    {
      "filterId": "adguard_dns_filter",
      "id": 1,
      "name": "AdGuard DNS filter",
      "description": "Filter composed of several other filters (AdGuard Base filter, Social Media filter, Tracking Protection filter, Mobile Ads filter, EasyList and EasyPrivacy) and simplified specifically to be better compatible with DNS-level ad blocking.",
      "timeAdded": 1404115015843,
      "homepage": "https://kb.adguard.com/general/adguard-ad-filters",
      "expires": "4 days",
      "displayNumber": 3,
      "tags": []
    }
    ```
    </details>

- `revision.json`

  Filter version metadata, automatically filled and overwritten on each build.

- `filter.txt`

  Resulting compiled filter.

- `configuration.json`

  Configuration defines your filter list sources, and the transformations that are applied to the sources. See [Hostlist compiler configuration](https://github.com/AdguardTeam/HostlistCompiler#configuration) for details

### <a id="tags"></a> Tags

Every filter can be marked by a number of tags. Every tag metadata listed in `/tags/metadata.json`.

<details>
  <summary>Example</summary>

```json
{
  "tagId": 1,
  "keyword": "purpose:ads"
}
```

</details>

Possible tags:

* `lang:*` — for language-specific filters; one or multiple lang-tags can be used. For instance,
  AdGuard Russian filter is marked with the `lang:ru` tag.

* `purpose:*` — determines filters purposes; multiple purpose-tags can be used for one filter list.
  For instance, `List-KR` is marked with both `purpose:ads` and `purpose:privacy`.

* `recommended` — for low-risk filter lists which are recommended to use in their category. The
  category is determined by the pair of the `lang:*` and `purpose:*` tags.

* `obsolete` — for abandoned filter lists; filter's metadata with this tag will be excluded
  from `filters.json` and `filters_i18n.json`.

## Services metadata

- `services.json`

  Service metadata. Includes id, name, rules, icon.

    * `id` — unique human-readable service identifier (string)
    * `name` — service name (string)
    * `domain_rules` - list of domains. Domain represented by rule (list of strings)
    * `icon` - svg icon (string)

    <details>
      <summary>Service example</summary>

    ```json
    {
      "id": "wechat",
      "name": "WeChat",
      "domain_rules": [
        "||wechat.com^",
        "||weixin.qq.com^",
        "||wx.qq.com^"
      ],
      "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" className=\"d-none\">\n<symbol id=\"service_wechat\" viewBox=\"0 0 50 50\" fill=\"currentColor\">\n<path d=\"M 19 6 C 9.625 6 2 12.503906 2 20.5 C 2 24.769531 4.058594 28.609375 7.816406 31.390625 L 5.179688 39.304688 L 13.425781 34.199219 C 15.714844 34.917969 18.507813 35.171875 21.203125 34.875 C 23.390625 39.109375 28.332031 42 34 42 C 35.722656 42 37.316406 41.675781 38.796875 41.234375 L 45.644531 45.066406 L 43.734375 38.515625 C 46.3125 36.375 48 33.394531 48 30 C 48 23.789063 42.597656 18.835938 35.75 18.105469 C 34.40625 11.152344 27.367188 6 19 6 Z M 13 14 C 14.101563 14 15 14.898438 15 16 C 15 17.101563 14.101563 18 13 18 C 11.898438 18 11 17.101563 11 16 C 11 14.898438 11.898438 14 13 14 Z M 25 14 C 26.101563 14 27 14.898438 27 16 C 27 17.101563 26.101563 18 25 18 C 23.898438 18 23 17.101563 23 16 C 23 14.898438 23.898438 14 25 14 Z M 34 20 C 40.746094 20 46 24.535156 46 30 C 46 32.957031 44.492188 35.550781 42.003906 37.394531 L 41.445313 37.8125 L 42.355469 40.933594 L 39.105469 39.109375 L 38.683594 39.25 C 37.285156 39.71875 35.6875 40 34 40 C 27.253906 40 22 35.464844 22 30 C 22 24.535156 27.253906 20 34 20 Z M 29.5 26 C 28.699219 26 28 26.699219 28 27.5 C 28 28.300781 28.699219 29 29.5 29 C 30.300781 29 31 28.300781 31 27.5 C 31 26.699219 30.300781 26 29.5 26 Z M 38.5 26 C 37.699219 26 37 26.699219 37 27.5 C 37 28.300781 37.699219 29 38.5 29 C 39.300781 29 40 28.300781 40 27.5 C 40 26.699219 39.300781 26 38.5 26 Z\" />\n</symbol>\n</svg>"
    }
    ```
    </details>

## How to build

```
yarn install
```

Run the following command:
```
node index.js
```
