import React, {useState, useEffect, useRef} from 'react'

const Settings = ({conversionRate,qtyValue, setQtyValue}) => {
  const [firstNumber, setFirstNumber] = useState('');
  const [secondNumber, setSecondNumber] = useState('');
  const firstInputRef = useRef(null);
  const secondInputRef = useRef(null);
  
  // Add a ref to track if the update is from internal state change
  const isInternalUpdate = useRef(false);

  // Check if conversion rate is valid (greater than 1)
  const isValidConversionRate = conversionRate && conversionRate > 1;

  // Update combined value whenever inputs change
  useEffect(() => {
    if (!isInternalUpdate.current) return;
    
    const first = firstNumber === '' ? '0' : parseInt(firstNumber);
    const second = secondNumber === '' ? '0' : parseInt(secondNumber);
    
    if (isValidConversionRate) {
      setQtyValue(`${first}:${second}`);
    } else {
      setQtyValue(`${first}`);
    }
    
    isInternalUpdate.current = false;
  }, [firstNumber, secondNumber, isValidConversionRate, setQtyValue]);

  // Handle incoming qtyValue prop
  useEffect(() => {
    if (!qtyValue) return;
    
    const [first, second] = qtyValue.split(':');
    if (first !== firstNumber || second !== secondNumber) {
      setFirstNumber(first || '');
      setSecondNumber(second || '');
    }
  }, [qtyValue]);

  const handleFirstNumberChange = (e) => {
    isInternalUpdate.current = true;
    setFirstNumber(e.target.value);
  };

  const handleFirstNumberKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      secondInputRef.current?.focus();
    }
  };

  const handleSecondNumberChange = (e) => {
    if (!isValidConversionRate) return;

    isInternalUpdate.current = true;
    const newValue = e.target.value;
    
    if (newValue === '') {
      setSecondNumber('');
      return;
    }

    const parsedValue = parseInt(newValue);
    
    if (isNaN(parsedValue)) {
      setSecondNumber('');
      return;
    }

    if (parsedValue >= conversionRate) {
      const additionalFirst = Math.floor(parsedValue / conversionRate);
      const remainingSecond = parsedValue % conversionRate;
      
      setFirstNumber(prev => {
        const currentFirst = parseInt(prev) || 0;
        return (currentFirst + additionalFirst).toString();
      });
      
      setSecondNumber(remainingSecond.toString());
    } else if (parsedValue < 0) {
      // Handle negative input
      const currentFirst = parseInt(firstNumber) || 0;
      if (currentFirst > 0) {
        setFirstNumber((currentFirst - 1).toString());
        setSecondNumber((conversionRate + parsedValue).toString());
      } else {
        // If first number is 0, don't allow negative values
        setSecondNumber('0');
      }
    } else {
      setSecondNumber(parsedValue.toString());
    }
  };

  const handleSecondNumberKeyDown = (e) => {
    if (e.key === 'Backspace' && !secondNumber) {
      e.preventDefault();
      firstInputRef.current?.focus();
    }
  };

  return (
    <div className="inline-flex  items-center border border-gray-300 rounded-md bg-white px-2">
      <input 
        ref={firstInputRef}
        type="number" 
        value={firstNumber}
        onChange={handleFirstNumberChange}
        onKeyDown={isValidConversionRate ? handleFirstNumberKeyDown : undefined}
        placeholder="0"
        className="w-10 border-none outline-none text-center focus:ring-0"
      />
      {isValidConversionRate && (
        <>
          <span className="text-gray-500">:</span>
          <input 
            ref={secondInputRef}
            type="number"
            value={secondNumber}
            onChange={handleSecondNumberChange}
            onKeyDown={handleSecondNumberKeyDown}
            placeholder="0"
            className="w-10 border-none outline-none text-center focus:ring-0"
          />
        </>
      )}
    </div>
  )
}

export default Settings