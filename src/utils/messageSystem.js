import { LocalStorageKey } from '../constants/localStorage-const';
import { formatString, getMemberInfo } from './commons';

export function convertMessageSystem(input, all_members, isDirect, isNotify = false) {
  if (!input) return '';

  const parts = input.split(' ');
  const number = parseInt(parts[0]);
  const userId = parts[1];
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const isMe = myUserId === userId;
  const memberInfo = getMemberInfo(userId, all_members);
  const userName = memberInfo ? memberInfo.name : formatString(userId);
  const name = isMe ? 'You' : userName;

  let channelName = '';
  let duration = '';
  let channelType = '';
  if (number === 1) {
    channelName = parts.slice(2).join(' ');
  }

  if (number === 14) {
    channelType = parts[2] === 'true' ? 'public' : 'private';
  }

  if (number === 15) {
    duration = parts[2];
  }

  // Xác định message tương ứng với number
  let message;
  switch (number) {
    case 1: // UpdateName
      if (isNotify) {
        message = `${name} has changed the channel name`;
      } else {
        message = `${name} changed the channel name to ${formatString(channelName, 20, 20)}`;
      }
      break;
    case 2: // UpdateImageDesc
      message = `${name} has changed the channel avatar`;
      break;
    case 3: // UpdateDescription
      message = `${name} has changed the channel description`;
      break;
    case 4: // MemberRemoved
      if (isNotify) {
        message = `${name} have been removed`;
      } else {
        message = `${name} has been removed from this channel`;
      }
      break;
    case 5: // MemberBanned
      if (isNotify) {
        message = `${name} have been banned from interacting`;
      } else {
        message = `${name} has been banned from interacting in this channel by Channel Admin`;
      }
      break;
    case 6: // MemberUnbanned
      if (isNotify) {
        message = `${name} have been unbanned`;
      } else {
        message = `${name} have been unbanned and now can interact in this channel`;
      }
      break;
    case 7: // MemberPromoted
      if (isNotify) {
        message = `${name} have been assigned as the moderator`;
      } else {
        message = `${name} has been assigned as the moderator for this channel`;
      }
      break;
    case 8: // MemberDemoted
      if (isNotify) {
        message = `${name} have been removed as the moderator`;
      } else {
        message = `${name} has been removed as the moderator from this channel`;
      }
      break;
    case 9: // UpdateChannelMemberCapabilities
      message = `${name} has updated member permission of channel`;
      break;
    case 10: // InviteAccepted
      if (isNotify) {
        message = `${name} joined ${isDirect ? 'conversation' : 'channel'}`;
      } else {
        message = `${name} joined this ${isDirect ? 'conversation' : 'channel'}`;
      }
      break;
    case 11: // InviteRejected
      if (isNotify) {
        message = `${name} has declined to join channel`;
      } else {
        message = `${name} has declined to join this channel`;
      }
      break;
    case 12: // MemberLeave
      if (isNotify) {
        message = `${name} has leaved channel`;
      } else {
        message = `${name} has leaved this channel`;
      }
      break;
    case 13: // TruncateMessages
      if (isNotify) {
        message = `${name} has truncate all messages`;
      } else {
        message = `${name} has truncate all messages of this channel`;
      }
      break;
    case 14: // UpdatePublic
      if (isNotify) {
        message = `${name} has made channel ${channelType}`;
      } else {
        message = `${name} has made this channel ${channelType}`;
      }
      break;
    case 15: // UpdateMemberMessageCooldown
      message =
        duration === '0'
          ? `Cooldown has been disabled`
          : `Cooldown feature enabled by Channel Admin. Cooldown duration set to ${convertDuration(duration)}`;
      break;
    case 16: // UpdateFilterWords
      message = `${name} has update channel filter words`;
      break;
    case 17: // MemberJoined
      if (isNotify) {
        message = `${name} has joined to channel`;
      } else {
        message = `${name} has joined to this channel`;
      }
      break;
    case 19: // PinnedMessage
      message = `${name} pinned a message`;
      break;
    case 20: // UnPinnedMessage
      message = `${name} unpinned a message`;
      break;
    default:
      message = input;
  }

  return message;
}

