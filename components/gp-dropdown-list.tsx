"use client"; 

import { useEffect, useRef, useState } from "react";
import AnimatedList from "./animatedList";

interface DropdownProps {
  label: string; 
  listaGP: string[];     
  setSelected: (name:string) => void;       
}

export default function GranPrixDropdown({ label , listaGP, setSelected}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedLabel, setSelectedLabel] = useState(label);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    // Set up the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-300"
      >
        {selectedLabel} ▾
      </button>

      {open && (
        <div className="absolute mt-2 w-48 rounded-lg shadow-lg z-10">
          <AnimatedList
          items= {listaGP}
          onItemSelect={(item, index) => {
                console.log(item, index)
                setSelectedLabel(item)
                setOpen(!open)
              
                setSelected(item)
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