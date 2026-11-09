import { Platform } from 'react-native';

const ANDROID_LOCALHOST = 'api-apps.arsema.co.id';
const IOS_LOCALHOST = 'api-apps.arsema.co.id';

const HOST = Platform.OS === 'android' ? ANDROID_LOCALHOST : IOS_LOCALHOST;

export const API_BASE_URL = `https://${HOST}/api`;

export const TRANSFER_VA_CREATE_URL = 'https://apisnpdev.arsema.co.id/api/transfer-va-create';

export const AUTH_KEY = 'h73k1h-fu3e-753f-h37g-72hnc8ajsfa2';

export const AUTH_SECRET = '7hd7hs-uf34-2341-731j-78ja730kf72';

export const BASIC_AUTH = 'Basic ' + btoa('admin:password');
