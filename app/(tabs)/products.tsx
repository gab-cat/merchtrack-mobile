import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, SafeAreaView, RefreshControl, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Link, useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debounce } from 'lodash';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { useApiClient } from '@/lib/api';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { Category, Product as PrismaProduct } from '@prisma/client';
import { ApiResponse, QueryParams } from '@/types/common';
import { useRolePricing } from '@/utils/use-role-pricing';
import { useUserStore } from '@/stores/user.store';
import { parseHtmlForDisplay } from '@/utils/html-parser';

// Define schema for filters
const filterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'oldest']).optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

// Extended Product type to include category and ensure price is a number
interface Product extends PrismaProduct {
  category?: Category;
  price: number; // Ensure price is always a number, handle potential null from DB in query/transform
  rolePricing?: Record<string, number>; // Role-based pricing information
  variants?: Array<{
    id: string;
    price: number | string;
    inventory: number;
    variantName: string;
    rolePricing: Record<string, number> | unknown;
  }>;
  postedBy?: {
    college?: string; // College information for determining pricing
  };
}

// Define a more specific type for the 'where' clause if possible
// For now, using Record<string, any> and will refine later if needed.

export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const params = useLocalSearchParams();
  const api = useApiClient();
  const { user } = useUserStore();


  const { watch, setValue, reset } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      categoryId: params.categoryId as string || undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'newest',
    },
  });
  
  const searchValue = watch('search');
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setValue('search', value);
    }, 500),
    [setValue]
  );
  
  useEffect(() => {
    if (searchValue !== undefined) {
      debouncedSearch(searchValue);
    }
    return () => debouncedSearch.cancel();
  }, [searchValue, debouncedSearch]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<ApiResponse<Category[]>>({
    queryKey: ['categories'],
    queryFn: async () => {
      return api.post<ApiResponse<Category[]>>('/categories', {take: 10} as QueryParams);
    },
  });
  const categories = categoriesData?.data || [];
  const filters = watch();
  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    refetch,
  } = useQuery<ApiResponse<Product[]>>({
    queryKey: ['products', JSON.stringify(filters)], 
    queryFn: async () => {
      const formValues = watch();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {}; 
      
      if (formValues.search) {
        where.OR = [
          { title: { contains: formValues.search, mode: 'insensitive' } },
          { description: { contains: formValues.search, mode: 'insensitive' } },
        ];
      }

      if (formValues.categoryId) {
        where.categoryId = formValues.categoryId;
      }

      if (formValues.minPrice !== undefined || formValues.maxPrice !== undefined) {
        where.price = {};
        if (formValues.minPrice !== undefined) {
          where.price.gte = formValues.minPrice;
        }
        if (formValues.maxPrice !== undefined) {
          where.price.lte = formValues.maxPrice;
        }
      }

      const orderBy: Record<string, string> = {};
      switch (formValues.sortBy) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'oldest':
        orderBy.createdAt = 'asc';
        break;
      default:
        orderBy.createdAt = 'desc';
      }

      return api.post<ApiResponse<Product[]>>('/products', {
        take: 20,
        skip: 0,
        where,
        orderBy,
        include: { 
          category: true,
          variants: true,
          postedBy: {
            select: { college: true }
          }
        }
      } as QueryParams);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleApplyFilters = () => {
    refetch(); 
  };

  const handleClearFilters = () => {
    reset({
      search: '',
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'newest',
    });
    refetch();
  };

  const products = productsResponse?.data || [];
  const metadata = productsResponse?.metadata || { total: 0, hasNextPage: false, hasPreviousPage: false, page: 1, lastPage: 1 };

  // Function to get pricing for a product
  const getPricing = (product: Product) => {
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
            formattedPrice: `₱${lowestPrice.toFixed(2)}`,
            originalPrice: undefined
          };
        }
        
        // Otherwise, display a price range
        return {
          price: lowestPrice, // Use lowest price as the base price
          appliedRole: commonAppliedRole,
          formattedPrice: `₱${lowestPrice.toFixed(2)} - ₱${highestPrice.toFixed(2)}`,
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
        formattedPrice: "₱0.00",
        originalPrice: undefined
      };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Screen options={{ 
        headerShown: false,
      }} />
      
      <Animated.View 
        className="px-4 pt-10 pb-6 bg-primary elevation-3"
        entering={FadeIn}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <FontAwesome name="shopping-bag" size={28} color="#FFFFFF" />
            <Text className="text-3xl font-bold text-white ml-3">Products</Text>
          </View>
        </View>
      </Animated.View>
      
      <Animated.View 
        className="px-4 pt-4 pb-2"
        entering={FadeInDown.springify().delay(100)}
      >
        <View className="flex-row items-center mb-4">
          <View className="flex-1 mr-2 flex-row items-center border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 px-3">
            <FontAwesome name="search" size={16} color={colorScheme === 'dark' ? '#A3A3A3' : '#737373'} className="mr-2"/>
            <TextInput
              placeholder="Search products..."
              value={searchValue}
              onChangeText={(text) => setValue('search', text)}
              className="flex-1 py-2.5 text-base text-neutral-800 dark:text-white"
              placeholderTextColor={colorScheme === 'dark' ? '#A3A3A3' : '#737373'}
            />
          </View>
          <Button
            icon="filter"
            title={showFilters ? "Hide" : "Filter"} 
            variant="outline"
            size="sm"
            onPress={() => setShowFilters(!showFilters)}
            className="border-primary text-primary py-2.5 px-3 rounded-lg"
            iconColor="#2C59DB"
          />
        </View>
        
        {showFilters && (
          <Animated.View entering={FadeInDown} className="mb-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg elevation-2">
            <Text className="text-lg font-semibold mb-3 text-neutral-700 dark:text-neutral-200">Filter Options</Text>
            
            <View className="mb-3">
              <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Sort by:</Text>
              <RNTextInput 
                value={watch('sortBy')}
                onChangeText={(text) => setValue('sortBy', text as FilterValues['sortBy'])}
                placeholder="Sort (newest, oldest, price_asc, price_desc)"
                className="border border-neutral-300 dark:border-neutral-600 rounded-md p-2.5 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm"
                placeholderTextColor={colorScheme === 'dark' ? '#A3A3A3' : '#737373'}
              />
            </View>

            <Button
              title="Apply Filters"
              variant="primary"
              size="sm"
              onPress={handleApplyFilters}
              className="mt-3 w-full py-2.5 rounded-md shadow"
            />
          </Animated.View>
        )}

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="pb-2"
        >
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full elevation-1 ${!watch('categoryId') ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}
            onPress={() => {
              setValue('categoryId', undefined);
            }}
          >
            <Text className={`font-medium ${!watch('categoryId') ? 'text-white' : 'text-neutral-800 dark:text-white'}`}>
              All Categories
            </Text>
          </TouchableOpacity>
          
          {isLoadingCategories && <ActivityIndicator color="#2C59DB" className="mx-auto px-3" />}
          {!isLoadingCategories && categories.map((category: Category) => (
            <TouchableOpacity
              key={category.id}
              className={`mr-2 px-4 py-2 rounded-full elevation-1 ${watch('categoryId') === category.id ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              onPress={() => {
                setValue('categoryId', category.id);
              }}
            >
              <Text className={`font-medium ${watch('categoryId') === category.id ? 'text-white' : 'text-neutral-800 dark:text-white'}`}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
      
      <ScrollView
        className="flex-1 px-2" 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2C59DB"]} tintColor={"#2C59DB"}/>
        }
      >
        <View className="flex-row justify-between items-center mb-4 px-2">
          <Text className="text-sm text-neutral-600 dark:text-neutral-400">
            {isLoadingProducts ? 'Loading products...' : `${metadata.total} Product${metadata.total === 1 ? '' : 's'} Found`}
          </Text>
          {(watch('search') || watch('categoryId') || watch('minPrice') !== undefined || watch('maxPrice') !== undefined) && (
            <TouchableOpacity
              className="flex-row items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-800 active:bg-red-200 dark:active:bg-red-700"
              onPress={handleClearFilters}
            >
              <Text className="text-red-600 dark:text-red-300 mr-1.5 text-xs font-medium">Clear Filters</Text>
              <FontAwesome name="times-circle" size={12} color={colorScheme === 'dark' ? '#FCA5A5' : '#EF4444'} />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingProducts && !refreshing ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#2C59DB" />
            <Text className="text-neutral-500 dark:text-neutral-400 mt-3 text-base">Fetching products...</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap -mx-2"> 
            {products.map((product: Product, index: number) => {
              // Get price information for this product
              const pricing = getPricing(product);
              
              return (
                <Animated.View 
                  key={product.id}
                  className="w-1/2 px-2 mb-4" 
                  entering={FadeInDown.delay(100 + index * 50).springify().duration(600)}
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="w-full"
                    asChild
                  >
                    <TouchableOpacity className="bg-white dark:bg-neutral-800 rounded-xl elevation-3 overflow-hidden transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-500">
                      <Image
                        source={{ uri: product.imageUrl?.[0] || 'https://placehold.co/400x400/E0E0E0/B0B0B0/png?text=No+Image' }}
                        className="w-full h-40 object-cover"
                        resizeMode="cover"
                      />
                      <View className="p-3">
                        <Text className="font-semibold text-base text-neutral-800 dark:text-white truncate" numberOfLines={1}>
                          {product.title}
                        </Text>
                        <Text className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5" numberOfLines={1}>
                          {product.description ? parseHtmlForDisplay(product.description) : 'No description available'}
                        </Text>
                        <View className="flex-row items-center mt-1.5">
                          <Text className={`text-primary dark:text-blue-400 font-extrabold ${pricing.isRange ? 'text-base' : 'text-lg'}`}>
                            {pricing.formattedPrice}
                          </Text>
                          {pricing.originalPrice && pricing.originalPrice !== pricing.formattedPrice && (
                            <Text className="text-neutral-500 dark:text-neutral-400 text-sm ml-2 line-through">
                              {pricing.originalPrice}
                            </Text>
                          )}
                        </View>
                        {pricing.appliedRole !== 'OTHERS' && (
                          <View className="bg-green-100 dark:bg-green-900 rounded-md px-2 py-1 mt-1 self-start">
                            <Text className="text-xs text-green-700 dark:text-green-300 font-medium">
                              {pricing.appliedRole} pricing applied
                            </Text>
                          </View>
                        )}
                        {product.category && (
                          <View className="flex-row items-center mt-1.5 bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full self-start">
                            <FontAwesome name="tag" size={10} color="#2C59DB" />
                            <Text className="text-primary dark:text-blue-400 text-xs font-medium ml-1.5">
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
          </View>
        )}

        {!isLoadingProducts && products.length === 0 && (
          <View className="items-center justify-center py-16">
            <FontAwesome name="dropbox" size={60} color={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'} />
            <Text className="text-neutral-600 dark:text-neutral-300 mt-5 text-xl font-semibold">No Products Found</Text>
            <Text className="text-neutral-500 dark:text-neutral-400 mt-2 text-center px-6 text-sm">
              We couldn&apos;t find any products matching your current filters. Try adjusting your search or filters.
            </Text>
            <Button
              title="Reset All Filters"
              variant="outline"
              icon="refresh"
              size="sm"
              onPress={handleClearFilters}
              className="mt-6 border-primary text-primary py-2 px-3 rounded-md"
              iconColor="#2C59DB"
            />
          </View>
        )}
        <View className="h-10" /> 
      </ScrollView>
    </SafeAreaView>
  );
}