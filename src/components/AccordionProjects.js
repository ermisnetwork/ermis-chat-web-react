import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  styled,
  Typography,
  Stack,
  Avatar,
  useTheme,
} from '@mui/material';
import { CaretDown } from 'phosphor-react';
import ProjectElement from './ProjectElement';

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.paper,
  borderRadius: '8px',
}));
const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  minHeight: 'auto !important',
  padding: '15px',
  '& .MuiAccordionSummary-content': {
    margin: '0px !important',
  },
}));
const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: '0px 15px',
}));

function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name) {
  return {
    children: `${name.substring(0, 2)}`,
  };
}

const AccordionProjects = ({ data, joined }) => {
  const dispatch = useDispatch();
  const theme = useTheme();

  const projects = data.projects;
  const clientName = data.client_name;

  const getFontSizeAvatar = size => {
    return `${size / 2.5}px`;
  };

  return (
    <StyledAccordion>
      <StyledAccordionSummary expandIcon={<CaretDown size={18} />}>
        <Stack direction="row" alignItems="center">
          <Avatar
            sx={{
              background: stringToColor(clientName),
              color: '#fff',
              width: 40,
              height: 40,
              border: `1px solid ${theme.palette.background.paper}`,
              fontSize: getFontSizeAvatar(40),
              fontWeight: 600,
            }}
            {...stringAvatar(clientName)}
          />
          <Typography
            variant="subtitle2"
            sx={{
              width: 'calc(100% - 40px)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingLeft: '15px',
            }}
          >
            {clientName}
          </Typography>
        </Stack>
      </StyledAccordionSummary>
      <StyledAccordionDetails>
        {projects.map(project => {
          return <ProjectElement key={project.project_id} project={project} joined={joined} />;
        })}
      </StyledAccordionDetails>
    </StyledAccordion>
  );
};

export default AccordionProjects;
