"use client"; 

import { useState } from "react";
import AnimatedList from "./AnimatedList";

interface DropdownProps {
  label: string;             
}

export default function GranPrixDropdown({ label }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(label);

  return (
    <div className="relative inline-block text-left">
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-300"
      >
        {selectedLabel} ▾
      </button>

      {open && (
        <div className="absolute mt-2 w-48 rounded-lg shadow-lg z-10">
          <AnimatedList
          items= {['México', 'De las Américas', 'Brasil', 'Miami', 'Las Vegas', 'Abu Dabi', 'Catar', 'Bareín', 'Emilia-Romaña', 'Italia']}
          onItemSelect={(item, index) => {
                console.log(item, index)
                setSelectedLabel(item)
                setOpen(!open)
            }
          }
          showGradients={true}
          enableArrowNavigation={true}
          displayScrollbar={false}
          />
        </div>
      )}
    </div>
  );
}