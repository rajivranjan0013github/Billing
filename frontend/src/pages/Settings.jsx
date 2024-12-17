import React, { useState, useRef } from 'react'
import ProductSelector from '../components/custom/inventory/SelectInventoryItem'
import { Input } from '../components/ui/input'

const Settings = () => {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInputChange = (e) => {
    const value = e.target.value; 
    if (value.length > 0) {
      if(value[0] !== ' ') {
        setSearch(value); 
      }
      setIsDialogOpen(true);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedItem(product);
    setSearch(product.name);
    console.log(product);
  };

  return (
    <div>
      <p>Item Name:</p>
      <Input 
        type="text" 
        placeholder="Search" 
        value={search} 
        onChange={handleInputChange}
      />
      <ProductSelector 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSelect={handleProductSelect}
        search={search}
        setSearch={setSearch} 
      />
    </div>
  )
}

export default Settings