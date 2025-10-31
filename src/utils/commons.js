import { showSnackbar } from '../redux/slices/app';
import axiosWalletInstance from './axiosWallet';
import { ChatType, RoleMember, TabType } from '../constants/commons-const';
import { LocalStorageKey } from '../constants/localStorage-const';
import { fromBlob } from 'image-resize-compress';
import heic2any from 'heic2any';

export default function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase();
}

export function formatFileSize(size) {
  if (!size) return '0 KB';

  if (size >= 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  } else {
    return (size / 1024).toFixed(1) + ' KB';
  }
}

export function getChannelName(channel, all_members) {
  if (!channel) return '';
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);

  if (channel.data.type === ChatType.MESSAGING) {
    const otherMember = Object.values(channel.state.members).find(member => member.user.id !== myUserId);
    let name = '';
    if (otherMember) {
      const userInfo = all_members && all_members.find(user => user.id === otherMember.user.id);
      name = userInfo ? userInfo.name : otherMember.user.id;
    } else {
      name = '';
    }
    return formatString(name);
  }
  return formatString(channel.data.name, 20, 10);
}

export function getNameChannelDirect(members, users) {
  if (!members.length) return '';
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);

  const otherMember = members.find(member => member.user.id !== myUserId);
  const otherMemberId = otherMember.user_id;
  const otherMemberInfo = users[otherMemberId] || null;

  return otherMemberInfo ? otherMemberInfo.name : otherMemberId;
}

export function formatString(str, start = 4, end = 6) {
  if (!str) {
    return '';
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
    return str;
  }
  if (str.length <= 30) {
    return str;
  }

  const startString = str.substring(0, start);

  const endString = str.substring(str.length - end);

  return startString + '...' + endString;
}

export function getMemberInfo(memberId, all_members) {
  if (!memberId || !all_members || all_members.length === 0) return null;

  const userInfo = all_members.find(user => user.id === memberId);

  return userInfo ? userInfo : { name: memberId, id: memberId, avatar: '' };
}

export async function onRefreshToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await axiosWalletInstance.post('/refresh', { refresh_token: refreshToken });
    if (response) {
      const newToken = response.data.token;
      const newRefreshToken = response.data.refresh_token;
      localStorage.setItem(LocalStorageKey.AccessToken, newToken);
      localStorage.setItem(LocalStorageKey.RefreshToken, newRefreshToken);
      window.location.reload();
    }
  } catch (error) {}
}

export function handleError(dispatch, error, t) {
  if (error.response) {
    if (error.response.status === 401) {
      onRefreshToken();
    } else if (error.response.status === 500) {
      dispatch(showSnackbar({ severity: 'error', message: t('commons.snackbar_server_error') }));
    } else {
      const message = error.response.data?.message ? error.response.data.message : error.response.data;
      dispatch(showSnackbar({ severity: 'error', message: message }));
    }
  } else {
    if (error.message) {
      dispatch(showSnackbar({ severity: 'error', message: error.message }));
    } else {
      dispatch(showSnackbar({ severity: 'error', message: t('commons.snackbar_server_error') }));
    }
  }
}

export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error('There was an error downloading the file:', error);
  }
}

export async function getThumbBlobVideo(file, seekTo = 0.1) {
  return new Promise((resolve, reject) => {
    // load the file to a video player
    const videoPlayer = document.createElement('video');
    videoPlayer.setAttribute('src', URL.createObjectURL(file));
    videoPlayer.load();
    videoPlayer.addEventListener('error', ex => {
      reject('error when loading video file', ex);
    });
    // load metadata of the video to get video duration and dimensions
    videoPlayer.addEventListener('loadedmetadata', () => {
      // seek to user defined timestamp (in seconds) if possible
      if (videoPlayer.duration < seekTo) {
        reject('video is too short.');
        return;
      }
      // delay seeking or else 'seeked' event won't fire on Safari
      setTimeout(() => {
        videoPlayer.currentTime = seekTo;
      }, 200);
      // extract video thumbnail once seeking is complete
      videoPlayer.addEventListener('seeked', () => {
        console.log('video is now paused at %ss.', seekTo);
        // define a canvas to have the same dimension as the video
        const canvas = document.createElement('canvas');
        canvas.width = videoPlayer.videoWidth;
        canvas.height = videoPlayer.videoHeight;
        // draw the video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
        // return the canvas image as a blob
        ctx.canvas.toBlob(
          blob => {
            resolve(blob);
          },
          'image/jpeg',
          0.75 /* quality */,
        );
      });
    });
  });
}

export function checkPendingInvite(channel) {
  if (!channel) return false;
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const member = channel.state.members[myUserId];
  if (!member) return false;

  return [RoleMember.PENDING, RoleMember.SKIPPED].includes(member.channel_role) && channel.state.members[myUserId];
}

export function checkPermissionDeleteMessage(message, channelType, userId, userRole) {
  const isMyMessage = message.user.id === userId;

  if (isMyMessage) {
    return true;
  } else {
    if (channelType === ChatType.MESSAGING) {
      return false;
    } else {
      if (userRole === RoleMember.OWNER) {
        return true;
      } else {
        return false;
      }
    }
  }
}

