import React, { useState } from 'react';
import styles from './AddonsList.module.css';
import { AddonDetail, Config } from '@aiostreams/types';

interface AddonsListProps {
  choosableAddons: string[];
  addonDetails: AddonDetail[];
  addons: Config['addons'];
  setAddons: (addons: Config['addons']) => void;
}

const AddonsList: React.FC<AddonsListProps> = ({
  choosableAddons,
  addonDetails,
  addons,
  setAddons,
}) => {
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

  const updateOption = (
    addonIndex: number,
    optionKey: string,
    value?: string | boolean | number
  ) => {
    const newAddons = [...addons];
    newAddons[addonIndex].options[optionKey] = typeof value === 'string' ? value.trim() : value;
    setAddons(newAddons);
  };

  return (
    <div className={styles.container}>
      <div className={styles.addonSelector}>
        <select
          value={selectedAddon}
          onChange={(e) => setSelectedAddon(e.target.value)}
        >
          <option value="">Select an addon</option>
          {choosableAddons.map((addon) => {
            const addonDetail = addonDetails.find(
              (detail) => detail.id === addon
            );
            if (addonDetail) {
              return (
                <option key={addon} value={addon}>
                  {addonDetail.name}
                </option>
              );
            }
            return null;
          })}
        </select>
        <button onClick={addAddon}>Add Addon</button>
      </div>
      {addons.map((addon, index) => {
        const details = addonDetails.find((detail) => detail.id === addon.id);
        return (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <span>{details?.name}</span>
              <button
                onClick={() => removeAddon(index)}
                className={styles.deleteButton}
              >
                ✖
              </button>
            </div>
            <div className={styles.cardBody}>
              {details?.options?.map((option) => (
                <div key={option.id} className={styles.option}>
                  <label>
                    {option.label}
                    {option.required && (
                      <span className={styles.required}>
                        <small>
                          <em>*Required Field</em>
                        </small>
                      </span>
                    )}
                    {option.type === 'checkbox' && (
                      <input
                        type="checkbox"
                        checked={addon.options[option.id] === true}
                        onChange={(e) =>
                          updateOption(
                            index,
                            option.id,
                            e.target.checked
                          )
                        }
                        className={styles.checkbox}
                      />
                    )}
                  </label>
                  {option.description && <small>{option.description}</small>}
                  {option.type === 'text' && (
                    <input
                      type="text"
                      value={addon.options[option.id] as string || '' }
                      onChange={(e) =>
                        updateOption(index, option.id, e.target.value ? e.target.value : undefined)
                      }
                      className={styles.textInput}
                    />
                  )}
                  {option.type === 'number' && (
                    <input
                      type="number"
                      value={addon.options[option.id] as number}
                      onChange={(e) =>
                        updateOption(index, option.id, e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      className={styles.textInput}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AddonsList;
