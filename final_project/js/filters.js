export function readFilters(form) {
  return Object.fromEntries(new FormData(form));
}
