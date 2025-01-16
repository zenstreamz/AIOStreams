import React from 'react';
import styles from './CredentialInput.module.css';

interface CredentialInputProps {
  credential: string;
  setCredential: (credential: string) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}
function isEncrypted(value: string): boolean {
  return value.match(/^E-[0-9a-fA-F]{32}-[0-9a-fA-F]+$/) !== null;
}

const CredentialInput: React.FC<CredentialInputProps> = ({
  credential,
  setCredential,
  inputProps = {},
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <div className={styles.credentialsInputContainer}>
      <input
        type={showPassword ? 'text' : 'password'}
        value={
          isEncrypted(credential) ? '••••••••••••••••••••••••' : credential
        }
        onChange={(e) => setCredential(e.target.value.trim())}
        className={styles.credentialInput}
        {...inputProps}
        disabled={isEncrypted(credential) ? true : inputProps.disabled || false}
      />
      {!isEncrypted(credential) && (
        <button
          className={styles.showHideButton}
          onClick={() => {
            if (!isEncrypted(credential)) {
              setShowPassword(!showPassword);
            }
          }}
        >
          {showPassword ? (
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></circle>
              </g>
            </svg>
          ) : (
            <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M2 2L22 22"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </g>
            </svg>
          )}
        </button>
      )}

      {isEncrypted(credential) && (
        <button
          className={styles.resetCredentialButton}
          onClick={() => setCredential('')}
        >
          <svg
            fill="currentColor"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            width="26px"
            height="26px"
            viewBox="0 0 489.533 489.533"
          >
            <g>
              <path d="M244.767,0C109.767,0,0,109.767,0,244.767s109.767,244.767,244.767,244.767s244.767-109.767,244.767-244.767 S379.767,0,244.767,0z M244.767,448.533c-112.267,0-203.767-91.5-203.767-203.767S132.5,40.999,244.767,40.999 S448.533,132.5,448.533,244.767S357.033,448.533,244.767,448.533z" />
              <path d="M244.767,122.5c-67.5,0-122.5,55-122.5,122.5h40.999c0-45.5,36-81.5,81.5-81.5s81.5,36,81.5,81.5 c0,45.5-36,81.5-81.5,81.5c-22.5,0-42.5-9-57.5-24l40.999-40.999h-122.5v122.5l40.999-40.999c22.5,22.5,53.5,36,87.5,36 c67.5,0,122.5-55,122.5-122.5S312.267,122.5,244.767,122.5z" />
            </g>
          </svg>
        </button>
      )}
    </div>
  );
};

export default CredentialInput;
