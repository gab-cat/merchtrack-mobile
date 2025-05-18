import { View, Text, SafeAreaView, Image, FlatList, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import { useUserStore } from '@/stores/user.store';
import { useUser } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const cartItems = [
  {
    id: '1',
    name: 'Ateneo COCS Intramurals Shirt',
    description: 'Oversize - (L)',
    price: 550.00,
    quantity: 1,
  }
];

const getTotal = () => {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

const MyCart = () => {
  const { user } = useUserStore();

  return (
    <SafeAreaView>     
      {cartItems.length === 0 ? (
        // Cart is empty
      <View>
        <View className='h-full items-center justify-center'>
          <FontAwesome className='my-2' name="shopping-cart" size={48} color="gray" />
          <Text className="text-white text-3xl my-2">
            Your cart is empty
          </Text>
          <Link href="/products" className='text-white text-xl bg-blue-500 border-2 px-4 py-2 my-2 rounded-md'>Continue Shopping</Link>
        </View>
      </View>
      ) : (
      // Cart have items
      <View className='h-full'>
        {/* Cart header */}
        <View className='flex-row border-2 px-4 py-2 items-center'>
          <FontAwesome name="shopping-cart" size={24} color="gray" />
          <Text className='mx-4 text-white text-2xl'>Your Cart</Text>
          <Text className='border rounded-full px-2 py-2 bg-blue-500 text-2xl text-white'>{cartItems.length}</Text>
        </View>
        <View className="bg-white w-full" style={{ height: 1 }}/>

        {/* Scrollable cart contents */}
        <View className='flex-[7]'>        
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center my-2 mx-4 border-2 border-white rounded-md">
                <Image
                  source={require('@/assets/images/placeholder-ts.png')}
                  className="w-24 h-24 mx-4 my-2 rounded"
                  resizeMode="contain"
                />
                <View className="flex-1">
                  <Text className="text-lg text-white font-bold">{item.name}</Text>
                  <Text className="text-lg text-[#dcdcdc]">{item.description}</Text>
                  <View className='flex-row justify-between'>
                    <Text className="text-[#dcdcdc]">Quantity: {item.quantity}</Text>
                    <Text className="text-[#dcdcdc] mx-4">₱{item.price.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            )}
          />
        </View>

        {/* Cart footer */}
        <View className='flex-[2] px-4 py-2 h-full'>
          <View className="bg-white w-full my-2" style={{ height: 1 }}/>
          <View className='flex-row justify-between my-2'>
            <Text className='text-white text-xl'>Selected Items</Text>
            <Text className='text-white text-xl'>{cartItems.length}</Text>
          </View>
          <View className='flex-row justify-between my-2'>
            <Text className='text-white text-3xl font-bold'>Subtotal:</Text>
            <Text className='text-white text-3xl font-bold'>₱{getTotal().toFixed(2)}</Text>
          </View>
        </View>

      </View>
      )}
    </SafeAreaView>
  )
}

export default MyCart