import { ErmisChat, ErmisDirectCall } from 'ermis-chat-js-sdk';
import { API_KEY, BASE_URL } from './config';
import { LocalStorageKey } from './constants/localStorage-const';

let client;
let callClient;

const connectUser = async (projectId, user_id, token, dispatch) => {
  client = ErmisChat.getInstance(API_KEY, projectId, {
    timeout: 6000,
    baseURL: BASE_URL,
  });

  try {
    await client.connectUser(
      {
        api_key: API_KEY,
        id: user_id,
        name: user_id,
        image: '',
      },
      `Bearer ${token}`,
    );
    const sessionID =
      window.localStorage.getItem(LocalStorageKey.SessionId) || `cb1a4db8-33f0-43dd-a48a-${user_id.slice(-12)}`;
    callClient = new ErmisDirectCall(client, sessionID);
    return true;
  } catch (error) {
    handleError(dispatch, error);
    return false;
  }
};

export { client, connectUser, callClient };