export function checkMyMessage(myUserId, userId) {
  const isMyMessage = myUserId === userId;

  if (isMyMessage) {
    return true;
  } else {
    return false;
  }
}

export function isChannelDirect(channel) {
  if (!channel) return null;

  return channel.data.type === ChatType.MESSAGING;
}

export function getChannelMembers(channel, all_members) {
  if (!channel || !all_members || all_members.length === 0) return [];

  // const rolePriority = {
  //   owner: 1,
  //   moder: 2,
  //   member: 3,
  //   pending: 4,
  // };

  const members = Object.values(channel.state.members)
    .map(item => {
      const name = item.user?.name || item.user?.id;
      const avatar = item.user?.avatar || '';

      return { ...item, name, avatar, id: item.user_id };
    })
    .sort((a, b) => {
      // So sánh theo thứ tự role trước
      // if (rolePriority[a.channel_role] !== rolePriority[b.channel_role]) {
      //   return rolePriority[a.channel_role] - rolePriority[b.channel_role];
      // }
      // Nếu role giống nhau, so sánh theo tên (alphabetical order)
      return a.name.localeCompare(b.name);
    });

  return members || [];
}

export function getMemberInfoInChannel(member, all_members) {
  if (!member || !all_members) return null;

  const userInfo = all_members.find(user => user.id === member.user_id);
  const name = userInfo ? userInfo.name : '';
  const avatar = userInfo ? userInfo.avatar : '';

  return { ...member, name, avatar, id: member.user_id };
}

export function myRoleInChannel(channel) {
  if (!channel) return '';
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const member = channel.state.members[myUserId];

  if (!member) return '';
  return member.channel_role;
}

export function checkDirectBlock(channel) {
  if (!channel) return false;
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  const member = channel.state.members[myUserId];
  if (!member) return false;
  return member.blocked;
}

export function splitChannelId(id) {
  if (typeof id !== 'string' || id.trim() === '') {
    return null;
  }

  const [prefix, ...rest] = id.split(':');

  const remaining = rest.join(':');

  return {
    channelType: prefix,
    channelId: remaining,
  };
}

export function isPublicChannel(channel) {
  if (!channel) return null;

  return channel.data.type === ChatType.TEAM && channel.data.public;
}

export function isGuestInPublicChannel(channel) {
  if (!channel) return null;

  if (channel.data.type === ChatType.TEAM && channel.data.public) {
    const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
    return !channel.state.members[myUserId];
  }

  return false;
}

export function isStagingDomain() {
  const domain = window.location.origin;

  return domain.includes('chat-staging.ermis.network');
  // return domain === 'https://chat-staging.ermis.network';
}

export async function processImageFile(file, isAvatarUpload = false) {
  const isImage = file.type.startsWith('image/');
  if (['image/svg+xml', 'image/gif'].includes(file.type) || !isImage || !isAvatarUpload) {
    return file;
  }

  // Nếu file là HEIC, chuyển sang JPG
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    try {
      const jpgBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8,
      });

      return new File([jpgBlob], file.name.replace(/\.\w+$/, '.jpg'), {
        type: 'image/jpeg',
      });
    } catch (error) {
      return file;
    }
  } else {
    const quality = 50;
    const width = 'auto'; // Original width
    const height = 'auto'; // Original height
    const format = 'jpeg';
    const resultBlob = await fromBlob(file, quality, width, height, format);

    const resultFile = new File([resultBlob], file.name, {
      type: file.type,
    });
    return resultFile;
  }
}

export function displayMessageWithMentionName(text, mentions) {
  const myUserId = window.localStorage.getItem(LocalStorageKey.UserId);
  if (!mentions) return text;

  mentions.forEach(user => {
    if (user.mentionId === '@all') {
      text = text.replaceAll(user.mentionId, `<span class="mentionHighlight mentionAll">${user.mentionName}</span>`);
    } else if (user.id === myUserId) {
      text = text.replaceAll(user.mentionId, `<span class="mentionHighlight mentionMe">${user.mentionName}</span>`);
    } else {
      text = text.replaceAll(user.mentionId, `<span class="mentionHighlight">${user.mentionName}</span>`);
    }
  });
  return text;
}

export const replaceMentionsWithNames = (text, mentions) => {
  if (!mentions) return text;

  mentions.forEach(user => {
    text = text.replaceAll(user.mentionId, user.mentionName);
  });
  return text;
};

export const replaceMentionsWithIds = (text, mentions) => {
  if (!mentions) return text;

  const queues = mentions.reduce((acc, m) => {
    (acc[m.mentionName] ??= []).push(m);
    return acc;
  }, {});

  return text
    .split(/(@\S+)/g)
    .map(part => {
      if (queues[part]?.length) {
        return queues[part].shift().mentionId;
      }
      return part;
    })
    .join('');
};

export function removeVietnameseTones(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const isEmptyObject = obj => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};
