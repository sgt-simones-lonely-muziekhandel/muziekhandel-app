// The gilded picture frames in public/art/shop/frames, shared by the shop wall and the gallery close-up.
// `w`/`h` are the image size; `inner` is the transparent opening [left, top, right, bottom] in pixels;
// `oval` frames get an oval portrait.
export const FRAME_SRC = name => `public/art/shop/frames/${name}.webp`;

export const FRAME_TYPES = {
  'oval-large': { w: 384, h: 574, inner: [76, 138, 309, 472], oval: true },
  'oval-small': { w: 325, h: 510, inner: [46, 116, 278, 419], oval: true },
  'rect-large': { w: 472, h: 622, inner: [85, 157, 385, 538] },
  'rect-medium': { w: 333, h: 466, inner: [66, 124, 266, 400] },
  'rect-small': { w: 370, h: 398, inner: [90, 123, 279, 301] },
};

// Which frame each composer hangs in.
export const COMPOSER_FRAME = {
  bach: 'oval-small', mozart: 'rect-large', beethoven: 'oval-small',
  chopin: 'rect-medium', verdi: 'oval-large', tchaikovsky: 'rect-small',
};
