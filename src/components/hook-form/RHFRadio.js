import PropTypes from 'prop-types';
// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { RadioGroup, FormControl, FormControlLabel, Radio, FormLabel, FormHelperText } from '@mui/material';

// ----------------------------------------------------------------------

RHFRadio.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  label: PropTypes.string,
  helperText: PropTypes.node,
};

export default function RHFRadio({
  name,
  options,
  label,
  helperText,
  controlSx = {},
  labelPlacement = 'end',
  optionSx = {},
  ...other
}) {
  const { control } = useFormContext();

  const renderHelperText = error => {
    if (error) {
      return error.message;
    } else {
      return helperText;
    }
  };

  return (
    <FormControl component="fieldset" error={!!helperText} fullWidth sx={{ ...controlSx }}>
      {label && <FormLabel component="legend">{label}</FormLabel>}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            <RadioGroup {...field} {...other}>
              {options.map(option => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  labelPlacement={labelPlacement}
                  sx={{ ...optionSx }}
                />
              ))}
            </RadioGroup>
            {renderHelperText() && <FormHelperText>{renderHelperText(error)}</FormHelperText>}
          </>
        )}
      />
    </FormControl>
  );
}
