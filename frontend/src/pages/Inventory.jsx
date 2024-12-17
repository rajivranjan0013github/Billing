import React, { useState } from 'react'
import InventoryList from '../components/custom/stock/InventoryList'
import InventoryDetails from '../components/custom/stock/InventoryDetails'

const Inventory = () => {
  const [selectedItemId, setSelectedItemId] = useState(null);

  return (
    <div className='grid grid-cols-7 gap-4 h-[100vh]'>
      <div className='col-span-2 h-[100vh]'>
        <InventoryList onItemSelect={setSelectedItemId} selectedItemId={selectedItemId} />
      </div>
      <div className='col-span-5 h-[100vh]'>
        <InventoryDetails itemId={selectedItemId} />
      </div>
    </div>
  )
}

export default Inventory