import React, { useState, useRef, useEffect } from 'react';
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

const predefinedReasons = [
  "Urinary tract infection (UTI)",
  "Blood in urine",
  "Kidney stones",
  "Frequent urination",
  "Difficulty urinating",
  "Incontinence",
  "Overactive bladder",
  "Prostate issues",
  "Erectile dysfunction",
  "Male infertility",
  "Testicular pain",
  "Bladder cancer screening",
  "Kidney cancer screening",
  "Pelvic pain",
];

export default function CustomInput({ setReasons, reasons }) {
//   const [reasons, setReasons] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addReason(inputValue.trim());
    } else if (e.key === 'Backspace' && inputValue === '' && reasons.length > 0) {
      removeReason(reasons[reasons.length - 1]);
    }
  };

  const addReason = (reason) => {
    if (!reasons.includes(reason)) {
      setReasons([...reasons, reason]);
      setInputValue('');
      setIsFocused(true);
    }
  };

  const removeReason = (reason) => {
    setReasons(reasons.filter(r => r !== reason));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target) && !event.target.closest('.badge')) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-1" ref={containerRef}>
      <div 
        className="relative flex flex-wrap gap-2 border border-gray-300 rounded-md pl-2 pt-2 pb-2 h-[110px] bg-white shadow-sm w-full" 
        onClick={() => { setIsFocused(true); inputRef.current.focus(); }}
      >
        <ScrollArea className="flex flex-wrap gap-2 h-[100px] w-full cursor-pointer">
        <div className="flex flex-wrap gap-2 w-full">
        {reasons.map((reason, index) => (
          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); removeReason(reason); }}>
            {reason} ✕
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          style={{fontSize : "14px"}}
          placeholder={reasons.length === 0 ? "Type a reason and press Enter" : ""}
          className="flex-grow outline-none bg-transparent placeholder-gray-500"
        />
        </div>
        </ScrollArea>
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 90 }}
              animate={{ opacity: 1, y: 100 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.2 }}
              className="absolute z-10 w-full left-0"
            >
              <ScrollArea className="h-40 w-full border rounded-md p-2 mt-2 bg-white shadow-lg">
                <div className="flex flex-wrap gap-2">
                  {predefinedReasons.map((reason, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => addReason(reason)}>
                      {reason}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}