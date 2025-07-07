import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { handleError, isChannelDirect, myRoleInChannel } from '../../utils/commons';
import { onEditMessage, onFilesMessage, onReplyMessage, onSetAttachmentsMessage } from '../../redux/slices/messages';
import ReplyMessageBox from '../../sections/dashboard/ReplyMessageBox';
import EditMessageBox from '../../sections/dashboard/EditMessageBox';
import { showSnackbar } from '../../redux/slices/app';
import CooldownMessage from '../CooldownMessage';
import * as linkify from 'linkifyjs';
import { RoleMember, UploadType } from '../../constants/commons-const';
import Mentions from '../Mentions';
import { ClientEvents } from '../../constants/events-const';
import { AddMention, RemoveMention } from '../../redux/slices/channel';
import useMentions from '../../hooks/useMentions';
import uuidv4 from '../../utils/uuidv4';
import { client } from '../../client';
import ActionsChatPopover from '../ActionsChatPopover';
import { MicrophoneIcon, PictureImageIcon, SendIcon, SmileyStickerIcon } from '../Icons';
import EmojiPickerPopover from '../EmojiPickerPopover';
import RecordingAudioBox from '../../sections/dashboard/RecordingAudioBox';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ChatFooter = ({ currentChannel, setMessages, isDialog, usersTyping }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const inputRef = useRef(null);
  const recordingBoxRef = useRef(null);
  const { quotesMessage, editMessage, attachmentsMessage } = useSelector(state => state.messages);
  const { canSendMessage, canSendLinks } = useSelector(state => state.channel.channelPermissions);
  const { cooldownTime, filterWords, mentions } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);
  const { myUserInfo } = useSelector(state => state.member);
  const [value, setValue] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [messagesQueue, setMessagesQueue] = useState([]); // Lưu payload những tin nhắn khi mất mạng
  const [editMessagesQueue, setEditMessagesQueue] = useState([]); // Lưu messageId và text những tin nhắn chỉnh sửa khi mất mạng
  const [stickerUrl, setStickerUrl] = useState('');

  const myRole = myRoleInChannel(currentChannel);
  const isDirect = isChannelDirect(currentChannel);

  const {
    filteredMentions,
    anchorElMention,
    setAnchorElMention,
    highlightedIndex,
    setHighlightedIndex,
    selectedMentions,
    setSelectedMentions,
  } = useMentions(value, inputRef);

  const onTyping = async () => {
    try {
      await currentChannel.keystroke();
    } catch (error) {
      // handleError(dispatch, error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current.focus();

      if (editMessage) {
        setValue(editMessage.messageText);
      } else if (currentChannel || quotesMessage) {
        setValue('');
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [inputRef, currentChannel, quotesMessage, editMessage]);

  useEffect(() => {
    if (currentChannel) {
      const handleMemberBanned = event => {
        dispatch(RemoveMention(event.member.user_id));
      };

      const handleMemberUnBanned = event => {
        dispatch(AddMention(event.member.user_id));
      };

      currentChannel.on(ClientEvents.MemberBanned, handleMemberBanned);
      currentChannel.on(ClientEvents.MemberUnBanned, handleMemberUnBanned);

      return () => {
        currentChannel.off(ClientEvents.MemberBanned, handleMemberBanned);
        currentChannel.off(ClientEvents.MemberUnBanned, handleMemberUnBanned);
      };
    }
  }, [currentChannel, user_id, quotesMessage]);

  useEffect(() => {
    // Gửi lại tin nhắn khi mất mạng
    const handleConnectionChanged = event => {
      setIsOnline(event.online);

      const onResendMsg = async () => {
        if (messagesQueue.length) {
          let index = 0;
          async function sendNext() {
            if (index < messagesQueue.length) {
              await currentChannel?.sendMessage(messagesQueue[index]);
              index++;
              setTimeout(sendNext, 100);
            } else {
              setMessagesQueue([]);
            }
          }

          sendNext();
        }

        if (editMessagesQueue.length) {
          let index = 0;
          async function editSendNext() {
            if (index < editMessagesQueue.length) {
              const id = editMessagesQueue[index].id;
              const text = editMessagesQueue[index].text;
              await currentChannel?.editMessage(id, text);
              index++;
              setTimeout(editSendNext, 100);
            } else {
              setEditMessagesQueue([]);
            }
          }

          editSendNext();
        }
      };

      if (event.online) {
        onResendMsg();
      }
    };

    client.on(ClientEvents.ConnectionChanged, handleConnectionChanged);

    return () => {
      client.off(ClientEvents.ConnectionChanged, handleConnectionChanged);
    };
  }, [client, currentChannel, messagesQueue, editMessagesQueue]);

  useEffect(() => {
    if (stickerUrl) {
      sendMessage();
    }
  }, [stickerUrl]);

  const onChangeUploadFile = (event, type) => {
    const files = Array.from(event.target.files);
    const isPhotoOrVideo = files.every(
      file => ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type) || file.type.startsWith('image/'),
    );
    dispatch(onFilesMessage({ openDialog: true, files, uploadType: isPhotoOrVideo ? type : UploadType.File }));
  };

  const onResetUploadFilesDialog = () => {
    dispatch(onFilesMessage({ openDialog: false, files: [], uploadType: '' }));
    dispatch(onSetAttachmentsMessage([]));
  };

  const getAttachments = () => {
    if (attachmentsMessage.length === 0) return [];

    const attachments = attachmentsMessage
      .filter(item => !item.error)
      .map(file => {
        const type = file.type.split('/')[0];
        switch (type) {
          case 'image':
            return {
              type: 'image',
              image_url: file.url,
              title: file.name,
              file_size: file.size,
              mime_type: file.type,
            };
          case 'video':
            return {
              type: 'video',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
              thumb_url: file.thumb_url,
            };
          case 'audio':
            return {
              type: 'file',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
            };
          case 'application':
            return {
              type: 'file',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
            };
          case 'voiceRecording':
            return {
              type: 'voiceRecording',
              asset_url: file.url,
              file_size: file.size,
              mime_type: file.type,
              title: file.name,
              waveform_data: file.waveform_data || [],
              duration: file.duration || 0,
            };
          default:
            return {
              type: 'file',
              asset_url: file.url,
              mime_type: '',
              file_size: file.size ? file.size : 0,
              title: file.name,
            };
        }
      });
    return attachments || [];
  };

  const onResetData = () => {
    setValue('');
    setSelectedMentions([]);
    setStickerUrl('');
    onResetUploadFilesDialog();
    if (quotesMessage) {
      dispatch(onReplyMessage(null));
    }

    if (editMessage) {
      dispatch(onEditMessage(null));
    }

    if (recordingBoxRef.current) {
      recordingBoxRef.current.cancelRecording();
    }
  };

  const sendMessage = async () => {
    try {
      if (!canSendMessage) {
        dispatch(
          showSnackbar({ severity: 'error', message: 'You do not have permission to send message in this channel' }),
        );
        return;
      }

      if (cooldownTime) {
        return;
      }

      if (editMessage) {
        const { messageId, messageText } = editMessage;
        const isNewText = value.trim() !== messageText;

        if (isNewText) {
          if (!isOnline) {
            setEditMessagesQueue(prevMessages => [...prevMessages, { id: messageId, text: value.trim() }]);
          }

          setMessages(prev => {
            return prev.map(item => {
              if (item.id === messageId) {
                const editMsgData = { ...item, text: value.trim() };

                if (!isOnline) {
                  editMsgData.status = 'error';
                }

                return editMsgData;
              } else {
                return item;
              }
            });
          });
          onResetData();
          await currentChannel?.editMessage(messageId, value.trim());
        } else {
          dispatch(onEditMessage(null));
        }
      } else {
        const attachments = getAttachments();
        const messageId = uuidv4();
        const payload = {
          text: value.trim(),
          attachments: attachments,
          id: messageId,
        };

        if (quotesMessage) {
          payload.quoted_message_id = quotesMessage.id;
        }

        if (selectedMentions.length > 0) {
          const mentionIds = selectedMentions.map(item => item.id);
          if (mentionIds.includes('all')) {
            payload.mentioned_all = true;
            payload.mentioned_users = [];
            payload.text = replaceMentionsWithIds(value.trim());
          } else {
            payload.mentioned_all = false;
            payload.mentioned_users = mentionIds;
            payload.text = replaceMentionsWithIds(value.trim());
          }
        }

        if (stickerUrl) {
          payload.sticker_url = stickerUrl;
        }

        const created_at = new Date();
        const msgData = {
          ...payload,
          type: stickerUrl ? 'sticker' : 'regular',
          user: { id: user_id, name: myUserInfo?.name || user_id, avatar: myUserInfo?.avatar || '' },
          created_at,
        };
        if (!isOnline) {
          msgData.status = 'error';
          setMessagesQueue(prevMessages => [...prevMessages, payload]);
        }
        setMessages(prevMessages => [...prevMessages, msgData]);
        onResetData();

        await currentChannel?.sendMessage(payload);
      }
    } catch (error) {
      if (error.response.status === 400) {
        handleError(dispatch, error);
      } else {
        const data = JSON.parse(error.config.data);
        const created_at = new Date();
        const message = { ...data.message, status: 'error', user: { id: user_id }, created_at, updated_at: null };
        setMessages(prevMessages => [...prevMessages, message]);

        onResetData();
      }
    }
  };

  const checkSendLinks = value => {
    const emailMentionRegex = /@\S+@\S+\.\S+/g; // Regex kiểm tra mention email
    const hasEmailMention = emailMentionRegex.test(value);
    const hasLinks = linkify.find(value).length > 0;

    if (!canSendLinks && myRole === RoleMember.MEMBER && hasLinks) {
      if (hasEmailMention) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };

  const checkHaveFilterWords = value => {
    const hasKeyword = filterWords.some(keyword => value.trim().toLowerCase().includes(keyword));
    if (hasKeyword) {
      return true;
    }
    return false;
  };

  const checkDisabledButton = () => {
    if (
      (value.trim() === '' && attachmentsMessage.length === 0) ||
      (attachmentsMessage.length > 0 && attachmentsMessage.some(item => item.loading || item.error)) ||
      checkSendLinks(value) ||
      checkHaveFilterWords(value)
    ) {
      return true;
    }
    return false;
  };

  const replaceMentionsWithIds = inputValue => {
    mentions.forEach(user => {
      inputValue = inputValue.replaceAll(user.mentionName, user.mentionId);
    });
    return inputValue;
  };

  const onKeyDown = e => {
    if (anchorElMention && filteredMentions.length) {
      if (e.key === 'ArrowDown') {
        // setHighlightedIndex(prevIndex => (prevIndex < filteredMentions.length - 1 ? prevIndex + 1 : prevIndex));
        // e.preventDefault();

        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === 'ArrowUp') {
        // setHighlightedIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
        // e.preventDefault();

        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectMention(filteredMentions[highlightedIndex]);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!checkDisabledButton()) {
          sendMessage();
        }
      } else {
        onTyping();
      }
    }
  };

  const onKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey && !checkDisabledButton()) {
      e.preventDefault();
      // sendMessage();
    } else {
      // onTyping();
    }
  };

  const onKeyUp = e => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const cursorPosition = inputRef.current.selectionStart;
      let newValue = value;

      mentions.forEach(user => {
        const mentionIndex = newValue.indexOf(user.mentionName);
        if (
          mentionIndex !== -1 &&
          cursorPosition > mentionIndex &&
          cursorPosition <= mentionIndex + user.mentionName.length
        ) {
          newValue = newValue.slice(0, mentionIndex) + newValue.slice(mentionIndex + user.mentionName.length);
          setValue(newValue);

          // Di chuyển con trỏ về vị trí mới sau khi xoá mention
          inputRef.current.setSelectionRange(mentionIndex, mentionIndex);
        }
      });
      setSelectedMentions(prev => prev.filter(item => newValue.includes(item.mentionName)));
    }
  };

  const onSelectMention = mention => {
    const mentionText = `@${mention.name.toLowerCase()}`;
    setValue(prevValue => prevValue.replace(/@\w*$/, mentionText + ' '));
    setSelectedMentions(prev => {
      const updatedMentions = [...prev, mention];
      const uniqueMentions = Array.from(new Map(updatedMentions.map(item => [item.id, item])).values());
      return uniqueMentions;
    });
    setHighlightedIndex(0);
    setAnchorElMention(null);
    inputRef.current.focus();
  };

  const onPaste = event => {
    const file = event.clipboardData.files[0];
    if (file) {
      dispatch(onFilesMessage({ openDialog: true, files: [file], uploadType: UploadType.PhotoOrVideo }));
    }
  };

  return (
    <>
      <Box sx={{ borderRadius: '30px', backgroundColor: theme.palette.background.neutral, position: 'relative' }}>
        {quotesMessage && <ReplyMessageBox quotesMessage={quotesMessage} />}
        {editMessage && <EditMessageBox editMessage={editMessage} />}

        <RecordingAudioBox ref={recordingBoxRef} />

        {/* ------------Chat Input------------ */}
        <TextField
          className="customScrollbarChatInput"
          inputRef={inputRef}
          value={value}
          onChange={event => {
            event.stopPropagation();
            event.preventDefault();
            const value = event.target.value;
            setValue(value);

            if (checkSendLinks(value)) {
              dispatch(
                showSnackbar({ severity: 'error', message: 'Members in this channel are not allowed to send links' }),
              );
            }

            if (checkHaveFilterWords(value)) {
              dispatch(
                showSnackbar({ severity: 'error', message: 'The content you entered contains blocked keywords' }),
              );
            }
          }}
          onPaste={onPaste}
          fullWidth
          placeholder="Write a message..."
          variant="outlined"
          multiline
          maxRows={10}
          InputProps={{
            startAdornment: (
              <>
                {!isDialog && (
                  <InputAdornment position="start" sx={{ position: 'absolute', bottom: '23px', left: '10px' }}>
                    <ActionsChatPopover />
                  </InputAdornment>
                )}
              </>
            ),
            endAdornment: (
              <InputAdornment position="end" sx={{ position: 'absolute', bottom: '23px', right: '15px' }}>
                {checkDisabledButton() && (
                  <>
                    <IconButton onClick={() => recordingBoxRef.current?.startRecording()}>
                      <MicrophoneIcon color={theme.palette.text.primary} />
                    </IconButton>

                    <IconButton component="label">
                      <PictureImageIcon color={theme.palette.text.primary} />
                      <VisuallyHiddenInput
                        type="file"
                        multiple
                        accept="image/*,video/mp4,video/webm,video/quicktime"
                        onChange={event => onChangeUploadFile(event, UploadType.PhotoOrVideo)}
                      />
                    </IconButton>
                  </>
                )}

                {!isDialog && (
                  <EmojiPickerPopover
                    inputRef={inputRef}
                    value={value}
                    setValue={setValue}
                    setStickerUrl={setStickerUrl}
                  />
                )}

                {!checkDisabledButton() && (
                  <>
                    {cooldownTime ? (
                      <CooldownMessage cooldownTime={cooldownTime} />
                    ) : (
                      <IconButton onClick={sendMessage}>
                        <SendIcon color="#7949ec" />
                      </IconButton>
                    )}
                  </>
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0px',
              padding: '12px 10px 12px 0px',
              '& .MuiOutlinedInput-notchedOutline': {
                display: 'none',
              },
              '& .MuiInputBase-input': {
                padding: !isDialog ? '0px 120px 0px 60px' : '0px 54px 0px 15px',
              },
            },
          }}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          // onKeyPress={onKeyPress}
        />
      </Box>

      {/* --------------------mentions-------------------- */}
      {!isDirect && (
        <Mentions
          filteredMentions={filteredMentions}
          anchorEl={anchorElMention}
          onSelectMention={onSelectMention}
          highlightedIndex={highlightedIndex}
        />
      )}
    </>
  );
};

export default ChatFooter;
