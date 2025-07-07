import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import ProjectElement from '../../components/ProjectElement';
import AccordionProjects from '../../components/AccordionProjects';

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

const TabYourProjects = ({ tabIndex }) => {
  const theme = useTheme();
  const { yourProjects } = useSelector(state => state.wallet);

  return (
    <CustomTabPanel value={tabIndex} index={0}>
      <Stack spacing={2}>
        {yourProjects.length > 0 ? (
          yourProjects.map(item => {
            const projects = item.projects;

            return (
              <Box key={item.client_id}>
                {projects.length === 1 ? (
                  <ProjectElement project={projects[0]} joined={true} />
                ) : (
                  <AccordionProjects data={item} joined={true} />
                )}
              </Box>
            );
          })
        ) : (
          <Typography
            variant="subtitle2"
            sx={{
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '14px',
              color: theme.palette.text.secondary,
              fontWeight: 400,
            }}
          >
            No projects
          </Typography>
        )}
      </Stack>
    </CustomTabPanel>
  );
};

export default TabYourProjects;
