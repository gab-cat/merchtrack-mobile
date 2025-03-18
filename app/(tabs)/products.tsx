import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, SafeAreaView, RefreshControl, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Link, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debounce } from 'lodash';
import { Card } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { useApiClient } from '@/lib/api';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Define schema for filters
const filterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'oldest']).optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const params = useLocalSearchParams();
  const api = useApiClient();
  
  // Form state using react-hook-form with zod validation
  const { control, handleSubmit, watch, setValue } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      categoryId: params.categoryId as string || undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'newest',
    },
  });
  
  // Debounced search
  const searchValue = watch('search');
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setValue('search', value);
      refetch();
    }, 500),
    []
  );
  
  useEffect(() => {
    if (searchValue !== undefined) {
      debouncedSearch(searchValue);
    }
    return () => debouncedSearch.cancel();
  }, [searchValue, debouncedSearch]);

  // Categories query
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.post('/categories', {take: 10});
      return response.data;
    },
  });

  // Products query with filters
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    refetch,
  } = useQuery({
    queryKey: ['products', watch()],
    queryFn: async () => {
      const formValues = watch();
      
      // Build where clause for filtering
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

      // Build order by clause
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

      const response = await api.post('/products', {
        take: 20,
        skip: 0,
        where,
        orderBy,
      });

      return response;
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFilterChange = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setValue('search', '');
    setValue('categoryId', undefined);
    setValue('minPrice', undefined);
    setValue('maxPrice', undefined);
    setValue('sortBy', 'newest');
    refetch();
  };

  const products = productsData?.data || [];
  const metadata = productsData?.metadata || { total: 0 };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Animated Header */}
      <Animated.View 
        className="px-4 pt-6 pb-6 bg-primary shadow-md"
        entering={FadeIn}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <FontAwesome name="shopping-bag" size={24} color="#FFFFFF" />
            <Text className="text-2xl font-bold text-white ml-2">My Products</Text>
          </View>
          <Link href="/new" asChild>
            <Button
              title="Add Product"
              variant="primary"
              size="sm"
              icon="plus"
              className="bg-white text-primary"
              iconColor="#2C59DB"
            />
          </Link>
        </View>
      </Animated.View>
      
      {/* Search and Filter */}
      <Animated.View 
        className="px-4 pt-4 pb-2"
        entering={FadeInDown.springify().delay(100)}
      >
        <View className="flex-row items-center mb-4">
          <View className="flex-1 mr-2">
            <TextInput
              icon="search"
              placeholder="Search products..."
              value={searchValue}
              onChangeText={setValue}
              className="bg-white dark:bg-neutral-800"
            />
          </View>
          <Button
            icon="filter"
            variant="outline"
            size="sm"
            onPress={() => setShowFilters(!showFilters)}
            className="border-primary"
            iconColor="#2C59DB"
          />
        </View>
        
        {/* Category filters with horizontal scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="pb-2"
        >
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${!watch('categoryId') ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}
            onPress={() => {
              setValue('categoryId', undefined);
              handleFilterChange();
            }}
          >
            <Text className={`${!watch('categoryId') ? 'text-white' : 'text-neutral-800 dark:text-white'}`}>
              All
            </Text>
          </TouchableOpacity>
          
          {!isLoadingCategories && categories?.map((category) => (
            <TouchableOpacity
              key={category.id}
              className={`mr-2 px-4 py-2 rounded-full ${watch('categoryId') === category.id ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700'}`}
              onPress={() => {
                setValue('categoryId', category.id);
                handleFilterChange();
              }}
            >
              <Text className={`${watch('categoryId') === category.id ? 'text-white' : 'text-neutral-800 dark:text-white'}`}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* Product List */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Results count */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-neutral-600 dark:text-neutral-400">
            {isLoadingProducts ? 'Loading...' : `${metadata.total} Products Found`}
          </Text>
          {(watch('search') || watch('categoryId') || watch('minPrice') || watch('maxPrice')) && (
            <TouchableOpacity
              className="flex-row items-center"
              onPress={handleClearFilters}
            >
              <Text className="text-primary mr-1">Clear filters</Text>
              <FontAwesome name="times" size={12} color="#2C59DB" />
            </TouchableOpacity>
          )}
        </View>

        {isLoadingProducts ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#2C59DB" />
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {products.map((product, index) => (
              <Animated.View 
                key={product.id}
                className="mb-4"
                entering={FadeInDown.delay(250 + index * 50).springify()}
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="mb-4"
                  asChild
                >
                  <Card>
                    <Image
                      source={{ uri: product.imageUrl[0] || 'https://placehold.co/300x300/png' }}
                      className="w-full h-48 rounded-t-xl"
                    />
                    <View className="p-3">
                      <Text className="font-medium text-neutral-800 dark:text-white" numberOfLines={1}>
                        {product.title}
                      </Text>
                      <Text className="text-primary font-bold mt-1">
                        ${product.price?.toFixed(2)}
                      </Text>
                      {product.category && (
                        <View className="flex-row items-center mt-2">
                          <FontAwesome name="tag" size={12} color="#ADB5BD" />
                          <Text className="text-neutral-500 dark:text-neutral-400 text-xs ml-1">
                            {product.category.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                </Link>
              </Animated.View>
            ))}
          </View>
        )}

        {!isLoadingProducts && products.length === 0 && (
          <View className="items-center justify-center py-16">
            <FontAwesome name="search" size={48} color="#ADB5BD" />
            <Text className="text-neutral-500 dark:text-neutral-400 mt-4 text-center">
              No products found matching your criteria
            </Text>
            <Button
              title="Reset Filters"
              variant="outline"
              icon="refresh"
              size="sm"
              onPress={handleClearFilters}
              className="mt-4"
            />
          </View>
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}