import React, { useState } from 'react'

const Settings = () => {
  const [qty, setQty] = useState('');
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !qty.includes(':')) {
      setQty(prev => prev + ':');
    }
  };
  
  return (
    <div>
     <input 
       type="text" 
       value={qty} 
       onChange={(e) => setQty(e.target.value)}
       onKeyDown={handleKeyDown}
     />
    </div>
  )
}

export default Settings