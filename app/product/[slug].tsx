import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, router, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useProduct } from '@/lib/hooks/use-queries';
import { QueryParams } from '@/types/common';
import type { Product as PrismaProduct, Category, Review, User, ProductVariant } from '@prisma/client';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from '@/components/ui/Button';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRolePricing } from '@/utils/use-role-pricing';
import { parseHtmlForDisplay } from '@/utils/html-parser';
import Avatar from '@/components/shared/avatar';
import { useUserStore } from '@/stores/user.store';



interface ProductReview extends Review {
  user?: Pick<User, 'firstName' | 'lastName' | 'imageUrl' | 'clerkId'>;
}

// Define our extended Product interface matching what we expect from the API
interface ExtendedProduct extends PrismaProduct {
  category?: Category;
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  price: number;
  postedBy?: {
    college?: string;
  };
}

// const router = useRouter();

const ProductDetailScreen = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colorScheme = useColorScheme();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { user } = useUserStore();
  // Query parameters to include related data with the product
  const queryParams: QueryParams = {
    include: { 
      category: true,
      variants: true,
      reviews: { 
        include: { 
          user: { select: { firstName: true, lastName: true, imageUrl: true, clerkId: true } } 
        } 
      },
      postedBy: {
        select: { college: true }
      }
    }
  };

  // Use the product hook with the slug
  const { data: productResponse, isLoading, error } = useProduct(
    slug, // Use the slug directly as ID
    {
      ...queryParams
    }
  );

  // Cast the product data to our extended interface
  const product = productResponse?.data as ExtendedProduct | undefined;

  // Set the first variant as selected by default once product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  // Get pricing based on role
  const pricing = useRolePricing({
    variant: selectedVariant 
      ? {
        price: Number(selectedVariant.price),
        rolePricing: selectedVariant.rolePricing as Record<string, number>
      }
      : { 
        price: product?.price ? Number(product.price) : 0,
        rolePricing: {} as Record<string, number>
      },
    customerRole: user?.role as string | null,
    customerCollege: user?.college as string | null,
    productPostedByCollege: product?.postedBy?.college || null
  });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFFFFF' : '#2C59DB'} />
        <Text className="mt-2 text-neutral-600 dark:text-neutral-400">Loading Product...</Text>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
        <Stack.Screen options={{ title: 'Error' }} />
        <FontAwesome name="exclamation-triangle" size={48} color="#EF4444" />
        <Text className="mt-4 text-xl font-semibold text-red-600 dark:text-red-400">Error Loading Product</Text>
        <Text className="mt-2 text-center text-neutral-600 dark:text-neutral-400">
          {error ? error.message : 'Could not find the product you are looking for.'}
        </Text>
        <Button 
          title="Go Back to Products" 
          onPress={() => router.replace('/(tabs)/products')} 
          className="mt-6" 
        />
      </SafeAreaView>
    );
  }

  // Calculate average rating and total reviews
  const totalReviews = product.reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? (product.reviews?.reduce((sum: number, review: ProductReview) => sum + review.rating, 0) || 0) / totalReviews
    : 0;

  const getUserDisplayName = (user?: Pick<User, 'firstName' | 'lastName' | 'imageUrl'>) => {
    if (!user) return 'Anonymous';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';
  };

  const hasVariants = product.variants !== undefined && product.variants.length > 0;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <Stack.Screen options={{ 
        headerShown: false,
        title: product.title,
      }} />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Product Images - Carousel or Single Image */}
        <View className="relative">
          <Animated.View 
            entering={FadeIn.duration(500)} 
            className="w-full elevation-3 bg-white dark:bg-neutral-800 rounded-b-lg overflow-hidden"
          >
            <Image 
              source={{ uri: product.imageUrl?.[0] || 'https://placehold.co/600x400/E0E0E0/B0B0B0/png?text=Product+Image' }}
              className="w-full h-72 object-cover"
              resizeMode="cover"
            />
          </Animated.View>
          
          {/* Back button overlay */}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-10 left-4 z-10 w-10 h-10 bg-black/30 dark:bg-black/50 rounded-full items-center justify-center"
          >
            <FontAwesome name="arrow-left" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="p-4">
          {/* Product Title and Category */}
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-2xl font-bold text-neutral-800 dark:text-white flex-1 mr-2" numberOfLines={2}>{product.title}</Text>
            {product.category && (
              <View className="bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full self-start mt-1">
                <Text className="text-primary dark:text-blue-400 text-xs font-medium">
                  {product.category.name}
                </Text>
              </View>
            )}
          </View>

          {/* Price Display with Role Pricing */}
          <View className="flex-row items-center">
            <Text className="text-3xl font-extrabold text-primary dark:text-blue-400 mb-3">
              {pricing.formattedPrice}
            </Text>
            {pricing.originalPrice && pricing.originalPrice !== pricing.formattedPrice && (
              <Text className="text-lg text-neutral-500 dark:text-neutral-400 ml-2 mb-3 line-through">
                {pricing.originalPrice}
              </Text>
            )}
          </View>
          {pricing.appliedRole !== 'OTHERS' && (
            <View className="bg-green-100 dark:bg-green-900 rounded-md px-2 py-1 mb-3 self-start">
              <Text className="text-xs text-green-700 dark:text-green-300 font-medium">
                {pricing.appliedRole} pricing applied
              </Text>
            </View>
          )}

          {/* Ratings Summary */}
          {totalReviews > 0 && (
            <View className="flex-row items-center mb-3">
              {[...Array(5)].map((_, i) => (
                <FontAwesome 
                  key={`rating-star-${i}`}
                  name={i < Math.round(averageRating) ? "star" : "star-o"} 
                  size={20} 
                  color="#FFC107" 
                  className="mr-1"
                />
              ))}
              <Text className="text-neutral-600 dark:text-neutral-400 ml-2">{averageRating.toFixed(1)} ({totalReviews} review{totalReviews === 1 ? '' : 's'})</Text>
            </View>
          )}

          {/* Description */}
          <Text className="text-base font-semibold text-neutral-700 dark:text-neutral-200 mb-1">Description</Text>
          <Text className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
            {product.description ? parseHtmlForDisplay(product.description) : 'No description available.'}
          </Text>

          {/* Variants Section */}
          {hasVariants && (
            <View className="mb-4">
              <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">Variants</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                {product.variants?.map(variant => (
                  <TouchableOpacity 
                    key={variant.id} 
                    className={`mr-2.5 py-2 px-4 rounded-xl border ${
                      selectedVariant?.id === variant.id 
                        ? 'border-primary bg-primary/10 dark:bg-primary/20' 
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800'
                    } min-w-[100px] items-center ${variant.inventory <= 0 ? 'opacity-60' : ''}`}
                    onPress={() => setSelectedVariant(variant)}
                    disabled={variant.inventory <= 0}
                  >
                    <Text 
                      className={`font-medium mb-0.5 ${
                        selectedVariant?.id === variant.id 
                          ? 'text-primary dark:text-blue-400 font-semibold' 
                          : variant.inventory <= 0 
                            ? 'text-neutral-400 dark:text-neutral-500' 
                            : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {variant.variantName}
                    </Text>
                    <Text className={`text-xs ${
                      selectedVariant?.id === variant.id 
                        ? 'text-primary dark:text-blue-400' 
                        : variant.inventory <= 0 
                          ? 'text-neutral-400 dark:text-neutral-500' 
                          : 'text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {variant.inventory > 0 ? `₱${variant.price}` : 'Out of Stock'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Add to Cart Button */}
          <View className="mt-4">
            <Button 
              title={selectedVariant?.inventory === 0 ? "Out of Stock" : "Add to Cart"} 
              icon="shopping-cart" 
              className={`w-full py-3 rounded-lg ${selectedVariant?.inventory === 0 ? 'bg-neutral-400' : 'bg-primary'}`}
              // onPress={() => console.log('Add to cart pressed for', product.id, 'variant:', selectedVariant?.id)}
              onPress={() => {
                router.push({
                  pathname: '/my_cart',
                  params: {
                    productId: product.id,
                    variantId: selectedVariant?.id,
                  },
                });
              }}
              disabled={selectedVariant?.inventory === 0}
            />
          </View>
        </Animated.View>
        
        {/* Reviews Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} className="p-4 border-t border-neutral-200 dark:border-neutral-700 mt-4">
          <Text className="text-xl font-bold text-neutral-800 dark:text-white mb-3">Customer Reviews ({totalReviews})</Text>
          {totalReviews > 0 && product.reviews ? (
            product.reviews.map(review => (
              <View key={review.id} className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl elevation-1">
                <View className="flex-row items-start mb-1.5">
                  <Avatar src={review.user?.clerkId} size="lg" className='mr-2 rounded-full' />
                  <View className="flex-1">
                    <Text className="font-semibold text-neutral-700 dark:text-neutral-200">{getUserDisplayName(review.user)}</Text>
                    <View className="flex-row items-center mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesome 
                          key={`review-star-${review.id}-${i}`}
                          name={i < review.rating ? "star" : "star-o"} 
                          size={14} 
                          color="#FFC107" 
                          className="mr-0.5"
                        />
                      ))}
                    </View>
                  </View>
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text className="text-neutral-600 dark:text-neutral-300 leading-snug text-sm pl-[40px]">
                  {review.comment ? parseHtmlForDisplay(review.comment) : ''}
                </Text>
              </View>
            ))
          ) : (
            <View className="items-center py-8">
              <FontAwesome name="comment-o" size={32} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
              <Text className="text-neutral-500 dark:text-neutral-400 italic mt-3">No reviews yet for this product.</Text>
            </View>
          )}
        </Animated.View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProductDetailScreen; 