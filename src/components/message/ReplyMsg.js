import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Attachments from '../Attachments';
import VoiceLine from './VoiceLine';
import TextLine from './TextLine';
import LinkPreview from '../LinkPreview';
import MessageOption from '../message/MessageOption';
import { formatString, displayMessageWithMentionName } from '../../utils/commons';
import ImageCanvas from '../ImageCanvas';
import { Trash } from 'phosphor-react';
import FileTypeBadge from '../FileTypeBadge';

const ReplyMsg = ({ message, all_members, onScrollToReplyMsg }) => {
  const { t } = useTranslation();
  const { mentions } = useSelector(state => state.channel);
  const theme = useTheme();
  const memberInfo = message.quoted_message?.user;
  const quotedMessage = message.quoted_message;
  const name = memberInfo ? formatString(memberInfo.name) : formatString(quotedMessage.user.id);
  const attachmentsOfQuoted = quotedMessage.attachments?.filter(item => item.type !== 'linkPreview');
  const media = attachmentsOfQuoted ? attachmentsOfQuoted[0] : null;
  const attachmentsOfMsg = message.attachments
    ? message.attachments.filter(attachment => !['linkPreview', 'voiceRecording'].includes(attachment.type))
    : null;
  const voiceMsg = message.attachments
    ? message.attachments.find(attachment => attachment.type === 'voiceRecording')
    : null;
  const linkPreviewMsg =
    message.attachments && message.attachments[0]?.type === 'linkPreview' && message.attachments[0]?.title
      ? message.attachments[0]
      : null;
  const stickerOfQuoted = quotedMessage?.sticker_url ? quotedMessage.sticker_url : null;

  return (
    <Stack direction="row" justifyContent={message.isMyMessage ? 'end' : 'start'} alignItems="center">
      <Box
        px={1.5}
        py={1.5}
        sx={{
          backgroundColor: message.isMyMessage ? theme.palette.primary.main : theme.palette.background.neutral,
          borderRadius: 1.5,
          maxWidth: '400px',
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
          onClick={() => onScrollToReplyMsg(message.quoted_message.id)}
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
              {message.quoted_message.deleted_at ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.grey[600],
                    fontSize: 12,
                    display: 'flex',
                  }}
                >
                  <Trash size={16} color={theme.palette.grey[600]} />
                  &nbsp;&nbsp;{t('conversation.message_deleted')}
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
                      __html: displayMessageWithMentionName(message.quoted_message.text, mentions),
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
          {message.sticker_url ? (
            <Box sx={{ mt: 0.5 }}>
              {message.sticker_url.endsWith('.tgs') ? (
                <tgs-player
                  autoplay
                  loop
                  mode="normal"
                  src={message.sticker_url}
                  style={{ width: '150px', height: '150px' }}
                ></tgs-player>
              ) : (
                <ImageCanvas
                  dataUrl={message.sticker_url}
                  width={'150px'}
                  height={'150px'}
                  styleCustom={{ borderRadius: '6px' }}
                />
              )}
            </Box>
          ) : (
            <TextLine message={message} />
          )}
          {/* <TextLine message={message} /> */}
        </Stack>
        {/* <TextLine message={message} /> */}
        <MessageOption isMyMessage={message.isMyMessage} message={message} />
      </Box>
    </Stack>
  );
};
export default ReplyMsg;
