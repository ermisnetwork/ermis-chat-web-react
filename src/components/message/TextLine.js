import React from 'react';
import { Box, useTheme, IconButton, Typography, styled } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { showSnackbar } from '../../redux/slices/app';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy } from 'phosphor-react';
import DateLine from './DateLine';

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

const TextLine = ({ message }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
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
      } else if (part.match(mentionRegex)) {
        const mentionObj = mentions.find(m => m.mentionId === part || m.mentionName === part);
        if (mentionObj) {
          const customClass =
            mentionObj.mentionId === '@all' ? 'mentionAll' : mentionObj.id === user_id ? 'mentionMe' : '';
          return (
            <span key={index} className={`mentionHighlight ${customClass}`}>
              {mentionObj.mentionName}
            </span>
          );
        }
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  const onCopyCode = async code => {
    try {
      await navigator.clipboard.writeText(code);
      dispatch(showSnackbar({ severity: 'success', message: t('conversation.copy_text') }));
    } catch (err) {
      dispatch(showSnackbar({ severity: 'error', message: t('conversation.copy_failed') }));
    }
  };

  const renderMsg = () => {
    if (isCode(message.text)) {
      const codeContent = message.text.slice(3, -3).trim();
      return (
        <Box sx={{ position: 'relative' }}>
          <SyntaxHighlighter language="javascript" style={atomDark} showLineNumbers customStyle={{ width: '100%' }}>
            {codeContent}
          </SyntaxHighlighter>

          <IconButton
            onClick={() => onCopyCode(codeContent)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <Copy size={16} />
          </IconButton>
        </Box>
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

export default TextLine;
