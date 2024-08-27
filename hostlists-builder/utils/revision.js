const versionUtils = require('./version');

const revisionIsNew = Symbol('This revision is new?');
const versionIsNew = Symbol('Version is new?');

/**
 * `revision.json` representation
 */
class Revision {
  #timeUpdatedCandidate;
  #versionCandidate;

  #originalTimeUpdated;
  #originalVersion;
  #originalHash;

  /**
   * If the object is constructed with empty fields, initial values will be assigned.
   * 
   * @param {{ version: string|undefined, hash: string, timeUpdated: string } | undefined} object JSON representation
   */
  constructor(object = undefined) {
    if (!object) {
      this.#originalTimeUpdated = new Date().getTime();
      this.#originalVersion = versionUtils.START_VERSION;
      this.#originalHash = undefined;

      this[versionIsNew] = true;
      this[revisionIsNew] = true;
    } else {
      this.#originalTimeUpdated = object.timeUpdated;
      this.#originalHash = object.hash;

      // Revision can be old, but not have a version field
      if (!object.version) {
        this.#originalVersion = versionUtils.START_VERSION;
        this[versionIsNew] = true;
      } else {
        this.#originalVersion = object.version;
        this[versionIsNew] = false;
      }

      this[revisionIsNew] = false;
    }
  }

  /**
   * Set an incremented version or an initial version if object is new. 
   */
  setVersionCandidate() {
    if (!this[versionIsNew]) {
      this.#versionCandidate = versionUtils.increment(this.#originalVersion); 
    } else {
      this.#versionCandidate = versionUtils.START_VERSION;
    }
  }

  /**
   * Sets a "timeUpdated" candidate
   */
  setTimeUpdatedCandidate() {
    if (!this.#timeUpdatedCandidate) {
      this.#timeUpdatedCandidate = this.#originalTimeUpdated;
    }
  }

  /**
   * @return {string|undefined}
   */
  getOriginalHash() {
    return this.#originalHash;
  }

  /**
   * @return {string}
   */
  getOriginalVersion() {
    return this.#originalVersion;
  }

  /**
   * @return {string}
   */
  getOriginalTimeUpdated() {
    return this.#originalTimeUpdated;
  }

  /**
   * @return {string}
   */
  getVersionCandidate() {
    return this.#versionCandidate;
  }

  /**
   * This makes a new Revision object from candidate fields and new hash
   * 
   * @param {string} newHash
   */
  makeNewRevisionFromCandidates(newHash) {
    return new Revision({
      hash: newHash,
      timeUpdated: this.#timeUpdatedCandidate,
      version: this.#versionCandidate
    });
  }
  
  /**
   * Makes plain object from original (or initial) values
   */
  makePlainObjectFromOriginalValues() {
    return {
      version: this.#originalVersion,
      timeUpdated: this.#originalTimeUpdated,
      hash: this.#originalHash,
    }
  }
}

module.exports = Revision;
