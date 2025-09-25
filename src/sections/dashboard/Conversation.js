import React, { useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Button,
  LinearProgress,
  styled,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Copy,
  Trash,
  PencilSimple,
  VideoCamera,
  Phone,
  ArrowBendUpRight,
  Download,
  PushPin,
  PushPinSimpleSlash,
} from 'phosphor-react';
import {
  checkPermissionDeleteMessage,
  displayMessageWithMentionName,
  downloadFile,
  formatString,
  getMemberInfo,
} from '../../utils/commons';
import { CallType, MessageType } from '../../constants/commons-const';
import { useDispatch, useSelector } from 'react-redux';
import {
  onDeleteMessage,
  onEditMessage,
  onForwardMessage,
  onReplyMessage,
  onUnPinMessage,
} from '../../redux/slices/messages';
import Attachments from '../../components/Attachments';
import { showSnackbar } from '../../redux/slices/app';
import { SetCooldownTime } from '../../redux/slices/channel';
import { fTime } from '../../utils/formatTime';
import { convertMessageSignal } from '../../utils/messageSignal';
import LinkPreview from '../../components/LinkPreview';
import FileTypeBadge from '../../components/FileTypeBadge';
import CustomAudioPlayer from '../../components/CustomAudioPlayer';
import ImageCanvas from '../../components/ImageCanvas';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { setPollResult } from '../../redux/slices/dialog';
import { ForwardIcon, QuoteDownIcon, ThreeDotsIcon } from '../../components/Icons';
import CustomCheckbox from '../../components/CustomCheckbox';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.neutral,
  width: '22px',
  height: '22px',
  padding: '0px',
  color: theme.palette.text.primary,
}));

const StyledTextLine = styled(Typography)(({ theme }) => ({
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  fontWeight: 500,
  '& .mentionHighlight': {
    padding: '2px 10px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    color: '#212B36',
    marginBottom: '5px',
    '& .linkUrl': {
      display: 'inline',
      color: 'inherit !important',
    },
  },
}));

