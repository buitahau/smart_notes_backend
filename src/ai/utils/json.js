export const cleanJson = text => {
  // Remove markdown code fences
  text = text.replace(/```json|```/g, '');
  text = text.replace('<｜begin▁of▁sentence｜>', '');
  text = text.trim();

  // If array wrapped, take first element
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const arr = JSON.parse(text);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0];
      }
    } catch {}
  }

  return JSON.parse(text);
};
