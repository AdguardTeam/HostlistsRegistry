const fs = require('fs');
const path = require('path');

/**
 * Sync reads file content
 *
 * @param path
 * @returns {*}
 */
const readFile = async function (path) {
    try {
        await fs.promises.access(path, fs.constants.F_OK);
        return fs.promises.readFile(path, { encoding: 'utf-8' });
    } catch (e) {
        return null;
    }
};

/**
 * Sync writes content to file
 *
 * @param path
 * @param data
 */
const writeFile = async function (path, data) {
  if (typeof data !== 'string') {
    data = JSON.stringify(data, null, '\t');
  }

  await fs.promises.writeFile(path, data, { encoding: 'utf-8' });
};

/**
 * Lists directories in the base directory.
 *
 * @param {String} baseDir - base directory
 *
 * @returns {string[]}
 */
const listDirs = async function (baseDir) {
    const out = [];
    for (const file of await fs.promises.readdir(baseDir)) {
        const currentPath = path.join(baseDir, file);
        const stats = await fs.promises.stat(currentPath);

        if (stats.isDirectory()) {
            out.push(currentPath);
        }
    }

    return out;
};

/**
 * Split async tasks to chunks
 */
const DEFERRED_RUNNER_CHUNK_SIZE = 3;

/**
 * Deferred tasks runner
 */
class DeferredRunner {
    constructor() {
        /**
         * Async task list
         *
         * @var {AsyncFunction[]}
         */
        this.tasks = [];
    }

    /**
     * Push task to queue
     *
     * @param {AsyncFunction}
     */
    push(task) {
        this.tasks.push(task);
    }

    /**
     * Runs all tasks sequentially
     */
    async run() {
        for (const chunk of this.spread()) {
            await Promise.all(chunk.map((task) => task()));
        }

        this.tasks.length = 0;
    }

    * spread() {
        for (let i = 0; i < this.tasks.length; i += DEFERRED_RUNNER_CHUNK_SIZE) {
            yield this.tasks.slice(i, i + DEFERRED_RUNNER_CHUNK_SIZE);
        }
    }
}

module.exports = {
    readFile,
    writeFile,
    listDirs,
    DeferredRunner,
};