const MoreOptions = ({ message, setIsOpen, orderMore, isMyMessage }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { currentChannel, pinnedMessages } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const { canEditMessage, canDeleteMessage, canPinMessage } = useSelector(state => state.channel.channelPermissions);

  const [anchorEl, setAnchorEl] = useState(null);
  const currentChat = currentTopic ? currentTopic : currentChannel;

  const membership = currentChannel.state?.membership;
  const channelType = currentChannel.type;
  const messageId = message.id;
  const messageText = message.text;
  const isDelete = checkPermissionDeleteMessage(message, channelType, membership?.user_id, membership?.channel_role);
  const isEdit = isMyMessage && message.text && [MessageType.Regular].includes(message.type);
  const isDownload = message.attachments;
  const isUnPin = pinnedMessages.some(msg => msg.id === messageId);

  const onCoppyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      dispatch(showSnackbar({ severity: 'success', message: 'Message copied to clipboard!' }));
      setAnchorEl(null);
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: 'Failed to copy!' }));
      setAnchorEl(null);
    }
  };

  const onDelete = () => {
    if (!canDeleteMessage) {
      dispatch(
        showSnackbar({ severity: 'error', message: 'You do not have permission to delete message in this channel' }),
      );
      return;
    }

    dispatch(
      onDeleteMessage({
        openDialog: true,
        messageId,
      }),
    );
    setAnchorEl(null);
  };

  const onEdit = () => {
    if (!canEditMessage) {
      dispatch(
        showSnackbar({ severity: 'error', message: 'You do not have permission to edit message in this channel' }),
      );
      return;
    }

    dispatch(onEditMessage(message));
    dispatch(onReplyMessage(null));
    dispatch(SetCooldownTime(null));
    setAnchorEl(null);
    setIsOpen(false);
  };

  const onDownloadAllFiles = async () => {
    for (const file of message.attachments) {
      const url = file.asset_url || file.image_url;
      const filename = file.title || 'downloaded_file';
      if (url) {
        await downloadFile(url, filename); // Tải từng file một
      }
    }

    setAnchorEl(null);
  };

  const onTogglePin = async () => {
    try {
      setAnchorEl(null);
      if (!canPinMessage) {
        dispatch(
          showSnackbar({ severity: 'error', message: 'You do not have permission to pin message in this channel' }),
        );
        return;
      }

      if (isUnPin) {
        dispatch(
          onUnPinMessage({
            openDialog: true,
            messageId,
          }),
        );
      } else {
        const response = await currentChat.pinMessage(messageId);

        if (response) {
          dispatch(showSnackbar({ severity: 'success', message: 'Message pinned' }));
        }
      }
    } catch (error) {
      dispatch(
        showSnackbar({
          severity: 'error',
          message: 'Unable to pin the message. Please try again',
        }),
      );
    }
  };

  return (
    <>
      <Tooltip title="More">
        <StyledIconButton
          sx={{ order: orderMore }}
          onClick={event => {
            setAnchorEl(event.currentTarget);
            setIsOpen(true);
          }}
        >
          <ThreeDotsIcon size={14} />
        </StyledIconButton>
      </Tooltip>
      <Popover
        id={Boolean(anchorEl) ? 'more-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setIsOpen(false);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <List>
          {/* ----------------------pin------------------------ */}
          <ListItem disablePadding onClick={onTogglePin}>
            <ListItemButton>
              <ListItemIcon>{isUnPin ? <PushPinSimpleSlash size={18} /> : <PushPin size={18} />}</ListItemIcon>
              <ListItemText
                primary={isUnPin ? 'UnPin' : 'Pin'}
                primaryTypographyProps={{
                  fontSize: '14px',
                }}
              />
            </ListItemButton>
          </ListItem>

          {/* ----------------------download------------------------ */}
          {isDownload && (
            <ListItem disablePadding onClick={onDownloadAllFiles}>
              <ListItemButton>
                <ListItemIcon>
                  <Download size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Download"
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------edit------------------------ */}
          {isEdit && (
            <ListItem disablePadding onClick={onEdit}>
              <ListItemButton>
                <ListItemIcon>
                  <PencilSimple size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Edit"
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------coppy text------------------------ */}
          {messageText && (
            <ListItem disablePadding>
              <ListItemButton onClick={onCoppyText}>
                <ListItemIcon>
                  <Copy size={18} />
                </ListItemIcon>
                <ListItemText
                  primary="Copy"
                  primaryTypographyProps={{
                    fontSize: '14px',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* ----------------------delete------------------------ */}
          {isDelete && (
            <ListItem disablePadding>
              <ListItemButton onClick={onDelete}>
                <ListItemIcon>
                  <Trash size={18} color={theme.palette.error.main} />
                </ListItemIcon>
                <ListItemText
                  primary="Delete"
                  primaryTypographyProps={{
                    fontSize: '14px',
                    color: theme.palette.error.main,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

const MessageOption = ({ isMyMessage, message }) => {
  const dispatch = useDispatch();
  const { isGuest } = useSelector(state => state.channel);

  const [isOpen, setIsOpen] = useState(false);
  const isForward = [MessageType.Regular, MessageType.Sticker].includes(message.type);
  const orderReply = isMyMessage ? 3 : 1;
  const orderForward = 2;
  const orderMore = isMyMessage ? 1 : 3;

  const onReply = () => {
    dispatch(onReplyMessage(message));
    dispatch(onEditMessage(null));
  };

  const onForward = () => {
    dispatch(
      onForwardMessage({
        openDialog: true,
        message,
      }),
    );
  };

  if (isGuest) return null;

  return (
    <Box className={`messageActions ${isOpen ? 'open' : ''}`} sx={{ visibility: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{
          position: 'absolute',
          top: '50%',
          left: isMyMessage ? 'auto' : '100%',
          right: isMyMessage ? '100%' : 'auto',
          transform: 'translateY(-50%)',
          padding: '8px',
        }}
      >
        <Tooltip title="Reply">
          <StyledIconButton sx={{ order: orderReply }} onClick={onReply}>
            <QuoteDownIcon size={14} />
          </StyledIconButton>
        </Tooltip>
        {isForward && (
          <Tooltip title="Forward">
            <StyledIconButton sx={{ order: orderForward }} onClick={onForward}>
              <ForwardIcon size={14} />
            </StyledIconButton>
          </Tooltip>
        )}

        <MoreOptions message={message} setIsOpen={setIsOpen} orderMore={orderMore} isMyMessage={isMyMessage} />
      </Stack>
    </Box>
  );
};

const ForwardTo = ({ message, forwardChannelName }) => {
  const theme = useTheme();
  if (!message.forward_cid) return null;
  const isSticker = message.type === MessageType.Sticker;
  const color = message.isMyMessage ? theme.palette.grey[200] : theme.palette.grey[500];

  return (
    <Typography
      variant="subtitle2"
      sx={{
        fontSize: '12px',
        color: isSticker ? '#bdbdbd' : color,
        fontWeight: 400,
      }}
    >
      <ArrowBendUpRight size={14} weight="fill" color={color} />
      &nbsp;Forwarded from <strong>{forwardChannelName ? forwardChannelName : 'unknown channel'}</strong>
    </Typography>
  );
};

const DateLine = ({ date, isEdited, isMyMessage }) => {
  const theme = useTheme();

  return (
    <Typography
      variant="body2"
      color={isMyMessage ? theme.palette.grey[400] : theme.palette.text.secondary}
      sx={{ textAlign: 'right', fontSize: '12px', marginLeft: '20px', marginTop: '5px', fontStyle: 'italic' }}
    >
      {isEdited && (
        <span className="underline" style={{ cursor: 'pointer', marginRight: '6px' }}>
          Edited
        </span>
      )}
      <span>{fTime(date)}</span>
    </Typography>
  );
};

const TextLine = ({ message }) => {
  const theme = useTheme();
  const { mentions } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const isCode = str => {
    // Loại bỏ khoảng trắng đầu/cuối chuỗi
    str = str.trim();

    if (str.startsWith('```') && str.endsWith('```')) {
      // // Kiểm tra code JavaScript hoặc các ngôn ngữ có dấu `{}`, `()`, `;`, `=`...
      // const jsRegex = /[\{\}\(\);\=\+\-\*\/]|function|const|let|var|return|import|export/.test(str);

      // // Kiểm tra code HTML
      // const htmlRegex = /<\/?[a-z][\s\S]*>/i.test(str);

      // // Kiểm tra code Python (có từ khóa phổ biến như `def`, `import`, `class`)
      // const pythonRegex = /\b(def|import|class|lambda|print|return)\b/.test(str);

      // // Kiểm tra nếu có dấu xuống dòng và khoảng trắng đầu dòng (thường là code)
      // const multilineCodeRegex = /\n\s{2,}/.test(str);

      // return jsRegex || htmlRegex || pythonRegex || multilineCodeRegex;

      return true;
    } else {
      return false;
    }
  };

  const processMessage = text => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const mentionRegex = /(@\w+)/g;

    // Tách chuỗi thành các phần dựa trên URL, email, mention
    const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|@\w+)/g);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} className="linkUrl" target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      } else if (part.match(emailRegex)) {
        return (
          <a key={index} href={`mailto:${part}`} className="linkUrl">
            {part}
          </a>
        );
      } else if (part.match(mentionRegex) && message.mentioned_users) {
        const mentionObj = mentions.find(m => m.mentionId === part || m.mentionName === part);
        if (mentionObj) {
          const customClass =
            mentionObj.mentionId === '@all' ? 'mentionAll' : mentionObj.id === user_id ? 'mentionMe' : '';
          return (
            <span key={index} className={`mentionHighlight ${customClass}`}>
              @{mentionObj.name}
            </span>
          );
        }
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const renderMsg = () => {
    if (isCode(message.text)) {
      const codeContent = message.text.slice(3, -3).trim();
      return (
        <SyntaxHighlighter language="javascript" style={atomDark} showLineNumbers customStyle={{ width: '100%' }}>
          {codeContent}
        </SyntaxHighlighter>
      );
    } else {
      return (
        <StyledTextLine variant="body2" color={message.isMyMessage ? '#fff' : theme.palette.text}>
          {processMessage(message.text)}
        </StyledTextLine>
      );
    }
  };

  const isEdited = message.updated_at;

  return (
    <>
      {renderMsg()}

      <DateLine
        date={isEdited ? message.updated_at : message.created_at}
        isEdited={isEdited}
        isMyMessage={message.isMyMessage}
      />
    </>
  );
};

const VoiceLine = ({ voiceMsg, isMyMessage }) => {
  if (!voiceMsg) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={1} maxWidth={'100%'} width={'400px'}>
      <CustomAudioPlayer
        src={voiceMsg.asset_url}
        waveColor={isMyMessage ? '#fff' : '#0C0A29'}
        progressColor={isMyMessage ? '#0C0A29' : '#7949ec'}
      />
    </Stack>
  );

  // return <AudioPlayer src={voiceMsg.asset_url} />;
};

const PollBox = ({ message, all_members }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { currentChannel } = useSelector(state => state.channel);
  const { currentTopic } = useSelector(state => state.topic);
  const currentChat = currentTopic ? currentTopic : currentChannel;
  const { user_id } = useSelector(state => state.auth);
  const pollType = message.poll_type; // 'single' hoặc 'multiple'
  const pollOptions = message.poll_choice_counts || {}; // {option: count, ...}
  const [selected, setSelected] = useState(pollType === 'multiple' ? [] : '');

  const hasVoted = Array.isArray(message.latest_poll_choices)
    ? message.latest_poll_choices.some(choice => choice.user_id === user_id)
    : false;

  const totalMembers = currentChannel?.state?.members ? Object.keys(currentChannel.state.members).length : 0;
  const totalVotes = Array.isArray(message.latest_poll_choices) ? message.latest_poll_choices.length : 0;

  const handleChange = option => {
    if (pollType === 'multiple') {
      setSelected(prev => (prev.includes(option) ? prev.filter(v => v !== option) : [...prev, option]));
    } else {
      setSelected(option);
    }
  };

  const handleVote = async () => {
    if (!selected || (selected.length === 0 && pollType === 'multiple')) {
      dispatch(showSnackbar({ severity: 'error', message: 'Please select an option to vote' }));
      return;
    }

    if (pollType === 'multiple' && Array.isArray(selected)) {
      for (const choice of selected) {
        await currentChat.votePoll(message.id, choice);
      }
    } else {
      await currentChat.votePoll(message.id, selected);
    }
  };

  const handleShowPollResult = () => {
    const pollResult = Object.keys(message.poll_choice_counts).map(option => {
      const users = message.latest_poll_choices
        .filter(choice => choice.text === option)
        .map(choice => {
          const memberInfo = getMemberInfo(choice.user_id, all_members);
          return {
            id: choice.user_id,
            name: memberInfo ? memberInfo.name : choice.user_id,
            avatar: memberInfo ? memberInfo.avatar : '',
          };
        });
      return { text: option, users };
    });

    dispatch(
      setPollResult({
        openDialog: true,
        question: message.text,
        results: pollResult,
      }),
    );
  };

  const colorMsg = message.isMyMessage ? '#fff' : theme.palette.text.primary;
  const senderName = message.user.name;

  return (
    <Box sx={{ maxWidth: '100%', width: '20rem', padding: '8px' }}>
      <Typography
        variant="body1"
        color={message.isMyMessage ? '#fff' : theme.palette.primary.main}
        sx={{ fontWeight: 600, marginBottom: 2, fontSize: '12px' }}
      >
        {senderName}
      </Typography>

      <Typography
        variant="subtitle1"
        color={colorMsg}
        sx={{ fontWeight: 600, marginBottom: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: '18px' }}
      >
        {message.text}
      </Typography>
      <Stack spacing={1}>
        {Object.entries(pollOptions).map(([option, count]) => {
          const percent = totalMembers === 0 ? 0 : Math.round((count / totalMembers) * 100);
          return (
            <Stack key={option} direction={'row'} alignItems="center" justifyContent="space-between" spacing={2}>
              {!hasVoted && (
                <>
                  {pollType === 'multiple' ? (
                    <CustomCheckbox
                      name={option}
                      checked={selected.includes(option)}
                      onChange={() => handleChange(option)}
                      sx={{
                        p: 0,
                        color: colorMsg,
                        '&.Mui-checked': {
                          color: colorMsg,
                        },
                      }}
                    />
                  ) : (
                    <Radio
                      name="poll-radio"
                      checked={selected === option}
                      onChange={() => handleChange(option)}
                      sx={{
                        p: 0,
                        color: colorMsg,
                        '&.Mui-checked': {
                          color: colorMsg,
                        },
                      }}
                    />
                  )}
                </>
              )}

              {hasVoted && count > 0 && (
                <Typography
                  variant="caption"
                  color={message.isMyMessage ? '#fff' : theme.palette.primary.main}
                  sx={{ fontSize: '16px', fontWeight: 600, marginTop: '-10px!important' }}
                >
                  {percent}%
                </Typography>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color={colorMsg} sx={{ flex: 1, fontSize: '16px', fontWeight: 400 }}>
                  {option}
                </Typography>

                {hasVoted && (
                  <LinearProgress
                    variant="determinate"
                    value={totalMembers === 0 ? 0 : (count / totalMembers) * 100}
                    sx={{
                      mt: 1,
                      height: 3,
                      borderRadius: 4,
                      background: message.isMyMessage ? theme.palette.primary.main : theme.palette.grey[100],
                      '& .MuiLinearProgress-bar': {
                        background: message.isMyMessage ? '#fff' : theme.palette.primary.main,
                      },
                    }}
                  />
                )}
              </Box>
            </Stack>
          );
        })}
      </Stack>

      {!hasVoted && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleVote}
            variant="contained"
            sx={{
              minWidth: '100px',
              backgroundColor: message.isMyMessage ? '#fff' : theme.palette.primary.main,
              color: message.isMyMessage ? theme.palette.primary.main : '#fff',
            }}
          >
            VOTE
          </Button>
        </Box>
      )}

      {hasVoted && message.isMyMessage && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            sx={{
              minWidth: '100px',
              backgroundColor: message.isMyMessage ? '#fff' : theme.palette.primary.main,
              color: message.isMyMessage ? theme.palette.primary.main : '#fff',
            }}
            onClick={handleShowPollResult}
          >
            RESULT
          </Button>
        </Box>
      )}

      <Typography
        variant="body2"
        color={message.isMyMessage ? theme.palette.grey[400] : theme.palette.text.secondary}
        sx={{ fontSize: '12px', position: 'absolute', bottom: '13px' }}
      >
        {totalVotes} votes
      </Typography>
    </Box>
  );
};

const TextMsg = ({ el, forwardChannelName }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '75%',
        }}
      >
        <ForwardTo message={el} forwardChannelName={forwardChannelName} />

        <TextLine message={el} />
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

const AttachmentMsg = ({ el, menu, forwardChannelName }) => {
  const theme = useTheme();
  const attachments = el.attachments.filter(attachment => !['linkPreview', 'voiceRecording'].includes(attachment.type));
  const voiceMsg = el.attachments.find(attachment => attachment.type === 'voiceRecording');
  const isEdited = el.updated_at;

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} sx={{ width: '100%' }}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: attachments.length === 1 ? '20rem' : '30rem',
        }}
      >
        <Stack spacing={1}>
          <ForwardTo message={el} forwardChannelName={forwardChannelName} />
          <Attachments attachments={attachments} />
          <VoiceLine voiceMsg={voiceMsg} isMyMessage={el.isMyMessage} />
          {el.text ? (
            <>
              <TextLine message={el} />
            </>
          ) : (
            <DateLine
              date={isEdited ? el.updated_at : el.created_at}
              isEdited={isEdited}
              isMyMessage={el.isMyMessage}
            />
          )}
        </Stack>
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};
const ReplyMsg = ({ el, all_members, onScrollToReplyMsg }) => {
  const { mentions } = useSelector(state => state.channel);
  const theme = useTheme();
  const memberInfo = el.quoted_message?.user;
  const quotedMessage = el.quoted_message;
  const name = memberInfo ? formatString(memberInfo.name) : formatString(quotedMessage.user.id);
  const attachmentsOfQuoted = quotedMessage.attachments?.filter(item => item.type !== 'linkPreview');
  const media = attachmentsOfQuoted ? attachmentsOfQuoted[0] : null;
  const attachmentsOfMsg = el.attachments
    ? el.attachments.filter(attachment => !['linkPreview', 'voiceRecording'].includes(attachment.type))
    : null;
  const voiceMsg = el.attachments ? el.attachments.find(attachment => attachment.type === 'voiceRecording') : null;
  const linkPreviewMsg =
    el.attachments && el.attachments[0]?.type === 'linkPreview' && el.attachments[0]?.title ? el.attachments[0] : null;
  const stickerOfQuoted = quotedMessage?.sticker_url ? quotedMessage.sticker_url : null;

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          maxWidth: '75%',
          position: 'relative',
        }}
      >
        <Box
          px={1}
          py={1}
          sx={{
            backgroundColor: theme.palette.background.default,
            borderRadius: 1.5,
            position: 'relative',
            marginBottom: '5px',
            cursor: 'pointer',
          }}
          onClick={() => onScrollToReplyMsg(el.quoted_message.id)}
        >
          <Stack direction="row">
            <Box
              sx={{
                width: '2px',
                backgroundColor: theme.palette.primary.main,
              }}
            />
            {stickerOfQuoted && (
              <Box sx={{ paddingLeft: '10px' }}>
                {stickerOfQuoted.endsWith('.tgs') ? (
                  <tgs-player
                    autoplay
                    loop
                    mode="normal"
                    src={stickerOfQuoted}
                    style={{ width: '50px', height: 'auto' }}
                  ></tgs-player>
                ) : (
                  <ImageCanvas
                    dataUrl={stickerOfQuoted}
                    width={'50px'}
                    height={'auto'}
                    styleCustom={{ borderRadius: '6px' }}
                  />
                )}
              </Box>
            )}
            {media && (
              <Box sx={{ paddingLeft: '10px' }}>
                {media.type === 'image' ? (
                  <ImageCanvas
                    dataUrl={media.image_url}
                    width={'50px'}
                    height={'auto'}
                    styleCustom={{ borderRadius: '6px' }}
                  />
                ) : (
                  <FileTypeBadge fileName={media.title} />
                )}
              </Box>
            )}
            <Box sx={{ flex: 1, paddingLeft: '10px', width: 'calc(100% - 50px)' }}>
              {el.quoted_message.deleted_at ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.grey[600],
                    fontSize: 12,
                    display: 'flex',
                  }}
                >
                  <Trash size={16} color={theme.palette.grey[600]} />
                  &nbsp;&nbsp;Message deleted
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {name}
                  </Typography>
                  {media && (
                    <Typography variant="body1" sx={{ fontSize: 12 }}>
                      {media.title}
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.grey[500],
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: displayMessageWithMentionName(el.quoted_message.text, mentions),
                    }}
                  />
                </>
              )}
            </Box>
          </Stack>
        </Box>
        <Stack spacing={1}>
          {linkPreviewMsg && <LinkPreview linkPreview={linkPreviewMsg} />}
          {attachmentsOfMsg && <Attachments attachments={attachmentsOfMsg} />}
          {voiceMsg && <VoiceLine voiceMsg={voiceMsg} />}
          {el.sticker_url ? (
            <Box sx={{ mt: 0.5 }}>
              <ImageCanvas
                dataUrl={el.sticker_url}
                width={'150px'}
                height={'150px'}
                styleCustom={{ borderRadius: '6px' }}
              />
            </Box>
          ) : (
            <TextLine message={el} />
          )}
          {/* <TextLine message={el} /> */}
        </Stack>
        {/* <TextLine message={el} /> */}
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

