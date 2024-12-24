import React, { useState } from 'react';
import styles from './AddonsList.module.css';

interface AddonOption {
  required: boolean;
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'checkbox';
}

interface Addon {
  id: string;
  options: { [key: string]: string };
}

interface AddonsListProps {
  choosableAddons: string[];
  addonOptions: { [key: string]: AddonOption[] };
  addons: Addon[];
  setAddons: (addons: Addon[]) => void;
}

const AddonsList: React.FC<AddonsListProps> = ({ choosableAddons, addonOptions, addons, setAddons }) => {
  const [selectedAddon, setSelectedAddon] = useState<string>('');

  const addAddon = () => {
    if (selectedAddon) {
      setAddons([...addons, { id: selectedAddon, options: {} }]);
      setSelectedAddon('');
    }
  };

  const removeAddon = (index: number) => {
    const newAddons = [...addons];
    newAddons.splice(index, 1);
    setAddons(newAddons);
  };

  const updateOption = (addonIndex: number, optionKey: string, value: string) => {
    const newAddons = [...addons];
    newAddons[addonIndex].options[optionKey] = value;
    setAddons(newAddons);
  };

  return (
    <div className={styles.container}>
      <div className={styles.addonSelector}>
        <select value={selectedAddon} onChange={(e) => setSelectedAddon(e.target.value)}>
          <option value="">Select an addon</option>
          {choosableAddons.map((addon) => (
            <option key={addon} value={addon}>
              {addon}
            </option>
          ))}
        </select>
        <button onClick={addAddon}>Add Addon</button>
      </div>
      {addons.map((addon, index) => (
        <div key={index} className={styles.card}>
          <div className={styles.cardHeader}>
            <span>{addon.id}</span>
            <button onClick={() => removeAddon(index)} className={styles.deleteButton}>✖</button>
          </div>
          <div className={styles.cardBody}>
            {addonOptions[addon.id].map((option) => (
              <div key={option.key} className={styles.option}>
                <label>
                  {option.label}
                  {option.required && <span className={styles.required}><small><em>*Required Field</em></small></span>}
                </label>
                {option.type === 'text' ? (
                  <input
                    type="text"
                    value={addon.options[option.key] || ''}
                    onChange={(e) => updateOption(index, option.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={addon.options[option.key] === 'true'}
                    onChange={(e) => updateOption(index, option.key, e.target.checked.toString())}
                  />
                )}
                {option.description && <small>{option.description}</small>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AddonsList;
