# DNS Host lists

## Filters metadata

- `metadata.json`

  Filter metadata. Includes name, description, etc.

    * `filterId` — unique filter identifier (integer)
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
      "filterId": 1,
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

## How to build

```
yarn install
```

Run the following command:
```
node index.js
```
