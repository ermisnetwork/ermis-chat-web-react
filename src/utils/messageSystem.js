import { LocalStorageKey } from '../constants/localStorage-const';
import { formatString, getMemberInfo } from './commons';

export function convertMessageSystem(input, all_members, isDirect, isNotify = false, t) {
  if (!input) return '';
  const parts = input.split(' ');
  const number = parseInt(parts[0]);
  const userId = parts[1];
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const isMe = myUserId === userId;
  const memberInfo = getMemberInfo(userId, all_members);
  const userName = memberInfo ? memberInfo.name : formatString(userId);
  const name = isMe ? t('messageSystem.You') : userName;

  let channelName = '';
  let duration = '';
  let channelType = '';
  if (number === 1) {
    channelName = parts.slice(2).join(' ');
  }

  if (number === 14) {
    channelType = parts[2] === 'true' ? t('messageSystem.public') : t('messageSystem.private');
  }

  if (number === 15) {
    duration = parts[2];
  }

  // Xác định message tương ứng với number
  let message;
  switch (number) {
    case 1: // UpdateName
      if (isNotify) {
        message = `${name} ${t('messageSystem.channel_update_name')}`;
      } else {
        message = `${name} ${t('messageSystem.channel_update_name_to')} ${formatString(channelName, 20, 20)}`;
      }
      break;
    case 2: // UpdateImageDesc
      message = `${name} ${t('messageSystem.channel_update_avatar')}`;
      break;
    case 3: // UpdateDescription
      message = `${name} ${t('messageSystem.channel_update_description')}`;
      break;
    case 4: // MemberRemoved
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_removed')}`;
      } else {
        message = `${name} ${t('messageSystem.member_removed_from_channel')}`;
      }
      break;
    case 5: // MemberBanned
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_banned')}`;
      } else {
        message = `${name} ${t('messageSystem.member_banned_by_admin')}`;
      }
      break;
    case 6: // MemberUnbanned
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_unbanned')}`;
      } else {
        message = `${name} ${t('messageSystem.member_unbanned_channel')}`;
      }
      break;
    case 7: // MemberPromoted
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_promoted')}`;
      } else {
        message = `${name} h${t('messageSystem.member_promoted_channel')}`;
      }
      break;
    case 8: // MemberDemoted
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_demoted')}`;
      } else {
        message = `${name} ${t('messageSystem.member_demoted_channel')}`;
      }
      break;
    case 9: // UpdateChannelMemberCapabilities
      message = `${name} ${t('messageSystem.channel_update_member_capabilities')}`;
      break;
    case 10: // InviteAccepted
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_joined')} ${isDirect ? t('messageSystem.conversation') : t('messageSystem.channel')}`;
      } else {
        message = `${name} ${t('messageSystem.joined_channel')} ${isDirect ? t('messageSystem.conversation') : t('messageSystem.channel')}`;
      }
      break;
    case 11: // InviteRejected
      if (isNotify) {
        message = `${name} ${t('messageSystem.invite_rejected')}`;
      } else {
        message = `${name} ${t('messageSystem.invite_rejected_channel')}`;
      }
      break;
    case 12: // MemberLeave
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_leaved')}`;
      } else {
        message = `${name} ${t('messageSystem.member_leaved_channel')}`;
      }
      break;
    case 13: // TruncateMessages
      if (isNotify) {
        message = `${name} ${t('messageSystem.channel_truncate_messages')}`;
      } else {
        message = `${name} ${t('messageSystem.channel_truncate_messages_all')}`;
      }
      break;
    case 14: // UpdatePublic
      if (isNotify) {
        message = `${name} ${t('messageSystem.channel_update_public')} ${channelType}`;
      } else {
        message = `${name} ${t('messageSystem.channel_update_public_this')} ${channelType}`;
      }
      break;
    case 15: // UpdateMemberMessageCooldown
      message =
        duration === '0'
          ? `${t('messageSystem.channel_update_cooldown_disabled')}`
          : `${t('messageSystem.channel_update_cooldown_enabled')} ${convertDuration(duration, t)}`;
      break;
    case 16: // UpdateFilterWords
      message = `${name} ${t('messageSystem.channel_update_filter_words')}`;
      break;
    case 17: // MemberJoined
      if (isNotify) {
        message = `${name} ${t('messageSystem.member_joined_channel')}`;
      } else {
        message = `${name} ${t('messageSystem.member_joined_this_channel')}`;
      }
      break;
    case 19: // PinnedMessage
      message = `${name} ${t('messageSystem.message_pinned')}`;
      break;
    case 20: // UnPinnedMessage
      message = `${name} ${t('messageSystem.message_unpinned')}`;
      break;
    default:
      message = input;
  }

  return message;
}

