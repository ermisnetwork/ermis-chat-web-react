import React from 'react';
import { Box, Stack } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { MemberElement } from '../../components/MemberElement';
import { myRoleInChannel } from '../../utils/commons';
import { ConfirmType, RoleMember, TabMembers } from '../../constants/commons-const';
import { setChannelConfirm } from '../../redux/slices/dialog';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ width: '100%', height: '100%' }}>{children}</Box>}
    </Box>
  );
}

const TabMembersOther = ({ indexTab, members }) => {
  const dispatch = useDispatch();

  const { currentChannel } = useSelector(state => state.channel);
  const myRole = myRoleInChannel(currentChannel);

  const onRemoveMember = async data => {
    const payload = {
      openDialog: true,
      channel: currentChannel,
      userId: data.user_id,
      type: ConfirmType.REMOVE_MEMBER,
    };
    dispatch(setChannelConfirm(payload));
  };

  return (
    <CustomTabPanel value={indexTab} index={TabMembers.Members}>
      <Stack spacing={2}>
        {members.map(member => {
          const memberRole = member.channel_role;

          let showMenu;
          if (myRole === RoleMember.OWNER) {
            if ([RoleMember.MEMBER, RoleMember.MOD].includes(memberRole)) {
              showMenu = true;
            } else {
              showMenu = false;
            }
          } else if (myRole === RoleMember.MOD) {
            if ([RoleMember.OWNER, RoleMember.MOD].includes(memberRole)) {
              showMenu = false;
            } else {
              showMenu = true;
            }
          } else {
            showMenu = false;
          }

          return (
            <MemberElement
              key={member.user_id}
              showMenu={showMenu}
              data={member}
              onRemoveMember={onRemoveMember}
              onUnbanMember={null}
            />
          );
        })}
      </Stack>
    </CustomTabPanel>
  );
};

export default TabMembersOther;
