import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography, styled } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { CaretLeft } from 'phosphor-react';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import { SidebarType } from '../../constants/commons-const';
import { CapabilitiesName } from '../../constants/capabilities-const';
import { SetMemberCapabilities } from '../../redux/slices/channel';
import { handleError } from '../../utils/commons';
import Slider from '@mui/material/Slider';
import CustomCheckbox from '../../components/CustomCheckbox';
import { useTranslation } from 'react-i18next';

const StyledActionItem = styled(Stack)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  transition: 'background-color 0.2s ease-in-out',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexDirection: 'row',
  padding: '12px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
  '&:hover': {
    cursor: 'pointer',
    backgroundColor: theme.palette.divider,
  },
  '& .MuiTypography-root': {
    fontSize: '16px',
  },
}));

const marks = [
  {
    value: 0,
    label: 'Off',
    miliseconds: 0,
  },
  {
    value: 10,
    label: '10s',
    miliseconds: 10000,
  },
  {
    value: 20,
    label: '30s',
    miliseconds: 30000,
  },
  {
    value: 30,
    label: '1m',
    miliseconds: 60000,
  },
  {
    value: 40,
    label: '5m',
    miliseconds: 300000,
  },
  {
    value: 50,
    label: '15m',
    miliseconds: 900000,
  },
  {
    value: 60,
    label: '1h',
    miliseconds: 3600000,
  },
];

const ACTIONS = [
  {
    label: 'sidebarPermissions.send_messages',
    capability: CapabilitiesName.SendMessage,
  },
  {
    label: 'sidebarPermissions.send_links',
    capability: CapabilitiesName.SendLinks,
  },
  {
    label: 'sidebarPermissions.edit_messages',
    capability: CapabilitiesName.UpdateOwnMessage,
  },
  {
    label: 'sidebarPermissions.delete_messages',
    capability: CapabilitiesName.DeleteOwnMessage,
  },
  {
    label: 'sidebarPermissions.react_messages',
    capability: CapabilitiesName.SendReaction,
  },
  {
    label: 'sidebarPermissions.pin_messages',
    capability: CapabilitiesName.PinMessage,
  },
  {
    label: 'sidebarPermissions.create_poll',
    capability: CapabilitiesName.CreatePoll,
  },
  {
    label: 'sidebarPermissions.vote_poll',
    capability: CapabilitiesName.VotePoll,
  },
];

const SidebarPermissions = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t } = useTranslation();
  const { currentChannel, capabilities } = useSelector(state => state.channel);
  const [loadingButton, setLoadingButton] = useState(false);
  const [newCapabilities, setNewCapabilities] = useState([]);
  const [oldCooldown, setOldCooldown] = useState({ value: 0, label: '', miliseconds: 0 });
  const [newCooldown, setNewCooldown] = useState({ value: 0, label: '', miliseconds: 0 });

  useEffect(() => {
    setNewCapabilities(capabilities);
  }, [capabilities]);

  const onSetCooldown = miliseconds => {
    const current = marks.find(item => item.miliseconds === miliseconds);
    setOldCooldown(current);
    setNewCooldown(current);
  };

  useEffect(() => {
    if (currentChannel) {
      onSetCooldown(currentChannel.data.member_message_cooldown || 0);
    }
  }, [currentChannel]);

  const onChangeCapa = (event, value) => {
    const checked = event.target.checked;
    if (checked) {
      setNewCapabilities(prev => {
        return [...prev, value];
      });
    } else {
      setNewCapabilities(prev => {
        return prev.filter(item => item !== value);
      });
    }
  };

  const onChangeCooldown = event => {
    const value = event.target.value;
    const current = marks.find(item => item.value === value);
    setNewCooldown(current);
  };

  const updateCooldown = async () => {
    const response = await currentChannel.update({ member_message_cooldown: newCooldown.miliseconds });

    if (response) {
      onSetCooldown(response.channel.member_message_cooldown ? response.channel.member_message_cooldown : 0);
      dispatch(
        showSnackbar({
          severity: 'success',
          message: t('sidebarPermissions.update_cooldown_success'),
        }),
      );
      setLoadingButton(false);
    }
  };

  const updateCapabilities = async () => {
    const response = await currentChannel.updateCapabilities(newCapabilities);
    if (response) {
      dispatch(SetMemberCapabilities(newCapabilities));
      dispatch(
        showSnackbar({
          severity: 'success',
          message: t('sidebarPermissions.update_capabilities_success'),
        }),
      );
      setLoadingButton(false);
    }
  };

  const onSaveClick = async () => {
    try {
      setLoadingButton(true);

      if (capabilities.length !== newCapabilities.length) {
        await updateCapabilities();
      }

      if (JSON.stringify(oldCooldown) !== JSON.stringify(newCooldown)) {
        await updateCooldown();
      }
    } catch (error) {
      setLoadingButton(false);
      handleError(dispatch, error, t);
    }
  };

  const isDisabledBtn =
    capabilities.length === newCapabilities.length && JSON.stringify(oldCooldown) === JSON.stringify(newCooldown);

  return (
    <Stack sx={{ width: '100%', height: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ padding: '10px 15px' }}>
        <IconButton
          onClick={() => {
            dispatch(UpdateSidebarType(SidebarType.Channel));
          }}
        >
          <CaretLeft size={20} color={theme.palette.text.primary} />
        </IconButton>

        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          {t('sidebarPermissions.permissions')}
        </Typography>

        <LoadingButton
          variant="text"
          size="small"
          onClick={onSaveClick}
          disabled={isDisabledBtn}
          loading={loadingButton}
        >
          {t('sidebarPermissions.save')}
        </LoadingButton>
      </Stack>

      <Stack sx={{ padding: '24px', flex: 1, minHeight: 'auto', overflow: 'hidden' }} gap={2}>
        <Stack
          className="customScrollbar"
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            marginLeft: '-24px!important',
            marginRight: '-24px!important',
            padding: '0 24px',
            minHeight: 'auto',
            flex: 1,
          }}
        >
          <Stack spacing={2}>
            <Box>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme => theme.palette.text.primary,
                  marginBottom: '5px',
                }}
              >
                {t('sidebarPermissions.member_actions')}
              </Typography>

              <Stack
                sx={{
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                }}
              >
                {ACTIONS.map(action => (
                  <StyledActionItem
                    key={action.capability}
                    onClick={() =>
                      onChangeCapa(
                        { target: { checked: !newCapabilities.includes(action.capability) } },
                        action.capability,
                      )
                    }
                  >
                    <Typography sx={{ fontSize: '14px' }}>{t(action.label)}</Typography>
                    <CustomCheckbox
                      checked={newCapabilities.includes(action.capability)}
                      onClick={e => e.stopPropagation()}
                      onChange={event => onChangeCapa(event, action.capability)}
                      sx={{ padding: 0 }}
                    />
                  </StyledActionItem>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme => theme.palette.text.primary,
                  marginBottom: '5px',
                }}
              >
                {t('sidebarPermissions.slow_mode')}
              </Typography>
              <Stack
                gap={2}
                sx={{
                  padding: '15px',
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: '16px',
                }}
              >
                <Slider
                  value={newCooldown.value}
                  step={10}
                  valueLabelDisplay="off"
                  marks={marks}
                  min={0}
                  max={60}
                  onChange={onChangeCooldown}
                />

                <Typography sx={{ color: theme.palette.grey[500], fontSize: '14px', marginTop: '10px' }}>
                  {t('sidebarPermissions.message')}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default SidebarPermissions;
