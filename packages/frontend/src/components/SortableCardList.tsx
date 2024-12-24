import React, { useState, useEffect } from 'react';
import styles from './SortableCardList.module.css';

interface SortableCardListProps {
  items: string[];
  selectedItems: string[];
  onUpdate: (updatedItems: string[]) => void;
}

const SortableCardList: React.FC<SortableCardListProps> = ({ items, selectedItems, onUpdate }) => {
  const [currentItems, setCurrentItems] = useState<string[]>(items);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);

  useEffect(() => {
    const enabledItems = currentItems.filter(item => !disabledItems.includes(item));
    onUpdate(enabledItems);
  }, [currentItems, disabledItems, onUpdate]);


  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...currentItems];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(direction === 'up' ? index - 1 : index + 1, 0, movedItem);
    setCurrentItems(newItems);
  };

  const toggleItem = (item: string) => {
    if (disabledItems.includes(item)) {
      setDisabledItems(disabledItems.filter(disabledItem => disabledItem !== item));
    } else {
      setDisabledItems([...disabledItems, item]);
    }
  };

  return (
    <div className={styles.container}>
      {currentItems.map((item, index) => (
        <div key={item} className={`${styles.card} ${disabledItems.includes(item) ? styles.disabled : ''}`}>
<div className={styles.actions}>
            {index > 0 && (
              <button
                className=  {styles.arrowButton}
                onClick={() => moveItem(index, 'up')}
                disabled={disabledItems.includes(item)}
              >
                <svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="32px" height="32px" viewBox="0 0 96.154 96.154" xmlSpace="preserve" stroke="#ffffff" transform="matrix(1, 0, 0, -1, 0, 0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M0.561,20.971l45.951,57.605c0.76,0.951,2.367,0.951,3.127,0l45.956-57.609c0.547-0.689,0.709-1.716,0.414-2.61 c-0.061-0.187-0.129-0.33-0.186-0.437c-0.351-0.65-1.025-1.056-1.765-1.056H2.093c-0.736,0-1.414,0.405-1.762,1.056 c-0.059,0.109-0.127,0.253-0.184,0.426C-0.15,19.251,0.011,20.28,0.561,20.971z"></path> </g> </g></svg>
              </button>
            )}
            {index < currentItems.length - 1 && (
              <button
                className={styles.arrowButton}
                onClick={() => moveItem(index, 'down')}
                disabled={disabledItems.includes(item)}
              >
                <svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"  width="32px" height="32px" viewBox="0 0 96.154 96.154" stroke="#ffffff"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M0.561,20.971l45.951,57.605c0.76,0.951,2.367,0.951,3.127,0l45.956-57.609c0.547-0.689,0.709-1.716,0.414-2.61 c-0.061-0.187-0.129-0.33-0.186-0.437c-0.351-0.65-1.025-1.056-1.765-1.056H2.093c-0.736,0-1.414,0.405-1.762,1.056 c-0.059,0.109-0.127,0.253-0.184,0.426C-0.15,19.251,0.011,20.28,0.561,20.971z"></path> </g> </g></svg>
              </button>
            )}
          </div>
          <span>
            <p style={{ fontSize: '1.2em' }}>{item}</p>
          </span>
          <input
            type="checkbox"
            checked={!disabledItems.includes(item)}
            onChange={() => toggleItem(item)}
            className={styles.checkbox}
          />
          
        </div>
      ))}
    </div>
  );
};

export default SortableCardList;