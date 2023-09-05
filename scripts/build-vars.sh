#!/bin/bash

var_list=(
  'CODE_CLIMATE_ID'
)

set_value() {
  varname=${1}
  if [ ! -z "${!varname}" ]; then
    echo "Setting $varname"
    echo "${varname}=${!varname}" >> $GITHUB_ENV
  fi
}

for i in "${var_list[@]}"; do
  set_value $i
done
