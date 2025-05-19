import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  TextInput,
  Alert,
  useColorScheme
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Text, View, useThemeColor } from '@/components/Themed';
import { useCartStore } from '@/stores/cart.store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Format currency as Philippine Peso
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function CartModal() {
  const { items, removeItem, updateQuantity, updateNotes, getTotalPrice, clearCart } = useCartStore();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const colorScheme = useColorScheme();
  
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#f8f8f8', dark: '#121212' }, 'background');
  const cardBackground = useThemeColor({ light: 'white', dark: '#1c1c1c' }, 'background');
  const textColor = useThemeColor({ light: '#333', dark: '#e0e0e0' }, 'text');
  const secondaryTextColor = useThemeColor({ light: '#666', dark: '#a0a0a0' }, 'text');
  const accentColor = '#2C59DB';
  const dangerColor = '#FF3B30';
  const borderColor = useThemeColor({ light: '#f0f0f0', dark: '#2c2c2c' }, 'background');
  const iconColor = useThemeColor({ light: '#888', dark: '#a0a0a0' }, 'text');
  const buttonBgColor = useThemeColor({ light: '#f0f0f0', dark: '#333333' }, 'background');

  // Format price for display
  const formattedTotal = formatCurrency(getTotalPrice());

  // Handle empty cart
  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Stack.Screen 
          options={{
            title: 'Cart',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} className="ml-2">
                <FontAwesome name="arrow-left" size={22} color={iconColor} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <FontAwesome name="close" size={24} color={iconColor} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={[styles.emptyCart, { backgroundColor }]}>
          <FontAwesome name="shopping-cart" size={64} color={iconColor} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button 
            title="Continue Shopping" 
            className="mt-4 bg-primary" 
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Stack.Screen 
        options={{
          title: 'Cart',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="ml-2">
              <FontAwesome name="arrow-left" size={22} color={iconColor} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.cartHeader, { backgroundColor }]}>
          <Text style={[styles.cartTitle, { color: textColor }]}>Cart</Text>
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => {
              Alert.alert(
                "Clear Cart",
                "Are you sure you want to remove all items?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", style: "destructive", onPress: () => clearCart() }
                ]
              );
            }}
          >
            <Text style={[styles.clearButtonText, { color: dangerColor }]}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <Animated.View 
            key={item.id} 
            style={[styles.cartItem, { backgroundColor: cardBackground }]}
            entering={FadeInDown.delay(index * 100).duration(300)}
          >
            <View style={[styles.cartItemRow, { backgroundColor: cardBackground }]}>
              <Image 
                source={{ 
                  uri: item.imageUrl || 'https://placehold.co/600x400/E0E0E0/B0B0B0/png?text=Product+Image'
                }} 
                style={styles.cartItemImage} 
              />
              
              <View style={[styles.cartItemInfo, { backgroundColor: cardBackground }]}>
                <View style={[styles.cartItemTop, { backgroundColor: cardBackground }]}>
                  <Text style={[styles.cartItemName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert(
                        "Remove Item",
                        "Are you sure you want to remove this item?",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", style: "destructive", onPress: () => removeItem(item.id) }
                        ]
                      );
                    }}
                  >
                    <FontAwesome name="trash-o" size={22} color={dangerColor} />
                  </TouchableOpacity>
                </View>
                
                {item.variantName && (
                  <Text style={[styles.cartItemVariant, { color: secondaryTextColor }]}>{item.variantName}</Text>
                )}
                
                <Text style={styles.cartItemPrice}>{formatCurrency(item.price)}</Text>
                
                <View style={[styles.quantityContainer, { backgroundColor: cardBackground }]}>
                  <TouchableOpacity 
                    style={[styles.quantityButton, { backgroundColor: buttonBgColor }]}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FontAwesome name="minus" size={14} color={item.quantity <= 1 ? iconColor : accentColor} />
                  </TouchableOpacity>
                  
                  <Text style={[styles.quantityText, { color: textColor }]}>{item.quantity}</Text>
                  
                  <TouchableOpacity 
                    style={[styles.quantityButton, { backgroundColor: buttonBgColor }]}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <FontAwesome name="plus" size={14} color={accentColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Notes section */}
            <View style={[styles.notesSection, { borderTopColor: borderColor, backgroundColor: cardBackground }]}>
              {editingNotes === item.id ? (
                <View style={[styles.notesEdit, { backgroundColor: cardBackground }]}>
                  <TextInput
                    style={[styles.notesInput, { 
                      borderColor: borderColor,
                      color: textColor,
                      backgroundColor: colorScheme === 'dark' ? '#2c2c2c' : 'white'
                    }]}
                    placeholder="Add note (optional)"
                    placeholderTextColor={secondaryTextColor}
                    value={noteText}
                    onChangeText={setNoteText}
                    multiline
                    autoFocus
                  />
                  <View style={[styles.notesButtons, { backgroundColor: cardBackground }]}>
                    <TouchableOpacity 
                      style={styles.notesCancelButton}
                      onPress={() => {
                        setEditingNotes(null);
                        setNoteText('');
                      }}
                    >
                      <Text style={[styles.notesCancelText, { color: iconColor }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.notesSaveButton}
                      onPress={() => {
                        updateNotes(item.id, noteText);
                        setEditingNotes(null);
                      }}
                    >
                      <Text style={styles.notesSaveText}>Save Note</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.notesButton, { backgroundColor: cardBackground }]}
                  onPress={() => {
                    setNoteText(item.notes || '');
                    setEditingNotes(item.id);
                  }}
                >
                  <FontAwesome name="pencil" size={14} color={iconColor} style={styles.notesIcon} />
                  <Text style={[styles.notesText, { color: iconColor }]}>
                    {item.notes ? item.notes : 'Add note'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
      
      <View style={[styles.cartFooter, { backgroundColor: cardBackground, borderTopColor: borderColor }]}>
        <View style={[styles.totalSection, { backgroundColor: cardBackground }]}>
          <Text style={[styles.totalLabel, { color: textColor }]}>Total</Text>
          <Text style={styles.totalAmount}>{formattedTotal}</Text>
        </View>
        
        <Button
          title="Proceed to Checkout"
          icon="shopping-cart"
          className="w-full bg-primary"
          onPress={() => {
            router.push('/checkout');
          }}
        />
      </View>

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
  },
  cartItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemRow: {
    flexDirection: 'row',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cartItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  cartItemVariant: {
    fontSize: 14,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C59DB',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  notesSection: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  notesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesIcon: {
    marginRight: 6,
  },
  notesText: {
    fontSize: 14,
    flex: 1,
  },
  notesEdit: {
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  notesCancelButton: {
    padding: 8,
    marginRight: 12,
  },
  notesCancelText: {
    fontSize: 14,
  },
  notesSaveButton: {
    backgroundColor: '#2C59DB',
    borderRadius: 6,
    padding: 8,
    paddingHorizontal: 12,
  },
  notesSaveText: {
    color: 'white',
    fontSize: 14,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C59DB',
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
  }
});