export function convertDuration(duration, t) {
  let durationText;
  switch (duration) {
    case '10000':
      durationText = `10 ${t('messageSystem.seconds')}`;
      break;
    case '30000':
      durationText = `30 ${t('messageSystem.seconds')}`;
      break;
    case '60000':
      durationText = `1 ${t('messageSystem.minutes')}`;
      break;
    case '300000':
      durationText = `5 ${t('messageSystem.minutes')}`;
      break;
    case '900000':
      durationText = `15 ${t('messageSystem.minutes')}`;
      break;
    case '3600000':
      durationText = `60 ${t('messageSystem.minutes')}`;
      break;
    default:
      durationText = '';
      break;
  }

  return durationText;
}

export function renderSystemMessage(input, all_members, isDirect, messages = [], t) {
  if (!input) return '';
  const parts = input.split(' ');
  const number = parseInt(parts[0]);
  const userId = parts[1];
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const isMe = myUserId === userId;
  const memberInfo = getMemberInfo(userId, all_members);
  const userName = memberInfo ? memberInfo.name : formatString(userId);
  const name = isMe ? t('messageSystem.You') : userName;

  let channelName = '';
  let duration = '';
  let channelType = '';
  let msgPreview = '';
  if (number === 1) {
    channelName = parts.slice(2).join(' ');
  }

  if (number === 14) {
    channelType = parts[2] === 'true' ? t('messageSystem.public') : t('messageSystem.private');
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
      message = `<strong>${name}</strong> ${t('messageSystem.channel_update_name_to')} <strong>${formatString(channelName, 20, 20)}</strong>`;
      break;
    case 2: // UpdateImageDesc
      message = `<strong>${name}</strong> ${t('messageSystem.channel_update_avatar')}`;
      break;
    case 3: // UpdateDescription
      message = `<strong>${name}</strong> ${t('messageSystem.channel_update_description')}`;
      break;
    case 4: // MemberRemoved
      message = `<strong>${name}</strong> ${t('messageSystem.member_removed_from_channel')}`;
      break;
    case 5: // MemberBanned
      message = `<strong>${name}</strong> ${t('messageSystem.member_banned_by_admin')}`;
      break;
    case 6: // MemberUnbanned
      message = `<strong>${name}</strong> ${t('messageSystem.member_unbanned_channel')}`;
      break;
    case 7: // MemberPromoted
      message = `<strong>${name}</strong> ${t('messageSystem.member_promoted_channel')}`;
      break;
    case 8: // MemberDemoted
      message = `<strong>${name}</strong> ${t('messageSystem.member_demoted_channel')}`;
      break;
    case 9: // UpdateChannelMemberCapabilities
      message = `<strong>${name}</strong> ${t('messageSystem.channel_update_member_capabilities')}`;
      break;
    case 10: // InviteAccepted
      message = `<strong>${name}</strong> ${t('messageSystem.joined_channel')} ${isDirect ? t('messageSystem.conversation') : t('messageSystem.channel')}`;
      break;
    case 11: // InviteRejected
      message = `<strong>${name}</strong> ${t('messageSystem.invite_rejected_channel')}`;
      break;
    case 12: // MemberLeave
      message = `<strong>${name}</strong> ${t('messageSystem.member_leaved_channel')}`;
      break;
    case 13: // TruncateMessages
      message = `<strong>${name}</strong> ${t('messageSystem.channel_truncate_messages_all')}`;
      break;
    case 14: // UpdatePublic
      message = `<strong>${name}</strong> ${t('messageSystem.channel_update_public_this')} <strong>${channelType}</strong>`;
      break;
    case 15: // UpdateMemberMessageCooldown
      message =
        duration === '0'
          ? `${t('messageSystem.channel_update_cooldown_disabled')}`
          : `${t('messageSystem.channel_update_cooldown_enabled')} <strong>${convertDuration(duration, t)}</strong>`;
      break;
    case 16: // UpdateFilterWords
      message = `<strong>${name}</strong> ${t('messageSystem.channel_update_filter_words')}`;
      break;
    case 17: // MemberJoined
      message = `<strong>${name}</strong> ${t('messageSystem.member_joined_this_channel')}`;
      break;
    case 19: // PinnedMessage
      message = `<strong>${name}</strong> ${t('messageSystem.message_pinned')} ${msgPreview ? `<strong>${formatString(msgPreview, 20, 10)}</strong>` : ''}`;
      break;
    case 20: // UnPinnedMessage
      message = `<strong>${name}</strong> ${t('messageSystem.message_unpinned')} ${msgPreview ? `<strong>${formatString(msgPreview, 20, 10)}</strong>` : ''}`;
      break;
    default:
      message = input;
  }

  return message;
}
