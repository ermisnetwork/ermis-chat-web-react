import { useRef } from 'react';
// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { Stack, TextField } from '@mui/material';

export default function RHFCodes({ keyName = '', inputs = [], ...other }) {
  const codesRef = useRef(null);

  const { control, setValue } = useFormContext();

  const handleChangeWithNextField = (event, handleChange) => {
    const { maxLength, value, name } = event.target;

    const fieldIndex = name.replace(keyName, '');

    const fieldIntIndex = Number(fieldIndex);

    const nextfield = document.querySelector(`input[name=${keyName}${fieldIntIndex + 1}]`);

    if (value.length > maxLength) {
      event.target.value = value[0];
    }

    if (value.length >= maxLength && fieldIntIndex < 6 && nextfield !== null) {
      nextfield.focus();
    }

    handleChange(event);
  };

  const handleKeyDown = (event, field, index) => {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (event.target.value) {
        // Nếu có value thì xoá value hiện tại
        setValue(`${keyName}${index + 1}`, '');
        event.preventDefault();
      } else {
        // Nếu không có value thì focus về input trước và xoá luôn value trước đó
        const prevField = document.querySelector(`input[name=${keyName}${index}]`);
        if (prevField) {
          setValue(`${keyName}${index}`, '');
          prevField.focus();
          event.preventDefault();
        }
      }
    }
  };

  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" ref={codesRef}>
      {inputs.map((name, index) => (
        <Controller
          key={name}
          name={`${keyName}${index + 1}`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              error={!!error}
              autoFocus={index === 0}
              placeholder="-"
              onChange={event => {
                handleChangeWithNextField(event, field.onChange);
              }}
              onFocus={event => event.currentTarget.select()}
              onKeyDown={event => handleKeyDown(event, field, index)}
              InputProps={{
                sx: {
                  width: { xs: 36, sm: 56 },
                  height: { xs: 36, sm: 56 },
                  '& input': { p: 0, textAlign: 'center' },
                },
              }}
              inputProps={{
                maxLength: 1,
                type: 'number',
              }}
              {...other}
            />
          )}
        />
      ))}
    </Stack>
  );
}
