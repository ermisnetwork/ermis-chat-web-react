import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { MemberElement } from '../../components/MemberElement';
import { TabMembers } from '../../constants/commons-const';

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

const TabMembersPending = ({ indexTab, members }) => {
  const theme = useTheme();

  return (
    <CustomTabPanel value={indexTab} index={TabMembers.InvitedMembers}>
      <Stack spacing={2}>
        {members.length > 0 ? (
          members.map(member => {
            return (
              <MemberElement
                key={member.user_id}
                showMenu={false}
                data={member}
                onRemoveMember={null}
                onUnbanMember={null}
              />
            );
          })
        ) : (
          <Typography
            sx={{
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '14px',
              color: theme.palette.text.secondary,
              fontWeight: 400,
            }}
          >
            No invited members
          </Typography>
        )}
      </Stack>
    </CustomTabPanel>
  );
};

export default TabMembersPending;
