import { create } from 'zustand';

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  notes?: string;
  variantName?: string;
}

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  
  addItem: (newItem) => set((state) => {
    // Check if item already exists with same product and variant
    const existingItemIndex = state.items.findIndex(
      item => item.productId === newItem.productId && 
             item.variantId === newItem.variantId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const updatedItems = [...state.items];
      updatedItems[existingItemIndex].quantity += newItem.quantity;
      return { items: updatedItems };
    } else {
      // Add new item with unique ID
      const id = `${newItem.productId}-${newItem.variantId || 'default'}-${Date.now()}`;
      return { items: [...state.items, { ...newItem, id }] };
    }
  }),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),
  
  updateQuantity: (id, quantity) => set((state) => ({
    items: state.items.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, quantity) } 
        : item
    )
  })),
  
  updateNotes: (id, notes) => set((state) => ({
    items: state.items.map(item => 
      item.id === id ? { ...item, notes } : item
    )
  })),
  
  clearCart: () => set({ items: [] }),
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => 
      total + (item.price * item.quantity), 0);
  },
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => 
      total + item.quantity, 0);
  }
})); 