import React from 'react';
import { Stack, useTheme, Typography, Box, IconButton } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { Quotes, X } from 'phosphor-react';
import { displayMessageWithMentionName, formatString } from '../../utils/commons';
import { onReplyMessage } from '../../redux/slices/messages';
import FileTypeBadge from '../../components/FileTypeBadge';
import ImageCanvas from '../../components/ImageCanvas';
import { MessageType } from '../../constants/commons-const';
import { useTranslation } from 'react-i18next';

const ReplyMessageBox = ({ quotesMessage }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { mentions } = useSelector(state => state.channel);

  const attachment = quotesMessage && quotesMessage.attachments ? quotesMessage.attachments[0] : null;
  const memberInfo = quotesMessage?.user;
  const name = formatString(memberInfo?.name || memberInfo?.id);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      justifyItems="center"
      sx={{ padding: '15px 15px 5px' }}
      gap={1}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 'auto',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" gap={1}>
          <Box
            sx={{
              width: '2px',
              backgroundColor: theme.palette.primary.main,
            }}
          />
          {attachment && attachment.type !== 'linkPreview' && (
            <Box sx={{ width: '60px' }}>
              {attachment.type === 'image' ? (
                <ImageCanvas
                  dataUrl={attachment.image_url}
                  width={'50px'}
                  height={'auto'}
                  styleCustom={{ borderRadius: '6px' }}
                />
              ) : (
                <FileTypeBadge fileName={attachment.title} />
              )}
            </Box>
          )}
          <Box sx={{ minWidth: 'auto', flex: 1, overflow: 'hidden' }}>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text,
                fontSize: 12,
              }}
            >
              <Quotes size={12} weight="fill" />
              <span>&nbsp;&nbsp;{t('replyMessageBox.reply_to')}&nbsp;</span>
              <strong> {name}</strong>
            </Typography>

            {quotesMessage.type === MessageType.Sticker && quotesMessage.sticker_url && (
              <Box sx={{ mt: 0.5 }}>
                <ImageCanvas
                  dataUrl={quotesMessage.sticker_url}
                  width={'50px'}
                  height={'auto'}
                  styleCustom={{ borderRadius: '6px' }}
                />
              </Box>
            )}

            {quotesMessage.type !== MessageType.Sticker && attachment && attachment.type !== 'linkPreview' && (
              <Typography variant="body1" sx={{ fontSize: 12 }}>
                {attachment.title}
              </Typography>
            )}

            {quotesMessage.type !== MessageType.Sticker && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.grey[500],
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
                dangerouslySetInnerHTML={{ __html: displayMessageWithMentionName(quotesMessage.text, mentions) }}
              />
            )}
          </Box>
        </Stack>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => dispatch(onReplyMessage(null))}>
          <X size={20} />
        </IconButton>
      </Box>
    </Stack>
  );
};

export default ReplyMessageBox;