export function convertDuration(duration) {
  let durationText;
  switch (duration) {
    case '10000':
      durationText = '10 seconds';
      break;
    case '30000':
      durationText = '30 seconds';
      break;
    case '60000':
      durationText = '1 minutes';
      break;
    case '300000':
      durationText = '5 minutes';
      break;
    case '900000':
      durationText = '15 minutes';
      break;
    case '3600000':
      durationText = '60 minutes';
      break;
    default:
      durationText = '';
      break;
  }

  return durationText;
}

export function renderSystemMessage(input, all_members, isDirect, messages = []) {
  if (!input) return '';

  const parts = input.split(' ');
  const number = parseInt(parts[0]);
  const userId = parts[1];
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const isMe = myUserId === userId;
  const memberInfo = getMemberInfo(userId, all_members);
  const userName = memberInfo ? memberInfo.name : formatString(userId);
  const name = isMe ? 'You' : userName;

  let channelName = '';
  let duration = '';
  let channelType = '';
  let msgPreview = '';
  if (number === 1) {
    channelName = parts.slice(2).join(' ');
  }

  if (number === 14) {
    channelType = parts[2] === 'true' ? 'public' : 'private';
  }

  if (number === 15) {
    duration = parts[2];
  }

  if (messages && [19, 20].includes(number)) {
    const msgPreviewId = parts[2];
    const msg = messages.find(msg => msg.id === msgPreviewId);
    msgPreview = msg ? msg.text : '';
  }

  // Xác định message tương ứng với number
  let message;
  switch (number) {
    case 1: // UpdateName
      message = `<strong>${name}</strong> changed the channel name to <strong>${formatString(channelName, 20, 20)}</strong>`;
      break;
    case 2: // UpdateImageDesc
      message = `<strong>${name}</strong> has changed the channel avatar`;
      break;
    case 3: // UpdateDescription
      message = `<strong>${name}</strong> has changed the channel description`;
      break;
    case 4: // MemberRemoved
      message = `<strong>${name}</strong> has been removed from this channel`;
      break;
    case 5: // MemberBanned
      message = `<strong>${name}</strong> has been banned from interacting in this channel by Channel Admin`;
      break;
    case 6: // MemberUnbanned
      message = `<strong>${name}</strong> have been unbanned and now can interact in this channel`;
      break;
    case 7: // MemberPromoted
      message = `<strong>${name}</strong> has been assigned as the moderator for this channel`;
      break;
    case 8: // MemberDemoted
      message = `<strong>${name}</strong> has been removed as the moderator from this channel`;
      break;
    case 9: // UpdateChannelMemberCapabilities
      message = `<strong>${name}</strong> has updated member permission of channel`;
      break;
    case 10: // InviteAccepted
      message = `<strong>${name}</strong> joined this ${isDirect ? 'conversation' : 'channel'}`;
      break;
    case 11: // InviteRejected
      message = `<strong>${name}</strong> has declined to join this channel`;
      break;
    case 12: // MemberLeave
      message = `<strong>${name}</strong> has leaved this channel`;
      break;
    case 13: // TruncateMessages
      message = `<strong>${name}</strong> has truncate all messages of this channel`;
      break;
    case 14: // UpdatePublic
      message = `<strong>${name}</strong> has made this channel <strong>${channelType}</strong>`;
      break;
    case 15: // UpdateMemberMessageCooldown
      message =
        duration === '0'
          ? `Cooldown has been disabled`
          : `Cooldown feature enabled by Channel Admin. Cooldown duration set to <strong>${convertDuration(duration)}</strong>`;
      break;
    case 16: // UpdateFilterWords
      message = `<strong>${name}</strong> has update channel filter words`;
      break;
    case 17: // MemberJoined
      message = `<strong>${name}</strong> has joined to this channel`;
      break;
    case 19: // PinnedMessage
      message = `<strong>${name}</strong> pinned a message ${msgPreview ? `<strong>${formatString(msgPreview, 20, 10)}</strong>` : ''}`;
      break;
    case 20: // UnPinnedMessage
      message = `<strong>${name}</strong> unpinned a message ${msgPreview ? `<strong>${formatString(msgPreview, 20, 10)}</strong>` : ''}`;
      break;
    default:
      message = input;
  }

  return message;
}
