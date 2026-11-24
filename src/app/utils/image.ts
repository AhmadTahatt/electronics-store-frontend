/** Neutral grey placeholder drawn inline (no request to any other website). */
const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">' +
    '<rect width="600" height="600" fill="#F7F7F9"/>' +
    '<rect x="215" y="150" width="170" height="300" rx="26" fill="none" stroke="#1428A0" stroke-width="14"/>' +
    '<circle cx="300" cy="418" r="12" fill="#1428A0"/>' +
    '</svg>'
  );

/** Use as (error)="onImageError($event)". Replaces a broken image once (no infinite loop). */
export function onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (img.dataset['fallback']) return;
  img.dataset['fallback'] = '1';
  img.src = FALLBACK;
}
