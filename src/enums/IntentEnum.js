/**
 * Intent enumeration for query classification
 */
class IntentEnum {
  static TASK_LIST = 'task_list';
  static DATE_LOOKUP = 'date_lookup';
  static INFORMATION_RETRIEVAL = 'information_retrieval';
  static UNKNOWN = 'unknown';

  static values() {
    return [
      this.TASK_LIST,
      this.DATE_LOOKUP,
      this.INFORMATION_RETRIEVAL,
      this.UNKNOWN,
    ];
  }

  static isValid(intent) {
    return this.values().includes(intent);
  }
}

export default IntentEnum;
