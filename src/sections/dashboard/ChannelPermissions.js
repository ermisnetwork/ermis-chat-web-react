import React, { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Stack, Typography, styled, Switch } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { ArrowLeft } from 'phosphor-react';
import useResponsive from '../../hooks/useResponsive';
import { useDispatch, useSelector } from 'react-redux';
import { UpdateSidebarType, showSnackbar } from '../../redux/slices/app';
import { SidebarType } from '../../constants/commons-const';
import { CapabilitiesName } from '../../constants/capabilities-const';
import { SetMemberCapabilities } from '../../redux/slices/channel';
import { handleError } from '../../utils/commons';
import Slider from '@mui/material/Slider';

const StyledBoxActions = styled(Box)(({ theme }) => ({
  borderRadius: '8px',
  padding: '15px',
  backgroundColor: theme.palette.background.paper,
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

const ChannelPermissions = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDesktop = useResponsive('up', 'md');
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
          message: 'Update cooldown messages successfully!',
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
          message: 'Update capabilities successfully!',
        }),
      );
      setLoadingButton(false);
    }
  };

  const onSave = async () => {
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
      handleError(dispatch, error);
    }
  };

  const isDisabledBtn =
    capabilities.length === newCapabilities.length && JSON.stringify(oldCooldown) === JSON.stringify(newCooldown);

  return (
    <>
      <Box
        sx={{
          width: '100%',
          height: '74px',
        }}
      >
        <Stack
          sx={{ height: '100%' }}
          direction="row"
          alignItems={'center'}
          spacing={2}
          p={2}
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems={'center'} spacing={2}>
            <IconButton
              onClick={() => {
                dispatch(UpdateSidebarType(SidebarType.Channel));
              }}
            >
              <ArrowLeft />
            </IconButton>
            <Typography variant="subtitle2" sx={{ flex: 1, textAlign: 'left' }}>
              Permissions
            </Typography>
          </Stack>

          <LoadingButton
            loading={loadingButton}
            variant="contained"
            size="small"
            color="primary"
            sx={{ borderRadius: '32px' }}
            disabled={isDisabledBtn}
            onClick={onSave}
          >
            Save
          </LoadingButton>
        </Stack>
      </Box>
      <Stack
        sx={{
          height: 'calc(100% - 74px)',
          position: 'relative',
          flexGrow: 1,
        }}
        spacing={2}
        p={2}
      >
        <Stack sx={{ width: '100%', height: '100%' }} spacing={2}>
          <div style={{ overflowY: 'auto', height: '100%' }} className="customScrollbar">
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  WHAT CAN MEMBERS OF THIS CHANNEL DO?
                </Typography>
                <StyledBoxActions>
                  {/* ---------------------------Send Messages------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Send Messages</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.SendMessage)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.SendMessage)}
                    />
                  </Stack>
                  {/* ---------------------------Send Links------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Send Links</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.SendLinks)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.SendLinks)}
                    />
                  </Stack>
                  {/* ---------------------------Edit Messages------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Edit Messages</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.UpdateOwnMessage)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.UpdateOwnMessage)}
                    />
                  </Stack>
                  {/* ---------------------------Delete Messages------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Delete Messages</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.DeleteOwnMessage)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.DeleteOwnMessage)}
                    />
                  </Stack>
                  {/* ---------------------------React Messages------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>React Messages</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.SendReaction)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.SendReaction)}
                    />
                  </Stack>
                  {/* ---------------------------Pin Message------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Pin Message</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.PinMessage)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.PinMessage)}
                    />
                  </Stack>
                  {/* ---------------------------Create Poll------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Create Poll</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.CreatePoll)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.CreatePoll)}
                    />
                  </Stack>
                  {/* ---------------------------Vote Poll------------------------------- */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography sx={{ fontSize: '14px' }}>Vote Poll</Typography>
                    <Switch
                      checked={newCapabilities.includes(CapabilitiesName.VotePoll)}
                      onChange={event => onChangeCapa(event, CapabilitiesName.VotePoll)}
                    />
                  </Stack>
                </StyledBoxActions>
              </Box>

              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>SLOW MODE</Typography>
                <StyledBoxActions>
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
                    Set how long each member has to wait before sending their next mesage.
                  </Typography>
                </StyledBoxActions>
              </Box>
            </Stack>
          </div>
        </Stack>
      </Stack>
    </>
  );
};

export default ChannelPermissions;
