import { styled, alpha } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 16,
  backgroundColor: theme.palette.background.neutral,
  width: '100%',

  '& .spinner': {
    padding: '0px',
  },
}));

export default Search;
