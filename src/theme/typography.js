import { pxToRem, responsiveFontSizes } from '../utils/getFontValue';

// ----------------------------------------------------------------------

// const FONT_PRIMARY = 'Manrope, Public Sans, sans-serif'; // Google Font
const FONT_PRIMARY = 'Raleway, sans-serif'; // Google Font
const FONT_SECONDARY = 'CircularStd, sans-serif'; // Local Font

const typography = {
  fontFamily: FONT_PRIMARY,
  fontWeightRegular: 400,
  fontWeightMedium: 600,
  fontWeightBold: 700,
  h1: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 80 / 64,
    fontSize: pxToRem(40),
    letterSpacing: 2,
    ...responsiveFontSizes({ sm: 52, md: 58, lg: 64 }),
  },
  h2: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 64 / 48,
    fontSize: pxToRem(32),
    ...responsiveFontSizes({ sm: 40, md: 44, lg: 48 }),
  },
  h3: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(24),
    ...responsiveFontSizes({ sm: 26, md: 30, lg: 32 }),
  },
  h4: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(20),
    ...responsiveFontSizes({ sm: 20, md: 24, lg: 24 }),
  },
  h5: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(18),
    ...responsiveFontSizes({ sm: 19, md: 20, lg: 20 }),
  },
  h6: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 28 / 18,
    fontSize: pxToRem(17),
    ...responsiveFontSizes({ sm: 18, md: 18, lg: 18 }),
  },
  subtitle1: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  subtitle2: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
  },
  body1: {
    fontVariant: 'lining-nums',
    lineHeight: 1.5,
    fontSize: pxToRem(16),
  },
  body2: {
    fontVariant: 'lining-nums',
    lineHeight: 22 / 14,
    fontSize: pxToRem(14),
    fontWeight: 400,
  },
  caption: {
    fontVariant: 'lining-nums',
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    fontWeight: 400,
  },
  overline: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 1.5,
    fontSize: pxToRem(12),
    textTransform: 'uppercase',
  },
  button: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
    lineHeight: 24 / 14,
    fontSize: pxToRem(14),
    textTransform: 'capitalize',
  },
  article: {
    fontVariant: 'lining-nums',
    fontWeight: 600,
  },
};

export default typography;
