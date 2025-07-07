import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Slide,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Badge,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import ProjectAvatar from './ProjectAvatar';
import { JoinProject, SetProjectCurrent } from '../redux/slices/wallet';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const JoinProjectDialog = ({ openDialog, setOpenDialog, project }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const onCloseDialog = () => {
    setOpenDialog(false);
  };

  const onSubmit = async () => {
    const project_id = project.project_id;
    dispatch(JoinProject(project_id));
    onCloseDialog();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={openDialog}
      TransitionComponent={Transition}
      keepMounted
      onClose={onCloseDialog}
      aria-describedby="alert-dialog-slide-description"
    >
      {/* <DialogTitle>Join fsdfsd</DialogTitle> */}
      <DialogContent>
        <Typography sx={{ fontSize: '20px', marginBottom: '15px' }}>
          Join <strong>{project.project_name}</strong>
        </Typography>

        {project.description && (
          <DialogContentText id="alert-dialog-slide-description">{project.description}</DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseDialog}>Later</Button>
        <LoadingButton variant="contained" onClick={onSubmit}>
          Join now
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

const StyledProjectBox = styled(Box)(({ theme }) => ({
  transition: 'all .1s',
  width: '100%',
  borderRadius: '8px',
  '&:hover': {
    cursor: 'pointer',
    backgroundColor:
      theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.5) : theme.palette.primary.main,
    '& .optionsMore': {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    '& .optionsNoti': {
      display: 'none',
    },
  },
}));

const ProjectElement = ({ project, joined }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { projectCurrent } = useSelector(state => state.wallet);
  const { allUnreadData } = useSelector(state => state.channel);

  const [openDialog, setOpenDialog] = useState(false);
  const [haveUnread, setHaveUnread] = useState(false);

  const projectIdSelected = projectCurrent?.project_id;
  const projectId = project.project_id;

  useEffect(() => {
    if (allUnreadData) {
      const { channels } = allUnreadData;
      const haveUnread =
        channels &&
        channels.some(channel => {
          const id = channel.channel_id.split(':')[0];
          return id === projectId && channel.unread_count > 0;
        });

      setHaveUnread(!!haveUnread);
    }
  }, [allUnreadData, projectId]);

  const onLeftClick = () => {
    if (joined) {
      dispatch(SetProjectCurrent(project));
    } else {
      setOpenDialog(true);
    }
  };

  let isSelected = projectIdSelected === projectId;
  if (!projectIdSelected) {
    isSelected = false;
  }

  return (
    <>
      <StyledProjectBox
        onClick={onLeftClick}
        sx={{
          backgroundColor: isSelected
            ? theme.palette.mode === 'light'
              ? alpha(theme.palette.primary.main, 0.5)
              : theme.palette.primary.main
            : theme.palette.mode === 'light'
              ? '#fff'
              : theme.palette.background.paper,
        }}
        p={2}
      >
        <Stack direction="row" alignItems={'center'} justifyContent="space-between">
          <Stack direction="row" spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
            <ProjectAvatar project={project} width={40} height={40} />
            <Stack spacing={0.3} sx={{ width: 'calc(100% - 40px)' }}>
              <Typography
                variant="subtitle2"
                sx={{ width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {project.project_name}
              </Typography>
            </Stack>
          </Stack>
          {haveUnread && <Badge color="error" variant="dot" />}
        </Stack>
      </StyledProjectBox>

      <JoinProjectDialog openDialog={openDialog} setOpenDialog={setOpenDialog} project={project} />
    </>
  );
};

export default ProjectElement;
