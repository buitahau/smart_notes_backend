export const convertDateToTimestamp = (date: Date | string): string => {
    if (!date) {
        return '';
    }
    return '' + Math.floor(new Date(date).getTime() / 1000);
};
