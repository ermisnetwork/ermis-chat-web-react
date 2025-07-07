import { debounce } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

export default function useMentions(value, inputRef) {
  const { mentions } = useSelector(state => state.channel);
  const { user_id } = useSelector(state => state.auth);

  const [filteredMentions, setFilteredMentions] = useState([]);
  const [anchorElMention, setAnchorElMention] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState([]);

  // Hàm lọc mentions có debounce
  const filterMentions = useCallback(
    debounce(inputValue => {
      const regexMention = /(^|\s)@([a-zA-Z0-9]+)?$/;
      const match = inputValue.match(regexMention);

      if (match) {
        const query = match[2] ? match[2].toLowerCase() : '';
        let filtered;

        if (selectedMentions.length > 0) {
          const selectedIds = new Set(selectedMentions.map(m => m.id));
          filtered = mentions.filter(
            mention => mention.name.toLowerCase().includes(query) && !selectedIds.has(mention.id),
          );
        } else {
          filtered = mentions.filter(mention => mention.name.toLowerCase().includes(query) && mention.id !== user_id);
        }

        setFilteredMentions(filtered);
        setAnchorElMention(inputRef.current);
        setHighlightedIndex(0);
      } else {
        setFilteredMentions([]);
        setAnchorElMention(null);
        setHighlightedIndex(0);
      }
    }, 50),
    [mentions, selectedMentions, user_id],
  );

  // Cập nhật danh sách mentions khi `value` thay đổi
  useEffect(() => {
    filterMentions(value);
  }, [value]);

  return {
    filteredMentions,
    anchorElMention,
    setAnchorElMention,
    highlightedIndex,
    setHighlightedIndex,
    selectedMentions,
    setSelectedMentions,
  };
}
