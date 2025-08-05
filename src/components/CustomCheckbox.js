import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import { CheckboxIcon, CheckedIcon } from './Icons';

const CustomCheckbox = React.forwardRef((props, ref) => {
  return <Checkbox icon={<CheckboxIcon />} checkedIcon={<CheckedIcon />} ref={ref} {...props} />;
});

export default CustomCheckbox;
