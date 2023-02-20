import { AutocompleteProps } from '@mui/material/Autocomplete/Autocomplete'
import { Autocomplete, TextField } from '@mui/material'
import React from 'react'

export const AppAutocomplete = <
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
>(
  props: Omit<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, 'renderInput'>
) => <Autocomplete renderInput={(params) => <TextField {...params} />} {...props} />
