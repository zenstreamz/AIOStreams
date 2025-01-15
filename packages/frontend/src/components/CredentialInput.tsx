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
  return (
    <div className={styles.credentialsInputContainer}>
      <input
      type={isEncrypted(credential) ? 'password' : 'text'}
      value={isEncrypted(credential) ? '••••••••••••••••••••••••' : credential}
      onChange={(e) => setCredential(e.target.value.trim())}
      className={styles.credentialInput}
      {...inputProps}
      disabled={isEncrypted(credential) ? true : inputProps.disabled || false}
      />
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