const SignalMsg = ({ el }) => {
  const theme = useTheme();

  const msg = convertMessageSignal(el.text);

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          // display: 'flex',
          // alignItems: 'center',
          maxWidth: '75%',
        }}
      >
        <Stack direction="row" alignItems="center">
          {msg?.callType === CallType.VIDEO ? (
            <VideoCamera size={22} weight="fill" color={msg.color ? msg.color : theme.palette.grey[500]} />
          ) : (
            <Phone size={22} weight="fill" color={msg.color ? msg.color : theme.palette.grey[500]} />
          )}
          <Typography
            variant="body2"
            color={el.isMyMessage ? '#fff' : theme.palette.text}
            sx={{ wordBreak: 'break-word', paddingLeft: '10px' }}
          >
            {msg?.text}

            {msg?.duration && <span style={{ display: 'block', color: theme.palette.grey[500] }}>{msg?.duration}</span>}
          </Typography>
        </Stack>
        <DateLine date={el.created_at} isEdited={false} isMyMessage={el.isMyMessage} />
      </Box>
    </Stack>
  );
};

const LinkPreviewMsg = ({ el, forwardChannelName }) => {
  const theme = useTheme();
  const linkPreview = el.attachments[0]; // chỉ hiển thị linkPreview đầu tiên

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} sx={{ width: '100%' }}>
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '400px',
        }}
      >
        <Stack spacing={1}>
          <ForwardTo message={el} forwardChannelName={forwardChannelName} />
          <LinkPreview linkPreview={linkPreview} />

          {el.text && (
            <>
              <TextLine message={el} />
            </>
          )}
        </Stack>
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

