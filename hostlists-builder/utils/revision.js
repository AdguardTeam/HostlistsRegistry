const versionUtils = require('./version');

const revisionIsNew = Symbol('This revision is new?');
const versionIsNew = Symbol('Version is new?');

/**
 * `revision.json` representation
 */
class Revision {
  /**
   * @param {Revision|undefined} object JSON representation
   */
  constructor(object = undefined) {
    if (!object) {
      this.timeUpdated = new Date().getTime();
      this.version = versionUtils.START_VERSION;
      this.hash = undefined;

      this[versionIsNew] = true;
      this[revisionIsNew] = true;
    } else {
      this.timeUpdated = object.timeUpdated;
      this.hash = object.hash;

      // Revision can be old, but not have a version field
      if (!object.version) {
        this.version = versionUtils.START_VERSION;
        this[versionIsNew] = true;
      } else {
        this.version = object.version;
        this[versionIsNew] = false;
      }

      this[revisionIsNew] = false;
    }
  }

  /**
   * Increments version if it wasn't new.
   */
  safelyIncrementVersion() {
    if (!this[versionIsNew]) {
      this.version = versionUtils.increment(this.version);
    }
  }

  /**
   * Sets hash string
   *
   * @param {string} hash
   */
  setHash(hash) {
    this.hash = hash;
  }

  /**
   * Updates timeUpdated revision wasn't new
   */
  safelyUpdateTime() {
    if (!this[revisionIsNew]) {
      this.timeUpdated = new Date().getTime();
    }
  }
  
  /**
   * Makes plain object
   */
  makePlainObject() {
    return {
      version: this.version,
      timeUpdated: this.timeUpdated,
      hash: this.hash,
    }
  }
}

module.exports = Revision;
