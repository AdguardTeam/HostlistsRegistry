# AdGuard Host Lists Registry

- [What Blocklists Can Be Added Here](#what-blocklists)
- [Where Blocklists Are Published](#published)
- [Filters Metadata](#filters-meta)
- [Services Metadata](#services-meta)
- [How to Build](#how-to-build)
- [Localizations](#localizations)

This repository contains the known hosts blocklists that are made available to the users of AdGuard products ([AdGuard DNS](https://adguard-dns.com/), [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome), etc).

Some of these blocklists are automatically [converted](https://github.com/AdguardTeam/HostlistCompiler) to the rules format that AdGuard product understand better.

## <a id="published"></a> Where Blocklists Are Published

- [`filters.json`](https://adguardteam.github.io/HostlistsRegistry/assets/filters.json) contains all the blocklists added to the repo. `downloadURL` is the location of the re-hosted blocklist.
- [`services.json`](https://adguardteam.github.io/HostlistsRegistry/assets/services.json) is the meta-data of "Web Services". This is a part of the parental control functionality of AdGuard Home and AdGuard DNS.

## <a id="what-blocklists"></a> What Blocklists Can Be Added Here

- The blocklist should be oriented towards DNS-level content blockers. There is a different [repo](https://github.com/AdguardTeam/FiltersRegistry) for browser content blockers.
- We prefer (mostly) original lists to compilations.
- We prefer blocklists that are specifically made for [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) and use [adblock-style syntax](https://github.com/AdguardTeam/AdGuardHome/wiki/Hosts-Blocklists#adblock-style). Lists that use `/etc/hosts` can also be added if there is no alternative.
- The blocklist should have a clear purpose.

  Examples:

  - good: "blocks TV ads".
  - bad: "John Doe's personal blocklist"

- The blocklist should have a place for receiving user complaints and holding discussions, such as a repository on github.com, or a public website/forum.
- The blocklist should be relatively popular, meaning:
  - if there is a repository on GitHub, the number of stars should be at least 50.
  - if there is no repository on GitHub, the number of reported issues and discussions should be at least 10 per month.
  - the blocklist should be actively supported for at least 6 months.
- The blocklist should be regularly updated with at least 10 updates per month.
- Previously added blocklists that haven't received any support for a year will be removed. We reserve the right to remove the blocklist earlier, depending on circumstances.
- If the blocklist contains too many problematic rules, it will not be added. A rule is considered problematic if it causes false positives or otherwise displays unitended behavior. Decisions about blocklists with problematic rules are arbitrary and there may be exceptions.
- If the blocklist intentionally blocks or restricts access to a service for no reason other than being a reflection of the filter author's opinion, the blocklist will not get added, or will get removed if already added.
- If the blocklist is popular in a specific region and there are no alternatives to it, then it can be added as is even if it does not satisfy requirements above.

## <a id="filters-meta"></a> Filters Metadata

- `metadata.json`

  Filter metadata. Includes name, description, etc.

  - `filterId` — unique human-readable filter identifier (string)
  - `id` - unique internal filter identifier (integer)
  - `name` — filter name; can be localized
  - `description` — filter description
  - `timeAdded` — time when this filter was added to the registry; milliseconds since January 1, 1970; you can exec `new Date().getTime()` in the browser console to get the current time
  - `homepage` — filter website/homepage
  - `expires` — filter's default expiration period
  - `displayNumber` — this number is used when AdGuard sorts available filters (GUI)
  - `tags` — a list of [tags](#tags)

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

- `lang:*` — for language-specific filters; one or multiple lang-tags can be used. For instance,
  AdGuard Russian filter is marked with the `lang:ru` tag.

- `purpose:*` — determines filters purposes; multiple purpose-tags can be used for one filter list.
  For instance, `List-KR` is marked with both `purpose:ads` and `purpose:privacy`.

- `recommended` — for low-risk filter lists which are recommended to use in their category. The
  category is determined by the pair of the `lang:*` and `purpose:*` tags.

- `obsolete` — for abandoned filter lists; filter's metadata with this tag will be excluded
  from `filters.json` and `filters_i18n.json`.

## <a id="services-meta"></a> Services Metadata

- `services.json`

  Service metadata. Includes id, name, rules, icon.

  - `id` — unique human-readable service identifier (string)
  - `name` — service name (string)
  - `rules` - list of rules (list of strings)
  - `icon_svg` - svg icon (string)

    <details>
      <summary>Service example</summary>

  ```json
  {
    "id": "wechat",
    "name": "WeChat",
    "rules": ["||wechat.com^", "||weixin.qq.com^", "||wx.qq.com^"],
    "icon_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" className=\"d-none\"><symbol id=\"service_wechat\" viewBox=\"0 0 50 50\" fill=\"currentColor\"><path d=\"M 19 6 C 9.625 6 2 12.503906 2 20.5 C 2 24.769531 4.058594 28.609375 7.816406 31.390625 L 5.179688 39.304688 L 13.425781 34.199219 C 15.714844 34.917969 18.507813 35.171875 21.203125 34.875 C 23.390625 39.109375 28.332031 42 34 42 C 35.722656 42 37.316406 41.675781 38.796875 41.234375 L 45.644531 45.066406 L 43.734375 38.515625 C 46.3125 36.375 48 33.394531 48 30 C 48 23.789063 42.597656 18.835938 35.75 18.105469 C 34.40625 11.152344 27.367188 6 19 6 Z M 13 14 C 14.101563 14 15 14.898438 15 16 C 15 17.101563 14.101563 18 13 18 C 11.898438 18 11 17.101563 11 16 C 11 14.898438 11.898438 14 13 14 Z M 25 14 C 26.101563 14 27 14.898438 27 16 C 27 17.101563 26.101563 18 25 18 C 23.898438 18 23 17.101563 23 16 C 23 14.898438 23.898438 14 25 14 Z M 34 20 C 40.746094 20 46 24.535156 46 30 C 46 32.957031 44.492188 35.550781 42.003906 37.394531 L 41.445313 37.8125 L 42.355469 40.933594 L 39.105469 39.109375 L 38.683594 39.25 C 37.285156 39.71875 35.6875 40 34 40 C 27.253906 40 22 35.464844 22 30 C 22 24.535156 27.253906 20 34 20 Z M 29.5 26 C 28.699219 26 28 26.699219 28 27.5 C 28 28.300781 28.699219 29 29.5 29 C 30.300781 29 31 28.300781 31 27.5 C 31 26.699219 30.300781 26 29.5 26 Z M 38.5 26 C 37.699219 26 37 26.699219 37 27.5 C 37 28.300781 37.699219 29 38.5 29 C 39.300781 29 40 28.300781 40 27.5 C 40 26.699219 39.300781 26 38.5 26 Z\" /></symbol></svg>"
  }
  ```

    </details>

## <a id="how-to-build"></a> How to Build

```
yarn install
```

Run the following command:

```
yarn run compose
```

The build result can be found in the `assets` directory.

## <a id="localizations"></a> Localizations

Blocklist names, descriptions, and tags' names are translated via [crowdin](https://crowdin.com/project/adguard-applications/en#/miscellaneous/hostlists-registry).

`/locales` contains translations for filters, groups, and tags.

Base language strings:

- `locales/en/filters.json`
- `locales/en/tags.json`

In order to prepare these files run `yarn run locales:prepare`.
This script will scan filters meta and add filters names, descriptions, and tags meta to the base language files.

- Prepare: `yarn run locales:prepare`.
  This script will scan filters meta and add filters names, descriptions, and tags meta to the base language files.

- Upload base language strings: `yarn run locales:upload`
- Download translations: `yarn run locales:download`