const PollMsg = ({ el, all_members }) => {
  const theme = useTheme();

  const isEdited = el.updated_at;

  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: el.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          position: 'relative',
          maxWidth: '75%',
        }}
      >
        <PollBox message={el} all_members={all_members} />

        <DateLine date={isEdited ? el.updated_at : el.created_at} isEdited={isEdited} isMyMessage={el.isMyMessage} />
        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

const StickerMsg = ({ el, forwardChannelName }) => {
  const theme = useTheme();
  const isEdited = el.updated_at;
  return (
    <Stack direction="row" justifyContent={el.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        py={1.5}
        sx={{
          position: 'relative',
          maxWidth: '75%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: el.isMyMessage ? 'flex-end' : 'flex-start',
        }}
      >
        <ForwardTo message={el} forwardChannelName={forwardChannelName} />
        <Stack direction="column" alignItems="flex-end" width={'200px'} justifyContent="center">
          {el.sticker_url.endsWith('.tgs') ? (
            <tgs-player
              autoplay
              loop
              mode="normal"
              src={el.sticker_url}
              style={{ width: '200px', height: '200px' }}
            ></tgs-player>
          ) : (
            <ImageCanvas
              dataUrl={el.sticker_url}
              width={'200px'}
              height={'200px'}
              styleCustom={{ borderRadius: '12px' }}
              openLightbox={true}
            />
          )}

          <DateLine date={isEdited ? el.updated_at : el.created_at} isMyMessage={el.isMyMessage} />
        </Stack>

        <MessageOption isMyMessage={el.isMyMessage} message={el} />
      </Box>
    </Stack>
  );
};

export { TextMsg, AttachmentMsg, ReplyMsg, SignalMsg, LinkPreviewMsg, PollMsg, StickerMsg };
