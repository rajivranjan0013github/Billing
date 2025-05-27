import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Input } from "../../ui/input";
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers } from '../../../redux/slices/CustomerSlice';
import { ScrollArea } from "../../ui/scroll-area";
import CreateCustomerDialog from '../customer/CreateCustomerDialog';

const CustomerSuggestion = forwardRef(({ placeholder, value, setValue, onSuggestionSelect, onKeyDown, onNewCustomerClick, disabled }, ref) => {
  const dispatch = useDispatch();
  const { customers, status } = useSelector((state) => state.customers);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionListRef = useRef(null);

  useEffect(() => {
    if(status === 'idle') {
        dispatch(fetchCustomers());
    }
  }, [dispatch]);

  useEffect(() => {
    const filtered = customers.filter(customer => customer.name.toLowerCase().includes((value || '').toLowerCase()));
    const newCustomer = {name : value, index : 'new'}
    setFilteredSuggestions([...filtered, newCustomer]);
    if(value.length >= 3) {
      setSelectedIndex(0);
    } else {
      setSelectedIndex(-1);
    }
  }, [value, customers]);

  const handleInputChange = (e) => {
    setValue(e.target.value);
    setShowSuggestions(e.target.value.length >= 3);
  };

  const handleSuggestionClick = (customer) => {
    setValue(customer.name);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(customer);
    }
    if (ref && ref.current) {
      ref.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        setValue(filteredSuggestions[selectedIndex].name);
        setShowSuggestions(false);
        if(onSuggestionSelect){
          onSuggestionSelect(filteredSuggestions[selectedIndex]);
        }
      } else {
        if (onKeyDown) {
          onKeyDown(e);
        }
      }
    } else if (e.key === "F2") {
      e.preventDefault();
      if (onNewCustomerClick) {
        onNewCustomerClick();
      }
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionListRef.current) {
      const selectedElement = suggestionListRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= 3) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder || "Search customer"}
          className="h-8 w-full border-[1px] border-gray-300 px-2"
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-10 w-[600px] mt-1 bg-white border border-gray-300 rounded-sm shadow-lg">
            <div className='w-full grid grid-cols-6 border-b-[1px] border-muted-foreground px-4 py-2'>
                <div className='col-span-2 text-xs '>Customer Name</div>
                <div className='text-xs '>Mob Number</div>
                <div className='text-xs '>Address</div>
                <div className='text-xs text-center '>Balance</div>
                <div className='text-xs text-center'>Last Purchased</div>
            </div>
          <ScrollArea className={`${filteredSuggestions.length > 5 ? 'h-[300px]' : 'max-h-300'} pr-2`}>
              <ul ref={suggestionListRef}>
                {filteredSuggestions.map((suggestion, index) => (
                  <li
                    key={suggestion._id || index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full grid grid-cols-6 border-b-[1px] border-muted px-4 py-2 hover:bg-blue-200 ${index === selectedIndex ? 'bg-blue-200' : ''}`}
                  >
                      <div className={`text-sm uppercase ${suggestion?.index === 'new' ? 'col-span-4 text-primary' : 'col-span-2'} `}>{suggestion?.index === 'new' ? `Create New Cusomter "${suggestion?.name}"` : suggestion?.name }</div>
                      <div className='text-sm'>{suggestion?.mob}</div>
                      <div className={`text-xs ${suggestion?.index === 'new' ? 'text-primary text-end' : ''}`}>{suggestion?.index === 'new' ? 'Press :  ALT+N' : suggestion?.address}</div>
                      <div className='text-sm text-center'>{suggestion?.balance}</div>
                      <div className='text-sm text-center'>{suggestion?.lastInvoice}</div>
                    </li>
                ))}
              </ul>
          </ScrollArea>
        </div>
      )}
    </div>
  );
});

// New wrapper component that handles the create customer dialog
export const CustomerSuggestionWithDialog = forwardRef(({ placeholder, value, setValue, onSuggestionSelect, onKeyDown, disabled=false }, ref) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  const handleSuggestionSelect = (customer) => {
    if (customer.index === 'new') {
      setNewCustomerName(value);
      setShowCreateDialog(true);
    } else {
      onSuggestionSelect?.(customer);
    }
  };

  const handleCreateSuccess = (newCustomer) => {
    setValue(newCustomer.name);
    onSuggestionSelect?.(newCustomer);
    setShowCreateDialog(false);
  };

  const handleNewCustomerClick = () => {
    setNewCustomerName(value);
    setShowCreateDialog(true);
  };

  return (
    <>
      <CustomerSuggestion
        ref={ref}
        placeholder={placeholder}
        value={value}
        setValue={setValue}
        onSuggestionSelect={handleSuggestionSelect}
        onKeyDown={onKeyDown}
        onNewCustomerClick={handleNewCustomerClick}
        disabled={disabled}
      />
      <CreateCustomerDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
        initialData={{ name: newCustomerName }}
      />
    </>
  );
});

export default CustomerSuggestion;