import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../ui/dialog'
import { Input } from '../../../ui/input'
import { Button } from '../../../ui/button'
import { Label } from '../../../ui/label'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { Textarea } from '../../../ui/textarea'

const SupplierRegDialog = ({ open, setOpen, onAddSupplier }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    itemsOffered: [],
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.itemsOffered]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    if (field === 'type' && value !== 'Other') {
      updatedItems[index].otherType = ''
    }
    setFormData({ ...formData, itemsOffered: updatedItems })
  }

  const addItem = () => {
    setFormData({
      ...formData,
      itemsOffered: [...formData.itemsOffered, { name: '', mrp: '', type: '', discount: '' }]
    })
  }

  const removeItem = (index) => {
    const updatedItems = formData.itemsOffered.filter((_, i) => i !== index)
    setFormData({ ...formData, itemsOffered: updatedItems })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newSupplier = {
      ...formData,
      id: `SID${Math.floor(Math.random() * 1000)}`,
      lastPurchased: 'N/A',
      totalPurchaseValue: 0,
      orders: [],
    }
    onAddSupplier(newSupplier)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className=" font-semibold">Supplier Registration</DialogTitle>
          <DialogDescription>Enter details to reegister a new supplier</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
       <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              required 
              className="h-20"
            />
          </div>
          </div>
          <div className="space-y-2">
            <Label>Items Offered</Label>
            {formData.itemsOffered.map((item, index) => (
              <div key={index} className="flex space-x-2 items-end">
                <div className="flex-1 space-y-2">
                  <Input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="number"
                    placeholder="MRP"
                    value={item.mrp}
                    onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="text"
                    placeholder="Type"
                    value={item.type}
                    onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                    required
                    list={`type-suggestions-${index}`}
                  />
                  <datalist id={`type-suggestions-${index}`}>
                    <option value="Tablet" />
                    <option value="Capsule" />
                    <option value="Injection" />
                  </datalist>
                </div>
                {item.type === 'Other' && (
                  <div className="flex-1 space-y-2">
                    <Input
                      type="text"
                      placeholder="Specify type"
                      value={item.otherType || ''}
                      onChange={(e) => handleItemChange(index, 'otherType', e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    type="number"
                    placeholder="Discount %"
                    value={item.discount}
                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                    required
                  />
                </div>
                <Button type="button" variant="destructive" onClick={() => removeItem(index)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <PlusIcon className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
          <Button type="submit" className="w-full">Register Supplier</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SupplierRegDialog