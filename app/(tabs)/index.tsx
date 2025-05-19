import React from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, FadeInRight, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { useApiClient } from '@/lib/api';
import { ApiResponse } from '@/types/common';
import { Category, Product } from '@prisma/client';
import { useUserStore } from '@/stores/user.store';
import { useRolePricing } from '@/utils/use-role-pricing';
import { parseHtmlForDisplay } from '@/utils/html-parser';

// Format currency as Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Extended Product interface with required properties
interface ExtendedProduct extends Product {
  category?: Category;
  price: number;
  rolePricing?: Record<string, number>;
  variants?: Array<{
    id: string;
    price: number | string;
    inventory: number;
    variantName: string;
    rolePricing: Record<string, number> | unknown;
  }>;
  postedBy?: {
    college?: string;
  };
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const { user } = useUserStore();
  
  const api = useApiClient();
  
  // Featured products query
  const { data: featuredProducts, isLoading: isLoadingFeatured, refetch: refetchFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await api.post('/products', {
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { 
          category: true,
          variants: true,
          postedBy: {
            select: { college: true }
          }
        }
      });
      return (response as ApiResponse<ExtendedProduct[]>).data;
    }
  });

  // Categories query
  const { data: categories, isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.post('/categories', {});
      return (response as ApiResponse<Category[]>).data;
    }
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeatured(), refetchCategories()]);
    setRefreshing(false);
  }, [refetchFeatured, refetchCategories]);

  // Function to get pricing for a product
  const getPricing = (product: ExtendedProduct) => {
    try {
      // If the product has variants, process them
      if (product.variants && product.variants.length > 0) {
        // Get pricing for each variant
        const variantPricings = product.variants.map(variant => {
          return useRolePricing({
            variant: {
              price: Number(variant.price),
              rolePricing: variant.rolePricing as unknown as Record<string, number> || {}
            },
            customerRole: user?.role as string | null,
            customerCollege: user?.college as string | null,
            productPostedByCollege: product.postedBy?.college || null
          });
        });

        // Find the lowest and highest prices
        const prices = variantPricings.map(p => p.price);
        const lowestPrice = Math.min(...prices);
        const highestPrice = Math.max(...prices);
        
        // Check if all variants have the same role pricing applied
        const allSameRole = variantPricings.every(p => p.appliedRole === variantPricings[0].appliedRole);
        const commonAppliedRole = allSameRole ? variantPricings[0].appliedRole : "OTHERS";
        
        // If all variants have the same price, display a single price
        if (lowestPrice === highestPrice) {
          return {
            price: lowestPrice,
            appliedRole: commonAppliedRole,
            formattedPrice: formatCurrency(lowestPrice),
            originalPrice: undefined
          };
        }
        
        // Otherwise, display a price range
        return {
          price: lowestPrice, // Use lowest price as the base price
          appliedRole: commonAppliedRole,
          formattedPrice: `${formatCurrency(lowestPrice)} - ${formatCurrency(highestPrice)}`,
          originalPrice: undefined,
          isRange: true
        };
      }
      
      // If no variants, use the main product price
      return useRolePricing({
        variant: { 
          price: product?.price ? Number(product.price) : 0,
          rolePricing: product.rolePricing as unknown as Record<string, number> || {}
        },
        customerRole: user?.role as string | null,
        customerCollege: user?.college as string | null,
        productPostedByCollege: product.postedBy?.college || null
      });
    } catch (error) {
      // In case of any error, return a default pricing object
      console.warn("Error calculating price:", error);
      return {
        price: 0,
        appliedRole: "OTHERS",
        formattedPrice: formatCurrency(0),
        originalPrice: undefined
      };
    }
  };

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6 bg-neutral-50 dark:bg-neutral-900"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2C59DB"]} tintColor={"#2C59DB"} />
        }
      >
        {/* Animated Banner Section */}
        <Animated.View 
          className="px-4 py-5 bg-primary rounded-b-3xl shadow-lg"
          entering={FadeIn.duration(600)}
        >
          <Animated.View 
            className="flex-row justify-between items-center mb-4"
            entering={FadeInDown.delay(200).springify()}
          >
            <View className="flex-row items-center">
              <FontAwesome name="home" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-2xl font-bold text-white">Welcome Back!</Text>
            </View>
            <Link href="/modal" asChild>
              <TouchableOpacity className="p-2 bg-white/20 rounded-full">
                <FontAwesome name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </Link>
          </Animated.View>
          
          <Animated.View 
            className="bg-white/10 rounded-xl p-4 mb-2"
            entering={SlideInUp.delay(300).springify()}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg mb-2">Discover New Merchandise</Text>
                <Text className="text-white/70 text-sm mb-4">Exclusive collection with limited stock available now!</Text>
                <Link href="/(tabs)/products" asChild>
                  <Button
                    title="Shop Now"
                    icon="arrow-right"
                    iconPosition="right"
                    variant="outline"
                    size="sm"
                    className="bg-white border-0 self-start"
                    onPress={() => {}}
                  />
                </Link>
              </View>
              <Animated.View entering={ZoomIn.delay(500)}>
                <Image 
                  source={{ uri: 'https://placehold.co/120x120/png' }}
                  className="w-24 h-24 rounded-lg"
                />
              </Animated.View>
            </View>
          </Animated.View>
        </Animated.View>
        
        {/* Featured Products */}
        <Animated.View 
          className="px-4 mt-6"
          entering={FadeIn.delay(400)}
        >
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <FontAwesome name="star" size={18} color="#2C59DB" style={{ marginRight: 8 }} />
              <Text className="text-xl font-bold text-neutral-800 dark:text-white">Featured Products</Text>
            </View>
            <Link href="/(tabs)/products" asChild>
              <Button
                title="View All"
                icon="chevron-right"
                iconPosition="right"
                variant="outline"
                size="sm"
                onPress={() => {}}
                className="border-0"
              />
            </Link>
          </View>
          
          {isLoadingFeatured ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#2C59DB" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="pb-2"
            >
              {featuredProducts?.map((product, index) => {
                const pricing = getPricing(product);
                
                return (
                  <Animated.View 
                    key={product.id}
                    entering={FadeInRight.delay(400 + (index * 100)).springify()}
                  >
                    <Link 
                      href={`/product/${product.slug}`}
                      asChild
                    >
                      <TouchableOpacity className="mr-3 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-sm overflow-hidden">
                        <Image
                          source={{ uri: product.imageUrl[0] || 'https://placehold.co/300x300/png' }}
                          className="w-full h-40 object-cover"
                          resizeMode="cover"
                        />
                        <View className="p-3">
                          <Text className="font-semibold text-neutral-800 dark:text-white" numberOfLines={1}>
                            {product.title}
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5" numberOfLines={1}>
                            {product.description ? parseHtmlForDisplay(product.description) : 'No description available'}
                          </Text>
                          <View className="flex-row items-center mt-1.5">
                            <Text className={`text-primary dark:text-blue-400 font-extrabold ${pricing.isRange ? 'text-sm' : 'text-base'}`}>
                              {pricing.formattedPrice}
                            </Text>
                            {pricing.originalPrice && pricing.originalPrice !== pricing.formattedPrice && (
                              <Text className="text-neutral-500 dark:text-neutral-400 text-xs ml-1.5 line-through">
                                {pricing.originalPrice}
                              </Text>
                            )}
                          </View>
                          {pricing.appliedRole !== 'OTHERS' && (
                            <View className="bg-green-100 dark:bg-green-900 rounded-md px-1.5 py-0.5 mt-1 self-start">
                              <Text className="text-[10px] text-green-700 dark:text-green-300 font-medium">
                                {pricing.appliedRole} pricing
                              </Text>
                            </View>
                          )}
                          {product.category && (
                            <View className="flex-row items-center mt-1.5 bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full self-start">
                              <FontAwesome name="tag" size={8} color="#2C59DB" />
                              <Text className="text-primary dark:text-blue-400 text-xs font-medium ml-1">
                                {product.category.name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </Link>
                  </Animated.View>
                );
              })}
              
              {!featuredProducts || featuredProducts.length === 0 && (
                <View className="flex-1 items-center justify-center py-8">
                  <FontAwesome name="exclamation-circle" size={24} color="#ADB5BD" className="mb-2" />
                  <Text className="text-neutral-500 dark:text-neutral-400">No featured products available</Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>
        
        {/* Categories */}
        <Animated.View 
          className="px-4 mt-8"
          entering={FadeIn.delay(600)}
        >
          <View className="flex-row items-center mb-4">
            <FontAwesome name="th-large" size={18} color="#2C59DB" style={{ marginRight: 8 }} />
            <Text className="text-xl font-bold text-neutral-800 dark:text-white">
              Shop by Category
            </Text>
          </View>
          
          {isLoadingCategories ? (
            <View className="items-center justify-center py-6">
              <ActivityIndicator size="large" color="#2C59DB" />
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {categories?.map((category, index) => (
                <Animated.View 
                  key={category.id}
                  className="w-[48%] mb-4"
                  entering={FadeInDown.delay(600 + (index * 75)).springify()}
                >
                  <Link 
                    href={`/(tabs)/products?categoryId=${category.id}`} 
                    asChild
                  >
                    <TouchableOpacity className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-700">
                      <Image
                        source={{ uri: 'https://placehold.co/200x100/png' }}
                        className="w-full h-24 object-cover"
                      />
                      <View className="p-3 flex-row justify-between items-center">
                        <Text className="font-medium text-neutral-800 dark:text-white">
                          {category.name}
                        </Text>
                        <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                          <FontAwesome name="chevron-right" size={10} color="#2C59DB" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                </Animated.View>
              ))}
              
              {!categories || categories.length === 0 && (
                <View className="flex-1 items-center justify-center py-8">
                  <FontAwesome name="exclamation-circle" size={24} color="#ADB5BD" className="mb-2" />
                  <Text className="text-neutral-500 dark:text-neutral-400">No categories available</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </>
  );
}
