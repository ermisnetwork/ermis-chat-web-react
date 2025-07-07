import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox, FormControlLabel } from '@mui/material';

const RHFCheckbox = ({ name, label, ...other }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox {...field} checked={!!field.value} onChange={e => field.onChange(e.target.checked)} {...other} />
          }
          label={label}
        />
      )}
    />
  );
};

export default RHFCheckbox;
