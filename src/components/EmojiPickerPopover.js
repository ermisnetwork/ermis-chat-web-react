import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTheme, IconButton, Popover, Tabs, Tab, Box } from '@mui/material';
import { SmileyStickerIcon } from './Icons';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const LIST_TAB = ['Emoji', 'Stickers'];

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{ width: '360px', height: '450px', overflow: 'hidden' }}
      {...other}
    >
      {value === index && <>{children}</>}
    </Box>
  );
}

const EmojiPickerPopover = ({ inputRef, value, setValue, setStickerUrl }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [indexTab, setIndexTab] = useState(0);

  useEffect(() => {
    function handleStickerMessage(event) {
      if (event.data) {
        const sticker = event.data.data.content.url || '';
        setStickerUrl(`https://sticker.ermis.network/${sticker}`);
        setAnchorEl(null);
      }
    }
    window.addEventListener('message', handleStickerMessage);
    return () => window.removeEventListener('message', handleStickerMessage);
  }, []);

  const handleEmojiClick = emoji => {
    const input = inputRef.current;

    if (input) {
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;

      setValue(value.substring(0, selectionStart) + emoji + value.substring(selectionEnd));

      // Move the cursor to the end of the inserted emoji
      input.selectionStart = input.selectionEnd = selectionStart + 1;
    }
  };

  const onChangeTab = (event, newValue) => {
    setIndexTab(newValue);
  };

  return (
    <>
      <IconButton
        onClick={event => {
          setAnchorEl(inputRef.current);
        }}
      >
        <SmileyStickerIcon color={theme.palette.text.primary} />
      </IconButton>

      <Popover
        id={Boolean(anchorEl) ? 'emoji-picker-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
          setIndexTab(0);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 340,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={indexTab}
            onChange={onChangeTab}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
          >
            {LIST_TAB.map((item, index) => {
              return <Tab key={index} label={item} />;
            })}
          </Tabs>
        </Box>

        <CustomTabPanel value={indexTab} index={0}>
          <Picker
            theme={theme.palette.mode}
            data={data}
            onEmojiSelect={emoji => {
              handleEmojiClick(emoji.native);
            }}
          />
        </CustomTabPanel>

        <CustomTabPanel value={indexTab} index={1}>
          <iframe
            src="https://sticker.ermis.network"
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Sticker Picker"
          />
        </CustomTabPanel>
      </Popover>
    </>
  );
};

export default EmojiPickerPopover;
