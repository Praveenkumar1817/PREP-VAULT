// Small utility helpers used across the app
// cn: simple classNames merger — accepts strings, falsy values, and objects
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .map((part) => {
      if (typeof part === 'string') return part;
      if (typeof part === 'object') {
        return Object.entries(part)
          .filter(([_, v]) => Boolean(v))
          .map(([k]) => k)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}
