import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { Autocomplete, Chip, Stack, TextField, debounce, useTheme } from '@mui/material';
import MemberAvatar from '../MemberAvatar';
import { formatString, handleError } from '../../utils/commons';
import { useDispatch } from 'react-redux';
import { client } from '../../client';

// ----------------------------------------------------------------------

RHFAutocompleteMember.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  helperText: PropTypes.node,
  // friendIds: PropTypes.array,
  // userPendingIds: PropTypes.array,
  // userInviteIds: PropTypes.array,
};

export default function RHFAutocompleteMember({
  name,
  label,
  helperText,
  // friendIds,
  // userPendingIds,
  // userInviteIds,
  ...other
}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { control, setValue } = useFormContext();

  const [options, setOptions] = useState([]);
  const [loadingOption, setLoadingOption] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchOptions = async (value, page) => {
    try {
      const name = value;
      const page_size = 10;
      const result = await client.searchUsers(page, page_size, name);

      if (result) {
        return {
          ...result,
          data: result.data.map(user => {
            return { ...user, name: user.name ? user.name : user.id };
          }),
        };
      }
    } catch (error) {
      handleError(dispatch, error, t);
      return { data: [], total: 0 };
    }
  };

  const loadOptions = async (name, page) => {
    setLoadingOption(true);
    const response = await fetchOptions(name, page);
    setOptions(prev => (page === 1 ? response.data : [...prev, ...response.data]));
    setTotalPages(response.total);
    setLoadingOption(false);
  };

  const debouncedLoadOptions = useCallback(
    debounce((name, page) => {
      loadOptions(name, page);
    }, 300),
    [],
  );

  useEffect(() => {
    loadOptions('', 1);
  }, []);

  const onInputChange = (event, value) => {
    setPage(1);
    debouncedLoadOptions(value, 1);
  };

  const handlePageChange = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOptions('', nextPage);
    }
  };

  const handleScroll = event => {
    const bottom = event.target.scrollHeight - event.target.scrollTop === event.target.clientHeight;
    if (bottom) {
      handlePageChange();
    }
  };

  // const getUserStatusText = userId => {
  //   if (friendIds.includes(userId)) {
  //     return 'Friends';
  //   } else if (userPendingIds.includes(userId)) {
  //     return 'Request sent';
  //   } else if (userInviteIds.includes(userId)) {
  //     return 'Requested you';
  //   } else {
  //     return '';
  //   }
  // };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={options}
          loading={loadingOption}
          onInputChange={onInputChange}
          ListboxProps={{
            onScroll: event => {
              handleScroll(event);
            },
          }}
          onChange={(event, newValue) => setValue(name, newValue, { shouldValidate: true })}
          getOptionLabel={option => option.name || ''}
          renderOption={(props, option) => {
            return (
              <Stack direction="row" key={option.id} {...props}>
                <MemberAvatar member={option} width={30} height={30} />
                <span style={{ marginLeft: 5 }}>
                  {formatString(option.name)}
                  {/* <span style={{ display: 'block', fontSize: '12px', color: theme.palette.text.secondary }}>
                    {getUserStatusText(option.id)}
                  </span> */}
                </span>
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
          // filterOptions={x => x}
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
