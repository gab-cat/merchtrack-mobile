import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Switch, 
  Alert,
  StyleSheet, 
  useColorScheme as RNUseColorScheme
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/stores/cart.store';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';

// Format currency as Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const CheckoutScreen = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const colorScheme = useColorScheme();
  const systemColorScheme = RNUseColorScheme();
  const isDark = colorScheme === 'dark' || (systemColorScheme === 'dark');
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Calculate subtotal, shipping, and total
  const subtotal = getTotalPrice();
  const shipping = subtotal > 1000 ? 0 : 150; // Free shipping for orders over 1000
  const total = subtotal + shipping;

  // Format prices for display
  const formattedSubtotal = formatCurrency(subtotal);
  const formattedShipping = shipping === 0 ? 'FREE' : formatCurrency(shipping);
  const formattedTotal = formatCurrency(total);

  const handleCheckout = () => {
    if (!termsAccepted) {
      Alert.alert(
        "Terms Required", 
        "Please accept the Terms of Service to continue."
      );
      return;
    }
    
    // Log checkout information
    console.log("CHECKOUT DATA:", {
      items,
      subtotal,
      shipping,
      total,
      timestamp: new Date().toISOString()
    });
    
    // Show success message
    Alert.alert(
      "Order Placed Successfully",
      "Your order has been received and is being processed.",
      [
        { 
          text: "OK", 
          onPress: () => {
            // Clear cart and navigate home
            clearCart();
            router.replace("/(tabs)");
          }
        }
      ]
    );
  };

  // Handle empty cart
  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <Stack.Screen 
          options={{
            title: 'Checkout',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <FontAwesome name="arrow-left" size={22} color={isDark ? "#ccc" : "#888"} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.emptyCart}>
          <FontAwesome name="shopping-cart" size={64} color={isDark ? "#666" : "#ccc"} />
          <Text style={[styles.emptyText, isDark && styles.textDark]}>Your cart is empty</Text>
          <Button 
            title="Continue Shopping" 
            className="mt-4 bg-primary" 
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          title: 'Checkout',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <FontAwesome name="arrow-left" size={22} color={isDark ? "#ccc" : "#888"} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <Animated.View 
          style={[styles.section, isDark && styles.sectionDark]}
          entering={FadeIn.duration(300)}
        >
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Order Summary</Text>
          
          {items.map((item, index) => (
            <Animated.View 
              key={item.id} 
              style={[styles.summaryItem, isDark && styles.summaryItemDark]}
              entering={FadeInDown.delay(index * 100)}
            >
              <Image 
                source={{ uri: item.imageUrl || 'https://placehold.co/100x100/E0E0E0/B0B0B0/png?text=Product' }} 
                style={styles.itemImage} 
              />
              
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, isDark && styles.textDark]} numberOfLines={1}>{item.name}</Text>
                {item.variantName && (
                  <Text style={[styles.itemVariant, isDark && styles.textMutedDark]}>{item.variantName}</Text>
                )}
                <View style={styles.itemPriceRow}>
                  <Text style={[styles.itemPrice, isDark && styles.textMutedDark]}>
                    {formatCurrency(item.price)} × {item.quantity}
                  </Text>
                  <Text style={[styles.itemTotal, isDark && styles.textDark]}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
                {item.notes && (
                  <Text style={[styles.itemNotes, isDark && styles.textMutedDark]} numberOfLines={1}>
                    Note: {item.notes}
                  </Text>
                )}
              </View>
            </Animated.View>
          ))}
          
          <View style={[styles.subtotalContainer, isDark && styles.borderDark]}>
            <View style={styles.priceLine}>
              <Text style={[styles.priceLabel, isDark && styles.textMutedDark]}>Subtotal</Text>
              <Text style={[styles.priceValue, isDark && styles.textDark]}>{formattedSubtotal}</Text>
            </View>
            
            <View style={styles.priceLine}>
              <Text style={[styles.priceLabel, isDark && styles.textMutedDark]}>Shipping</Text>
              <Text style={[
                styles.priceValue, 
                shipping === 0 && styles.freeShipping, 
                isDark && (shipping === 0 ? styles.freeShippingDark : styles.textDark)
              ]}>
                {formattedShipping}
              </Text>
            </View>
            
            {shipping === 0 && (
              <Text style={[styles.shippingNote, isDark && styles.shippingNoteDark]}>
                Free shipping on orders over ₱1,000
              </Text>
            )}
            
            <View style={[styles.totalLine, isDark && styles.borderDark]}>
              <Text style={[styles.totalLabel, isDark && styles.textDark]}>Total</Text>
              <Text style={styles.totalValue}>{formattedTotal}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={[styles.section, styles.termsSection, isDark && styles.sectionDark]}
          entering={FadeIn.delay(300)}
        >
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Terms and Conditions</Text>
          
          <View style={styles.termsToggle}>
            <TouchableOpacity 
              onPress={() => setShowTerms(!showTerms)}
              style={styles.termsHeader}
            >
              <Text style={styles.termsToggleText}>
                {showTerms ? 'Hide Terms of Service' : 'View Terms of Service'}
              </Text>
              <FontAwesome 
                name={showTerms ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#2C59DB" 
              />
            </TouchableOpacity>
            
            {showTerms && (
              <View style={[styles.termsContent, isDark && styles.termsContentDark]}>
                <Text style={[styles.termsText, isDark && styles.textMutedDark]}>
                  1. By placing an order, you agree to pay the full amount specified at checkout.{'\n\n'}
                  2. Delivery times are estimates and may vary depending on your location and product availability.{'\n\n'}
                  3. Returns and exchanges must be initiated within 7 days of receiving your order.{'\n\n'}
                  4. Products may vary slightly from their pictures on the website.{'\n\n'}
                  5. Personal information will be handled according to our Privacy Policy.{'\n\n'}
                  6. We reserve the right to cancel orders in cases of pricing errors or stock issues.{'\n\n'}
                  7. Payment details are securely processed and encrypted.
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.acceptTermsRow}>
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
              thumbColor={termsAccepted ? '#2C59DB' : '#F3F4F6'}
              ios_backgroundColor="#D1D5DB"
            />
            <Text style={[styles.acceptTermsText, isDark && styles.textMutedDark]}>
              I accept the Terms of Service and Privacy Policy
            </Text>
          </View>
        </Animated.View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <Button
          title="Place Order"
          icon="check"
          className={`w-full ${!termsAccepted ? 'bg-neutral-400' : 'bg-primary'}`}
          onPress={handleCheckout}
          disabled={!termsAccepted}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  headerButton: {
    paddingHorizontal: 12, 
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  termsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
  },
  textDark: {
    color: '#F3F4F6',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryItemDark: {
    borderBottomColor: '#374151',
  },
  borderDark: {
    borderTopColor: '#374151',
    borderBottomColor: '#374151',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemVariant: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  itemNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6B7280',
    marginTop: 4,
  },
  subtotalContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  freeShipping: {
    color: '#059669',
    fontWeight: '700',
  },
  freeShippingDark: {
    color: '#34D399',
  },
  shippingNote: {
    fontSize: 13,
    color: '#059669',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  shippingNoteDark: {
    color: '#34D399',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C59DB',
  },
  termsToggle: {
    marginBottom: 16,
  },
  termsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  termsToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C59DB',
  },
  termsContent: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  termsContentDark: {
    backgroundColor: '#111827',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  acceptTermsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptTermsText: {
    fontSize: 15,
    marginLeft: 10,
    color: '#4B5563',
    flex: 1,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerDark: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
  bottomPadding: {
    height: 80,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
  }
});

export default CheckoutScreen; 