import axios from 'axios';
// config
import { BASE_URL_WALLET } from '../config';

// ----------------------------------------------------------------------

const axiosWalletInstance = axios.create({ baseURL: BASE_URL_WALLET });

axiosWalletInstance.interceptors.response.use(
  response => response,
  error => Promise.reject((error.response && error.response.data) || 'Something went wrong'),
);

export default axiosWalletInstance;
