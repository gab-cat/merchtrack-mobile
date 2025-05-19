import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image,
  useColorScheme as RNUseColorScheme
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withSequence, 
  withTiming,
  FadeInDown, 
  ZoomIn,
  BounceIn
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { useCartStore } from '@/stores/cart.store';

// Define a type for the order item
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variantName?: string;
}

// Format currency as Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const SuccessScreen = () => {
  const params = useLocalSearchParams();
  const { clearCart } = useCartStore();
  const colorScheme = useColorScheme();
  const systemColorScheme = RNUseColorScheme();
  const isDark = colorScheme === 'dark' || (systemColorScheme === 'dark');

  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  // Parse order items from params
  const orderItems: OrderItem[] = params.orderItems ? JSON.parse(decodeURIComponent(params.orderItems as string)) : [];
  const orderTotal = params.total ? Number(params.total) : 0;
  const orderDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  useEffect(() => {
    // Start animations
    scale.value = withSequence(
      withTiming(1.2, { duration: 400 }),
      withTiming(1, { duration: 200 })
    );
    
    opacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    
    // Clear cart after displaying success page
    clearCart();
  }, []);
  
  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    };
  });

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          title: 'Order Confirmed',
          headerShown: false
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Animated.View 
            style={[styles.checkmarkContainer, checkmarkStyle]}
          >
            <View style={[styles.checkmark, isDark && styles.checkmarkDark]}>
              <FontAwesome name="check" size={50} color="#fff" />
            </View>
          </Animated.View>
          
          <Animated.Text 
            style={[styles.title, isDark && styles.textDark]}
            entering={BounceIn.delay(400).duration(600)}
          >
            Order Confirmed!
          </Animated.Text>
          
          <Animated.Text 
            style={[styles.subtitle, isDark && styles.textMutedDark]}
            entering={FadeInDown.delay(700).duration(500)}
          >
            Thank you for your purchase
          </Animated.Text>
          
          <Animated.View 
            style={[styles.infoCard, isDark && styles.cardDark]}
            entering={FadeInDown.delay(900).duration(500)}
          >
            <Text style={[styles.infoTitle, isDark && styles.textDark]}>Order Details</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Order Number:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>
                {Math.floor(Math.random() * 900000) + 100000}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Date:</Text>
              <Text style={[styles.infoValue, isDark && styles.textDark]}>{orderDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>Total:</Text>
              <Text style={[styles.infoValue, styles.totalValue]}>{formatCurrency(orderTotal)}</Text>
            </View>
          </Animated.View>
        </View>
        
        <Animated.View style={contentStyle}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Items Purchased</Text>
          
          {orderItems.map((item, index) => (
            <Animated.View 
              key={item.id}
              style={[styles.productCard, isDark && styles.cardDark]}
              entering={FadeInDown.delay(1000 + (index * 100)).duration(400)}
            >
              <Image 
                source={{ uri: item.imageUrl || 'https://placehold.co/100x100/E0E0E0/B0B0B0/png?text=Product' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={[styles.productName, isDark && styles.textDark]}>{item.name}</Text>
                {item.variantName && (
                  <Text style={[styles.productVariant, isDark && styles.textMutedDark]}>{item.variantName}</Text>
                )}
                <View style={styles.productPriceRow}>
                  <Text style={[styles.productQuantity, isDark && styles.textMutedDark]}>
                    Qty: {item.quantity}
                  </Text>
                  <Text style={[styles.productPrice, isDark && styles.textDark]}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            </Animated.View>
          ))}
          
          <Animated.View 
            entering={ZoomIn.delay(1500).duration(500)}
            style={styles.buttonsContainer}
          >
            <Button
              title="Continue Shopping"
              icon="shopping-cart"
              className="w-full bg-primary mb-4"
              onPress={() => router.replace("/(tabs)")}
            />
            
            <Button
              title="Track Order"
              icon="map-marker"
              className="w-full bg-secondary"
              onPress={() => {
                // Generate a random order ID for demo purposes
                // In a real app, this would be the actual order ID returned from the API
                const demoOrderId = Math.random().toString(36).substring(2, 10);
                router.push({
                  pathname: '/track-order',
                  params: { orderId: demoOrderId }
                });
              }}
            />
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  checkmarkContainer: {
    marginBottom: 20,
  },
  checkmark: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2C59DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2C59DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  checkmarkDark: {
    shadowOpacity: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  cardDark: {
    backgroundColor: '#1F2937',
    shadowOpacity: 0.2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalValue: {
    color: '#2C59DB',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  productVariant: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonsContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  textDark: {
    color: '#F3F4F6',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
});

export default SuccessScreen; 