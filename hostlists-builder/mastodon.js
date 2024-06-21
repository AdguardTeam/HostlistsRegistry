/**
 * Returns an array of objects containing the following fields;
 * "domain": <string>,
 * "version": <string>,
 * "description": <string>,
 * "languages": Array<string> - containing ISO 639-1 language codes (en, fr, de),
 * "region": <string>,
 * "categories": Array<string> - A list of catgories
 * "proxied_thumbnail": <string>,
 * "total_users": <int>,
 * "last_week_users": <int>,
 * "approval_required": <boolean>,
 * "language": <string> - containing ISO 639-1 language code (en, fr, de),
 * "category": <string>
 *
 * @returns {Promise<Array>}
 */
 const serverList = async function () {
    /**
     *
     * @type {Promise<Response>}
     */
     let servers = await (await fetch('https://api.joinmastodon.org/servers'))
        .json();

        // Sort servers by total_users
        servers = servers.sort((a, b) => {
            if (a.total_users > b.total_users) {
                return -1;
            }

            if (a.total_users < b.total_users) {
                return 1;
            }

            return 0;
        });

    // Separately add the two Instances by Mastodon GmbH themselves.
    servers.unshift({
      domain: "mastodon.social"
    }, {
      domain: "mastodon.online"
    });

    return servers
        .slice(0, 99);
  }

// Compile server list
const compile = async function () {
    const result = (await serverList());

    const mastodonRules = result.map((element) => {
    if (!element.hasOwnProperty('domain')) {
        throw Error("Domain key not found in server list")
    }
    
    return `||${element.domain}^`
    });

    return mastodonRules;
}

module.exports = compile