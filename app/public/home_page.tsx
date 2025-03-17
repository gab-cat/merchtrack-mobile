import { ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-[#f8f8f8]">

      {/* Header - will turn to component */}
      <View className="flex-row justify-between items-center p-4 bg-white">
        <Text className="text-lg font-bold">MerchTrack</Text>
        <TouchableOpacity>
          <Ionicons name="cart" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-white mx-4 my-2 p-2 rounded-lg shadow-sm">
        <Ionicons name="search" size={20} color="gray" />
        <Text className="ml-2 text-gray-500">Search for products...</Text>
      </View>

      {/* Main display - will turn to carousel */}
      <View className="mx-4 my-2 rounded-lg overflow-hidden items-center">
        <Image
          source={require('../../assets/images/placeholder-ts.png')}
          className="w-full max-h-full">
        </Image>
      </View>

      {/* Product List - place holder */}
      <Text className="text-xl font-bold mx-4 my-2">Featured Products</Text>
      <View className="flex-row flex-wrap px-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <View key={item} className="w-1/2 p-2">
            <View className="h-[300] bg-white rounded-lg p-4 shadow-sm items-center">
              <Image
                source={require('../../assets/images/placeholder-ts.png')}
                className="max-w-[200] max-h-[200]"
                resizeMode="contain"
              />
              <Text className="mt-2 text-lg font-semibold">Intramurals COCS T-shirt</Text>
              <Text className="text-gray-500">₱500</Text>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}