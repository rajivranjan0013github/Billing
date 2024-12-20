import { useState } from 'react'
import { Button } from "../../ui/button"
import ProductSelector from '../inventory/SelectInventoryItem';

export default function PurchaseTable() {
  const [products, setProducts] = useState([]);
  const [inventorySelected, setInventorySelected] = useState({});
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);

  const [newProduct, setNewProduct] = useState({})
  // some inputs

  const handleInputChange = (field, value) => {
    setNewProduct(prev => ({...prev, [field]: value}))
  }
  const handleAdd = () => {
    if (!newProduct.product) return
    console.log(newProduct);    
  }

  return (
    <div className="w-full">

      <div className="grid grid-cols-20 w-full space-x-1">
        <div className='w-[5px]'>#</div>
        <div className='col-span-3 space-y-2'>
          <p className='text-xs font-semibold'>PRODUCT</p>
          <input onChange={(e) => handleInputChange('product', e.target.value)} value={newProduct.product || ''} type="text" placeholder="Type or Press Space" className='h-8 w-full border-[1px] border-gray-300 px-2' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>HSN</p>
          <input onChange={(e) => handleInputChange('HSN', e.target.value)} value={newProduct.HSN || ''}  type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2 col-span-2'>
          <p className='text-xs font-semibold'>BATCH</p>
          <input type="text" onChange={(e) => handleInputChange('batchNumber', e.target.value)} value={newProduct.batchNumber || ''} placeholder="batch no" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>EXPIRY</p>
          <input onChange={(e) => handleInputChange('expiry', e.target.value)} value={newProduct.expiry || ''} type="text" placeholder="MM/YY" className='h-8 w-full border-[1px] border-gray-300 px-2' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>PACK</p>
          <input onChange={(e) => handleInputChange('pack', e.target.value)} value={newProduct.pack || ''} type="text" placeholder="1*" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>QTY</p>
          <input onChange={(e) => handleInputChange('quantity', e.target.value)} value={newProduct.quantity || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>FREE</p>
          <input onChange={(e) => handleInputChange('free', e.target.value)} value={newProduct.free || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>MRP</p>
          <input onChange={(e) => handleInputChange('mrp', e.target.value)} value={newProduct.mrp || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>RATE</p>
          <input onChange={(e) => handleInputChange('purchaseRate', e.target.value)} value={newProduct.purchaseRate || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>P-T-R</p>
          <input onChange={(e) => handleInputChange('ptr', e.target.value)} value={newProduct.ptr || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>SCHEME</p>
          <div className='flex'>
            <input type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
            +
            <input type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
          </div>
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>SCH%</p>
          <input onChange={(e) => handleInputChange('schPercent', e.target.value)} value={newProduct.schPercent || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>DISC</p>
          <input onChange={(e) => handleInputChange('discount', e.target.value)} value={newProduct.discount || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>GST</p>
          <input onChange={(e) => handleInputChange('gstPer', e.target.value)} value={newProduct.gstPer || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>AMT</p>
          <input onChange={(e) => handleInputChange('amount', e.target.value)} value={newProduct.amount || ''} type="text" placeholder="" className='h-8 w-full border-[1px] border-gray-300 px-1' />
        </div>
        <div className='space-y-2'>
          <p className='text-xs font-semibold'>EDIT ALL</p>
         <Button onClick={handleAdd} className='h-8'>Add</Button>
        </div>
      </div>
    </div>
  )
}

