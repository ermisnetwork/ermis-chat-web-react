import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  handleError,
  isChannelDirect,
  myRoleInChannel,
  replaceMentionsWithIds,
  replaceMentionsWithNames,
} from '../../utils/commons';
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
import useDebounce from '../../hooks/useDebounce';
import uuidv4 from '../../utils/uuidv4';
import { client } from '../../client';
import ActionsChatPopover from '../ActionsChatPopover';
import { MicrophoneIcon, PictureImageIcon, SendIcon } from '../Icons';
import EmojiPickerPopover from '../EmojiPickerPopover';
import RecordingAudioBox from '../../sections/dashboard/RecordingAudioBox';
import { useTranslation } from 'react-i18next';

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

const ChatFooter = ({ setMessages, isDialog }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const inputRef = useRef(null);
  const recordingBoxRef = useRef(null);
  const { quotesMessage, editMessage, attachmentsMessage } = useSelector(state => state.messages);
  const { canSendMessage, canSendLinks } = useSelector(state => state.channel.channelPermissions);
  const { cooldownTime, filterWords, mentions, currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const { user_id } = useSelector(state => state.auth);
  const { myUserInfo } = useSelector(state => state.member);
  const [value, setValue] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [messagesQueue, setMessagesQueue] = useState([]); // Lưu payload những tin nhắn khi mất mạng
  const [editMessagesQueue, setEditMessagesQueue] = useState([]); // Lưu messageId và text những tin nhắn chỉnh sửa khi mất mạng
  const [stickerUrl, setStickerUrl] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const myRole = myRoleInChannel(currentChannel);
  const isDirect = isChannelDirect(currentChannel);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const {
    filteredMentions,
    anchorElMention,
    setAnchorElMention,
    highlightedIndex,
    setHighlightedIndex,
    selectedMentions,
    setSelectedMentions,
  } = useMentions(value, inputRef);

  const onTyping = useCallback(async () => {
    try {
      await currentChat.keystroke();
    } catch (error) {
      // handleError(dispatch, error);
    }
  }, [currentChat]);

  // Debounced version of onTyping để giảm số lần gọi API
  const debouncedOnTyping = useDebounce(onTyping, 500);

  const checkSendLinks = useCallback(
    value => {
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
    },
    [canSendLinks, myRole],
  );

  const checkHaveFilterWords = useCallback(
    value => {
      const hasKeyword = filterWords.some(keyword => value.trim().toLowerCase().includes(keyword));
      if (hasKeyword) {
        return true;
      }
      return false;
    },
    [filterWords],
  );

  // Memoize các giá trị validation để tránh tính toán lại không cần thiết
  const hasLinksError = useMemo(() => checkSendLinks(value), [value, checkSendLinks]);
  const hasFilterWordsError = useMemo(() => checkHaveFilterWords(value), [value, checkHaveFilterWords]);

  const checkDisabledButton = useMemo(() => {
    if (
      (value.trim() === '' && attachmentsMessage.length === 0) ||
      (attachmentsMessage.length > 0 && attachmentsMessage.some(item => item.loading || item.error)) ||
      hasLinksError ||
      hasFilterWordsError
    ) {
      return true;
    }
    return false;
  }, [value, attachmentsMessage, hasLinksError, hasFilterWordsError]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current.focus();

      if (editMessage) {
        // Tìm các mentionId xuất hiện trong editMessage.text
        const foundMentions = mentions.filter(user => editMessage.text.includes(user.mentionId));
        setSelectedMentions(foundMentions);

        // Đổi value từ mentionId sang mentionName để hiển thị đúng
        setValue(replaceMentionsWithNames(editMessage.text, mentions));
      } else if (currentChat || quotesMessage) {
        setValue('');
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [inputRef, currentChat, quotesMessage, editMessage, mentions]);

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
              await currentChat?.sendMessage(messagesQueue[index]);
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
              const message = editMessagesQueue[index].message;
              await currentChat?.editMessage(id, message);
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
  }, [client, currentChat, messagesQueue, editMessagesQueue]);

  useEffect(() => {
    if (stickerUrl) {
      sendMessage();
    }
  }, [stickerUrl]);

  // Effect để hiển thị lỗi validation với debounce
  useEffect(() => {
    const showValidationErrors = () => {
      if (hasLinksError) {
        dispatch(showSnackbar({ severity: 'error', message: t('chatFooter.check_sendLinks') }));
      }

      if (hasFilterWordsError) {
        dispatch(showSnackbar({ severity: 'error', message: t('chatFooter.check_filterWords') }));
      }
    };

    const timeout = setTimeout(showValidationErrors, 500); // Debounce 500ms cho validation errors
    return () => clearTimeout(timeout);
  }, [hasLinksError, hasFilterWordsError, dispatch]);

  useEffect(() => {
    if (!anchorElMention) return;

    const handleClickOutside = event => {
      // Nếu click không nằm trong box mention hoặc input
      if (
        anchorElMention &&
        !anchorElMention.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setAnchorElMention(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [anchorElMention, setAnchorElMention]);

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

  const getMentionsPayload = () => {
    const mentionIds = selectedMentions.map(item => item.id);
    const hasAll = mentionIds.includes('all');

    if (hasAll) {
      // Lọc ra các mention khác ngoài 'all'
      const filteredMentionIds = mentionIds.filter(id => id !== 'all');
      if (filteredMentionIds.length === 0) {
        // Chỉ có 'all'
        return { mentioned_all: true, mentioned_users: [] };
      } else {
        // Có cả 'all' và các mention khác
        return { mentioned_all: true, mentioned_users: filteredMentionIds };
      }
    } else {
      // Không có 'all'
      return { mentioned_all: false, mentioned_users: mentionIds };
    }
  };

  const sendMessage = async () => {
    try {
      if (!canSendMessage) {
        dispatch(showSnackbar({ severity: 'error', message: t('chatFooter.send_message') }));
        return;
      }

      if (cooldownTime) {
        return;
      }

      if (editMessage) {
        const isNewText = value.trim() !== editMessage.text.trim();

        if (isNewText) {
          const payloadEdit = {
            text: replaceMentionsWithIds(value.trim(), selectedMentions),
          };

          if (selectedMentions.length > 0) {
            const mentionsPayload = getMentionsPayload();
            payloadEdit.mentioned_all = mentionsPayload.mentioned_all;
            payloadEdit.mentioned_users = mentionsPayload.mentioned_users;
          }

          if (!isOnline) {
            setEditMessagesQueue(prevMessages => [...prevMessages, { id: editMessage.id, message: payloadEdit }]);
          }

          setMessages(prev => {
            return prev.map(item => {
              if (item.id === editMessage.id) {
                const editMsgData = { ...item, ...payloadEdit, updated_at: new Date(), status: 'sending' };

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
          await currentChat?.editMessage(editMessage.id, payloadEdit);
        } else {
          dispatch(onEditMessage(null));
        }
      } else {
        const attachments = getAttachments();
        const messageId = uuidv4();
        const payload = {
          text: replaceMentionsWithIds(value.trim(), selectedMentions),
          attachments: attachments,
          id: messageId,
        };

        if (quotesMessage) {
          payload.quoted_message_id = quotesMessage.id;
        }

        if (selectedMentions.length > 0) {
          const mentionsPayload = getMentionsPayload();
          payload.mentioned_all = mentionsPayload.mentioned_all;
          payload.mentioned_users = mentionsPayload.mentioned_users;
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
          status: 'sending',
        };
        if (!isOnline) {
          msgData.status = 'error';
          setMessagesQueue(prevMessages => [...prevMessages, payload]);
        }
        setMessages(prevMessages => [...prevMessages, msgData]);
        onResetData();

        await currentChat?.sendMessage(payload);
      }
    } catch (error) {
      if (error.response.status === 400) {
        handleError(dispatch, error, t);
      } else {
        const data = JSON.parse(error.config.data);
        const created_at = new Date();
        const message = { ...data.message, status: 'error', user: { id: user_id }, created_at, updated_at: null };
        setMessages(prevMessages => [...prevMessages, message]);

        onResetData();
      }
    }
  };

  const onKeyDown = e => {
    if (isComposing) return;

    if (e.key === 'Escape' && anchorElMention) {
      setAnchorElMention(null);
      return;
    }

    if (anchorElMention && filteredMentions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredMentions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelectMention(filteredMentions[highlightedIndex]);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!checkDisabledButton) {
          sendMessage();
        }
      } else {
        // onTyping();
      }
    }
  };

  const onKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey && !checkDisabledButton) {
      e.preventDefault();
      // sendMessage();
    } else {
      // onTyping();
    }
  };

  const onKeyUp = useCallback(
    e => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const input = inputRef.current;
        const cursorPosition = input.selectionStart;
        let newValue = value;
        let newCursorPos = cursorPosition;
        let mentionRemoved = false;

        // Tối ưu: chỉ xử lý mentions nếu có ký tự @ trong value
        if (value.includes('@')) {
          mentions.forEach(user => {
            const mentionIndex = newValue.indexOf(user.mentionName);
            if (
              mentionIndex !== -1 &&
              cursorPosition > mentionIndex &&
              cursorPosition <= mentionIndex + user.mentionName.length
            ) {
              newValue = newValue.slice(0, mentionIndex) + newValue.slice(mentionIndex + user.mentionName.length);
              newCursorPos = mentionIndex; // Đặt lại vị trí con trỏ tại vị trí vừa xoá mention
              mentionRemoved = true;
            }
          });

          if (mentionRemoved) {
            setValue(newValue);
            setTimeout(() => {
              input.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
          }

          setSelectedMentions(prev => prev.filter(item => newValue.includes(item.mentionName)));
        }
      }
    },
    [value, mentions, setSelectedMentions],
  );

  const onSelectMention = useCallback(
    mention => {
      const input = inputRef.current;
      const cursorPos = input.selectionStart;
      const value = input.value;
      const mentionText = `@${mention.name.toLowerCase()}`;

      // Tìm vị trí @ gần nhất trước con trỏ
      const beforeCursor = value.slice(0, cursorPos);
      const match = beforeCursor.match(/@\w*$/);

      if (match) {
        const start = match.index;
        const end = cursorPos;
        const newValue = value.slice(0, start) + mentionText + ' ' + value.slice(end);

        setValue(newValue);

        // Đặt lại vị trí con trỏ sau mention vừa thêm
        setTimeout(() => {
          input.setSelectionRange(start + mentionText.length + 1, start + mentionText.length + 1);
        }, 0);
      }

      setSelectedMentions(prev => {
        const updatedMentions = [...prev, mention];
        const uniqueMentions = Array.from(new Map(updatedMentions.map(item => [item.id, item])).values());
        return uniqueMentions;
      });
      setHighlightedIndex(0);
      setAnchorElMention(null);
      inputRef.current.focus();
    },
    [setSelectedMentions, setHighlightedIndex, setAnchorElMention],
  );

  const onPaste = event => {
    const file = event.clipboardData.files[0];
    if (file) {
      dispatch(onFilesMessage({ openDialog: true, files: [file], uploadType: UploadType.PhotoOrVideo }));
    }
  };

  return (
    <>
      <Box sx={{ borderRadius: '30px', backgroundColor: theme.palette.background.secondary, position: 'relative' }}>
        {quotesMessage && <ReplyMessageBox quotesMessage={quotesMessage} />}
        {editMessage && <EditMessageBox editMessage={editMessage} />}

        <RecordingAudioBox ref={recordingBoxRef} />

        {/* ------------Chat Input------------ */}
        <TextField
          className="customScrollbarChatInput"
          inputRef={inputRef}
          value={value}
          onChange={useCallback(
            event => {
              event.stopPropagation();
              event.preventDefault();
              const newValue = event.target.value;
              setValue(newValue);

              // Sử dụng debounced typing để giảm tải
              debouncedOnTyping();
            },
            [debouncedOnTyping],
          )}
          onPaste={onPaste}
          fullWidth
          placeholder={t('chatFooter.placeholder')}
          variant="outlined"
          multiline
          maxRows={10}
          InputProps={{
            startAdornment: (
              <>
                {!isDialog && (
                  <InputAdornment position="start" sx={{ position: 'absolute', bottom: '23px', left: '5px' }}>
                    <ActionsChatPopover />
                  </InputAdornment>
                )}
              </>
            ),
            endAdornment: (
              <InputAdornment position="end" sx={{ position: 'absolute', bottom: '23px', right: '5px' }}>
                {checkDisabledButton && !isDialog && (
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

                {!checkDisabledButton && (
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
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
        />

        {/* --------------------mentions-------------------- */}
        {!isDirect && (
          <Mentions
            filteredMentions={filteredMentions}
            anchorEl={anchorElMention}
            onSelectMention={onSelectMention}
            highlightedIndex={highlightedIndex}
          />
        )}
      </Box>
    </>
  );
};

export default ChatFooter;
