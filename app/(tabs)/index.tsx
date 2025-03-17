import React from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, FadeInRight, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { useApiClient } from '@/lib/api';
import { ApiResponse } from '@/types/common';
import { Category, Product } from '@prisma/client';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = React.useState(false);
  
  const api = useApiClient();
  
  // Featured products query
  const { data: featuredProducts, isLoading: isLoadingFeatured, refetch: refetchFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const response = await api.post('/products', {
        take: 4,
        orderBy: { createdAt: 'desc' }
      });
      return (response as ApiResponse<Product[]>).data;
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

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6 bg-neutral-50 dark:bg-neutral-900"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Animated Banner Section */}
        <Animated.View 
          className="px-4 py-5 bg-primary rounded-b-3xl"
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
            <Link href="/search" asChild>
              <Button
                title=""
                icon="search"
                variant="outline"
                size="sm"
                className="bg-white/20 border-0"
                onPress={() => {}}
                iconColor="#FFFFFF"
              />
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
                <Link href="/products" asChild>
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
            <Link href="/products" asChild>
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
              {featuredProducts?.map((product, index) => (
                <Animated.View 
                  key={product.id}
                  entering={FadeInRight.delay(400 + (index * 100)).springify()}
                >
                  <Link 
                    href={`/product/${product.slug}`}
                    asChild
                  >
                    <Card className="mr-3 w-40 shadow-sm">
                      <Image
                        source={{ uri: product.imageUrl[0] || 'https://placehold.co/300x300/png' }}
                        className="w-full h-36 rounded-t-xl"
                      />
                      <View className="p-3">
                        <Text className="font-medium text-neutral-800 dark:text-white" numberOfLines={1}>
                          {product.title}
                        </Text>
                        <View className="flex-row justify-between items-center mt-1">
                          <Text className="text-primary font-bold">
                            ${product.price}
                          </Text>
                          <FontAwesome name="shopping-cart" size={14} color="#2C59DB" />
                        </View>
                      </View>
                    </Card>
                  </Link>
                </Animated.View>
              ))}
              
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
                    href={`/products?categoryId=${category.id}`} 
                    asChild
                  >
                    <View className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm border border-neutral-100 dark:border-neutral-700">
                      <Image
                        source={{ uri: 'https://placehold.co/200x100/png' }}
                        className="w-full h-24"
                      />
                      <View className="p-3 flex-row justify-between items-center">
                        <Text className="font-medium text-neutral-800 dark:text-white">
                          {category.name}
                        </Text>
                        <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                          <FontAwesome name="chevron-right" size={10} color="#2C59DB" />
                        </View>
                      </View>
                    </View>
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
