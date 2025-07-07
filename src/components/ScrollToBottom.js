import React, { useEffect, useState } from 'react';
import { alpha, IconButton, styled, useTheme } from '@mui/material';
import { CaretDown } from 'phosphor-react';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '20px',
  bottom: '200px',
  zIndex: 1,
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  transition: 'all .2s',
}));

const ScrollToBottom = ({ messageListRef }) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const chatContainer = messageListRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => {
        chatContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [messageListRef]);

  const handleScroll = () => {
    const chatContainer = messageListRef.current;

    if (chatContainer && chatContainer.scrollTop < 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToBottom = () => {
    const chatContainer = messageListRef.current;
    chatContainer.scrollTop = chatContainer.scrollHeight;
    setIsVisible(false);
  };

  return (
    <StyledIconButton
      size={'large'}
      onClick={scrollToBottom}
      sx={{ opacity: isVisible ? 1 : 0, visibility: isVisible ? 'visible' : 'hidden' }}
    >
      <CaretDown size={24} color={theme.palette.primary.main} />
    </StyledIconButton>
  );
};

export default ScrollToBottom;
