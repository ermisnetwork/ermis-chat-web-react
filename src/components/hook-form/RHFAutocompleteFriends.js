import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { Autocomplete, Chip, Stack, TextField } from '@mui/material';
import MemberAvatar from '../MemberAvatar';
import { formatString } from '../../utils/commons';
import { useSelector } from 'react-redux';
import { client } from '../../client';

// ----------------------------------------------------------------------

RHFAutocompleteFriends.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.node,
};

export default function RHFAutocompleteFriends({ name, label, helperText, ...other }) {
  const { control, setValue } = useFormContext();

  const { friend_ids } = useSelector(state => state.member);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    const users = client.state.users ? Object.values(client.state.users) : [];
    const listFriends = users.filter(member => friend_ids.includes(member.id));
    setOptions(listFriends);
  }, [friend_ids]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={options}
          onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
          getOptionLabel={option => option.name || ''}
          renderOption={(props, option) => {
            return (
              <Stack direction="row" key={option.id} {...props}>
                <MemberAvatar member={option} width={30} height={30} />
                <span style={{ marginLeft: 5 }}>{formatString(option.name)}</span>
              </Stack>
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                avatar={<MemberAvatar member={option} width={26} height={26} />}
                label={formatString(option.name)}
                {...getTagProps({ index })}
              />
            ))
          }
          filterSelectedOptions={true}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={params => (
            <TextField label={label} error={!!error} helperText={error ? error?.message : helperText} {...params} />
          )}
          {...other}
        />
      )}
    />
  );
}
