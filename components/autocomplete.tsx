import React, { useState } from 'react';

// Define the type for the props
interface AutocompleteProps {
  items: string[];
  setSelected: (name:string) => void;   
}

const Autocomplete: React.FC<AutocompleteProps> = ({ items, setSelected }) => {
  const [query, setQuery] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<string[]>([]);

  // Handle input change and filter items
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setQuery(input);
    if (input) {
      const filtered = items.filter(item =>
        item.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  };

  // Handle item selection
  const handleSelect = (item: string) => {
    setQuery(item);
    setFilteredItems([]);
    setSelected(item);
  };

  return (
    <div className="autocomplete-container">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Buscar piloto..."
      />
      {filteredItems.length > 0 && (
        <ul className="autocomplete-list">
          {filteredItems.map((item, index) => (
            <li key={index} onClick={() => handleSelect(item)}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
