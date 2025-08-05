import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { FormControlLabel } from '@mui/material';
import CustomCheckbox from '../CustomCheckbox';

const RHFCheckbox = ({ name, label, ...other }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <CustomCheckbox
              {...field}
              checked={!!field.value}
              onChange={e => field.onChange(e.target.checked)}
              {...other}
            />
          }
          label={label}
        />
      )}
    />
  );
};

export default RHFCheckbox;
