/**
 * Category enumeration for query classification
 */
class CategoryEnum {
  static ON_A_DATE = 'on-a-date';
  static INFORMATION = 'information';

  static values() {
    return [
      this.ON_A_DATE,
      this.INFORMATION,
    ];
  }

  static isValid(category) {
    return this.values().includes(category);
  }
}

export default CategoryEnum;
