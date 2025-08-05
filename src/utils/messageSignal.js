import { CallType } from '../constants/commons-const';
import { LocalStorageKey } from '../constants/localStorage-const';

export function convertMessageSignal(input) {
  if (!input) return null;

  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const parts = input.split(' ');
  const number = parseInt(parts[0]);
  const callerId = parts[1];
  const isMe = myUserId === callerId; // tôi là người gọi

  let enderId = '';
  let duration = '';
  let callType = '';
  let color = '';
  if (number === 3 || number === 6) {
    enderId = parts[2];
    duration = parts[3] === '0' ? '' : parts[3];
  }

  // Xác định text tương ứng với number
  let text;
  switch (number) {
    case 1: // AudioCallStarted
      text = ``;
      callType = CallType.AUDIO;
      color = '';
      break;
    case 2: // AudioCallMissed
      text = isMe ? 'Outgoing audio call' : 'You missed audio call';
      callType = CallType.AUDIO;
      color = '#FF4842';
      break;
    case 3: // AudioCallEnded
      if (duration) {
        text = isMe ? 'Outgoing audio call' : 'Incoming audio call';
        color = '#54D62C';
      } else {
        if (enderId === myUserId) {
          text = 'You cancel audio call';
        } else {
          text = 'You missed audio call';
        }
        color = '#FF4842';
      }
      callType = CallType.AUDIO;
      break;
    case 4: // VideoCallStarted
      text = ``;
      callType = CallType.VIDEO;
      color = '';
      break;
    case 5: // VideoCallMissed
      text = isMe ? 'Outgoing video call' : 'You missed video call';
      callType = CallType.VIDEO;
      color = '#FF4842';
      break;
    case 6: // VideoCallEnded
      if (duration) {
        text = isMe ? 'Outgoing video call' : 'Incoming video call';
        color = '#54D62C';
      } else {
        if (enderId === myUserId) {
          text = 'You cancel video call';
        } else {
          text = 'You missed video call';
        }
        color = '#FF4842';
      }
      callType = CallType.VIDEO;
      break;
    case 7: // AudioCallRejected
      text = isMe ? 'Recipient rejected audio call' : 'You rejected audio call';
      callType = CallType.AUDIO;
      color = '#FF4842';
      break;
    case 8: // VideoCallCallRejected
      text = isMe ? 'Recipient rejected video call' : 'You rejected video call';
      callType = CallType.VIDEO;
      color = '#FF4842';
      break;
    case 9: // AudioCallBusy
      text = isMe ? 'Recipient was busy' : 'You missed audio call';
      callType = CallType.AUDIO;
      color = '#FF4842';
      break;
    case 10: // VideoCallBusy
      text = isMe ? 'Recipient was busy' : 'You missed video call';
      callType = CallType.VIDEO;
      color = '#FF4842';
      break;
    default:
      text = input;
      callType = '';
      color = '';
  }

  return { text, duration: formatDuration(duration), callType, color };
}

export const formatDuration = duration => {
  if (!duration) return '';

  const totalSeconds = Math.floor(duration / 1000); // Chuyển từ ms sang giây
  const minutes = Math.floor(totalSeconds / 60); // Số phút
  const seconds = totalSeconds % 60; // Số giây còn lại

  return `${minutes} min, ${seconds} sec`;
};
