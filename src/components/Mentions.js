import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '@emotion/react';
import { Box, Fade, ListItemButton, ListItemAvatar, ListItemText, Popper, styled } from '@mui/material';
import { FixedSizeList } from 'react-window';
import MemberAvatar from './MemberAvatar';

const StyledMentionItem = styled(ListItemButton)(({ theme }) => ({
  cursor: 'pointer',
  // transition: 'all .1s',
  padding: '8px',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? 'rgba(1, 98, 196, 0.08)' : 'rgba(1, 98, 196, 0.16)',
  },

  '& .MuiListItemAvatar-root': {
    marginRight: '10px',
  },

  '& .MuiListItemText-root': {
    '& .MuiTypography-root.MuiListItemText-primary': {
      fontSize: '14px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },

    '& .MuiTypography-root.MuiListItemText-secondary': {
      fontSize: '12px',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  },
}));

const Row = memo(({ index, style, data }) => {
  const mention = data.filteredMentions[index];
  return (
    <StyledMentionItem
      style={style}
      alignItems="center"
      onClick={() => data.onSelectMention(mention)}
      selected={index === data.highlightedIndex}
    >
      <ListItemAvatar>
        <MemberAvatar member={{ name: mention.name, avatar: mention.avatar, id: mention.id }} width={24} height={24} />
      </ListItemAvatar>
      <ListItemText primary={mention.name} secondary={mention.mentionName} />
    </StyledMentionItem>
  );
});

export default function Mentions({ filteredMentions, anchorEl, onSelectMention, highlightedIndex }) {
  const theme = useTheme();
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current && highlightedIndex !== -1) {
      listRef.current.scrollToItem(highlightedIndex, 'smart'); // Cuộn mention vào trung tâm
    }
  }, [highlightedIndex]);

  if (filteredMentions.length === 0) return null;

  return (
    <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-start" transition sx={{ zIndex: 10000 }}>
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Box
            sx={{
              border: 1,
              borderColor: 'grey.200',
              borderRadius: 1,
              bgcolor: 'background.paper',
              // width: '230px',
            }}
            tabIndex={0}
          >
            <FixedSizeList
              ref={listRef}
              height={250}
              width={230}
              itemSize={50} // Chiều cao mỗi item
              itemCount={filteredMentions.length}
              itemData={{ filteredMentions, onSelectMention, highlightedIndex }}
              style={{ maxHeight: '250px', height: 'auto' }}
              // className="customScrollbar"
            >
              {Row}
            </FixedSizeList>
          </Box>
        </Fade>
      )}
    </Popper>
  );
}
