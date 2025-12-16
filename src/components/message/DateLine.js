import { Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { fTime } from '../../utils/formatTime';

const DateLine = ({ date, isEdited, isMyMessage }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Typography
      variant="body2"
      color={isMyMessage ? theme.palette.grey[400] : theme.palette.text.secondary}
      sx={{ textAlign: 'right', fontSize: '12px', marginLeft: '20px', marginTop: '5px', fontStyle: 'italic' }}
    >
      {isEdited && (
        <span className="underline" style={{ cursor: 'pointer', marginRight: '6px' }}>
          {t('conversation.edited')}
        </span>
      )}
      <span>{fTime(date)}</span>
    </Typography>
  );
};

export default DateLine;
