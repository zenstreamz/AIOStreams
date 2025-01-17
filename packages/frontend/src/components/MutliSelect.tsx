/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import Select, { StylesConfig } from 'react-select';

const selectStyles: StylesConfig = {
  control: (baseStyles: any, state: { isFocused: boolean }) => ({
    ...baseStyles,
    borderWidth: '0px',
    backgroundColor: 'white',
    borderRadius: 'var(--borderRadius)',
    borderColor: 'gray',
    outline: '0',
    color: 'black',
    margin: '10px 0 0 -0px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: state.isFocused ? '0 0 0 3px rgb(112, 112, 112)' : 'none',
    '&:hover': {
      borderColor: '#5c5c5c',
      boxShadow: state.isFocused
        ? '0 0 0 3px rgb(128, 128, 128)'
        : '0 0 0 2px rgb(161, 161, 161)',
    },
  }),
  input: (baseStyles: any) => ({
    ...baseStyles,
    color: 'var(--ifm-color-primary-lightest)',
  }),
  multiValue: (baseStyles: any) => ({
    ...baseStyles,
    backgroundColor: 'rgb(26, 26, 26)',
    borderRadius: 'var(--borderRadius)',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    padding: '3px',
  }),
  multiValueLabel: (baseStyles: any) => ({
    ...baseStyles,
    color: 'white',
    fontSize: '0.8rem',
  }),
  multiValueRemove: (baseStyles: any) => ({
    ...baseStyles,
    color: 'white',
    transition: 'color 0.2s',
    '&:hover': {
      backgroundColor: 'transparent',
      color: 'rgb(141, 141, 141)',
      cursor: 'pointer',
    },
  }),
  menu: (baseStyles: any) => ({
    ...baseStyles,
    color: 'white',
    backgroundColor: 'white',
    margin: '5px',
    borderRadius: 'var(--borderRadius)',
  }),
  valueContainer: (baseStyles: any) => ({
    ...baseStyles,
  }),
  option: (baseStyles: any, state: { isFocused: any }) => ({
    ...baseStyles,
    color: state.isFocused ? 'white' : 'black',
    backgroundColor: state.isFocused ? 'rgb(68, 68, 68)' : 'white',
    '&:hover': {
      backgroundColor: 'rgb(68, 68, 68)', //'#9c9c9c',
    },
    '&:active': {
      transition: 'background-color 0.4s, color 0.1s',
      backgroundColor: 'rgb(26, 26, 26)',
      color: 'white',
    },
  }),
};

interface MultiSelectProps {
  options: { value: string; label: string }[];
  setValues: (values: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, setValues }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <>
      {isClient ? (
        // https://github.com/JedWatson/react-select/issues/5859
        <Select
          isMulti
          closeMenuOnSelect={false}
          options={options}
          onChange={(selectedOptions: any) => {
            const selectedLanguages = selectedOptions.map(
              (option: any) => option.value
            );
            setValues(selectedLanguages);
          }}
          styles={selectStyles}
        />
      ) : (
        <div
          style={{
            height: '42px',
            margin: '0',
            backgroundColor: 'white',
            borderRadius: 'var(--borderRadius)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <p style={{ margin: '10px', color: '#808090' }}>Select...</p>
        </div>
      )}
    </>
  );
};

export default MultiSelect;
