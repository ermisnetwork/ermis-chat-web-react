import {
  Stack,
  FormControl,
  Box,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import { useState } from 'react';
import { BASE_URL } from '../../config';
import { Check, X } from 'phosphor-react';
import { LocalStorageKey } from '../../constants/localStorage-const';

// ----------------------------------------------------------------------

export default function CustomApiUrlForm() {
  const [envi, setEnvi] = useState(BASE_URL);
  const [isCustom, setIsCustom] = useState(false);

  const handleChange = event => {
    const value = event.target.value;
    if (value === 'custom') {
      setIsCustom(true);
      window.localStorage.setItem(LocalStorageKey.IsCustomApiUrl, true);
    } else {
      setEnvi(value);
      setIsCustom(false);
      window.localStorage.setItem(LocalStorageKey.ApiUrl, value);
      window.location.reload();
    }
  };

  const onChangeCustom = event => {
    const value = event.target.value;
    setEnvi(value);
  };

  const onSave = () => {
    window.localStorage.setItem(LocalStorageKey.ApiUrl, envi);
    window.location.reload();
  };

  const onCancel = () => {
    setIsCustom(false);
  };

  return (
    <Box sx={{ position: 'fixed', top: '30px', right: '30px', minWidth: '120px', marginTop: '0px !important' }}>
      <FormControl fullWidth size="small">
        {isCustom ? (
          <Stack direction="row" justifyContent="end" alignItems="center">
            <TextField
              id="outlined-basic"
              label="Enviroment custom"
              variant="outlined"
              onChange={onChangeCustom}
              size="small"
              sx={{ width: '250px' }}
            />
            <Stack direction="row" sx={{ marginLeft: '5px' }}>
              <IconButton onClick={onCancel}>
                <X size={16} color="red" />
              </IconButton>
              <IconButton onClick={onSave}>
                <Check size={16} color="green" />
              </IconButton>
            </Stack>
          </Stack>
        ) : (
          <>
            <InputLabel id="demo-simple-select-label">Enviroment</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={envi}
              label="Enviroment"
              onChange={handleChange}
            >
              <MenuItem value={'https://api-dev.ermis.network'}>DEV</MenuItem>
              <MenuItem value="https://api-staging.ermis.network">STAGING</MenuItem>
              <MenuItem value="https://api-internal.ermis.network">INTERNAL</MenuItem>
              <MenuItem value="custom">CUSTOM</MenuItem>
            </Select>
          </>
        )}
      </FormControl>
      <Typography sx={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{BASE_URL}</Typography>
    </Box>
  );
}
