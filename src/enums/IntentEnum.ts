/**
 * Intent enumeration for query classification
 */
class IntentEnum {
    static readonly TASK_LIST = 'task_list';
    static readonly DATE_LOOKUP = 'date_lookup';
    static readonly UNKNOWN = 'unknown';

    static values(): string[] {
        return [this.TASK_LIST, this.DATE_LOOKUP, this.UNKNOWN];
    }

    static isValid(intent: string): boolean {
        return this.values().includes(intent);
    }
}

export default IntentEnum;
