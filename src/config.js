// @mui
import { enUS, viVN } from '@mui/material/locale';

// routes
import { PATH_DASHBOARD } from './routes/paths';

const apiURL = localStorage.getItem('api_url') || import.meta.env.VITE_API_URL;

export const DOMAIN_APP = import.meta.env.VITE_DOMAIN;
export const BASE_URL_PROFILE = apiURL;
export const BASE_URL = apiURL;
export const BASE_URL_WALLET = apiURL;
export const API_KEY = import.meta.env.VITE_API_KEY;
export const ERMIS_PROJECT_ID = import.meta.env.VITE_ERMIS_PROJECT_ID;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const defaultSettings = {
  themeMode: 'light',
  themeDirection: 'ltr',
  themeContrast: 'default',
  themeLayout: 'horizontal',
  themeColorPresets: 'default',
  themeStretch: false,
};

export const NAVBAR = {
  BASE_WIDTH: 260,
  DASHBOARD_WIDTH: 280,
  DASHBOARD_COLLAPSE_WIDTH: 88,
  //
  DASHBOARD_ITEM_ROOT_HEIGHT: 48,
  DASHBOARD_ITEM_SUB_HEIGHT: 40,
  DASHBOARD_ITEM_HORIZONTAL_HEIGHT: 32,
};

export const allLangs = [
  {
    label: 'English',
    value: 'en',
    systemValue: enUS,
    icon: '/assets/icons/flags/ic_flag_en.svg',
  },
  {
    label: 'Vietnamese',
    value: 'vn',
    systemValue: viVN,
    icon: '/assets/icons/flags/ic_flag_vn.svg',
  },
];

export const defaultLang = allLangs[0]; // English

// DEFAULT ROOT PATH
export const DEFAULT_PATH = PATH_DASHBOARD.general.app; // as '/channels'

export const WIDTH_LEFT_PANEL = 377;
export const WIDTH_SIDEBAR_PANEL = 430;
export const WIDTH_SIDE_NAV = 98;
