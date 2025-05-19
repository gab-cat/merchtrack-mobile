import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  useColorScheme as RNUseColorScheme
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Button } from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';
import { useOrder } from '@/lib/hooks/use-queries';
import { OrderStatus, OrderPaymentStatus, CancellationReason, OrderItem } from '@prisma/client';
import { QueryParams } from '@/types/common';

// Extended order type that includes relations
interface OrderWithRelations {
  id: string;
  isDeleted: boolean;
  customerId: string;
  processedById: string | null;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  cancellationReason: CancellationReason | null;
  totalAmount: number;
  discountAmount: number;
  estimatedDelivery: Date;
  createdAt: Date;
  updatedAt: Date;
  fulfillmentId: string | null;
  customerSatisfactionSurveyId: string | null;
  orderItems?: OrderItem[];
}

// Format currency as Philippine Peso
const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

// Format date
const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const TrackOrderScreen = () => {
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const systemColorScheme = RNUseColorScheme();
  const isDark = colorScheme === 'dark' || (systemColorScheme === 'dark');
  
  // Order ID from params or input
  const [orderId, setOrderId] = useState<string>(params.orderId as string || '');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Custom query params
  const queryParams: QueryParams = {
    include: {
      orderItems: true,
      customer: true
    }
  };
  
  // Fetch order data
  const { data, isLoading, error, refetch } = useOrder(orderId, queryParams);
  
  const order = data?.data as OrderWithRelations | undefined;
  
  // Handle search
  const handleSearch = () => {
    if (orderId.trim()) {
      setIsSearching(true);
      refetch().finally(() => setIsSearching(false));
    }
  };
  
  // Get human-readable status
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
    case 'PENDING': return 'Order Received';
    case 'PROCESSING': return 'In Processing';
    case 'READY': return 'Ready for Delivery';
    case 'DELIVERED': return 'Delivered';
    case 'CANCELLED': return 'Cancelled';
    default: return status;
    }
  };
  
  // Get payment status text
  const getPaymentStatusText = (status: OrderPaymentStatus) => {
    switch (status) {
    case 'PENDING': return 'Payment Pending';
    case 'DOWNPAYMENT': return 'Down Payment Received';
    case 'PAID': return 'Fully Paid';
    case 'REFUNDED': return 'Refunded';
    default: return status;
    }
  };
  
  // Calculate step progress
  const getStepProgress = (status: OrderStatus): number => {
    switch (status) {
    case 'PENDING': return 1;
    case 'PROCESSING': return 2;
    case 'READY': return 3;
    case 'DELIVERED': return 4;
    case 'CANCELLED': return 0;
    default: return 0;
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          title: 'Track Order',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <FontAwesome name="arrow-left" size={22} color={isDark ? "#ccc" : "#888"} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Order Search */}
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={[styles.searchCard, isDark && styles.cardDark]}
        >
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
            Enter Order Number
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, isDark && styles.searchInputDark]}
              placeholder="Order ID or Order Number"
              placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
              value={orderId}
              onChangeText={setOrderId}
            />
            <TouchableOpacity 
              onPress={handleSearch} 
              style={[styles.searchButton, (isSearching || !orderId.trim()) && styles.searchButtonDisabled]}
              disabled={isSearching || !orderId.trim()}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="search" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        {isLoading && orderId && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2C59DB" />
            <Text style={[styles.loadingText, isDark && styles.textMutedDark]}>
              Fetching order details...
            </Text>
          </View>
        )}
        
        {error && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={[styles.errorCard, isDark && styles.errorCardDark]}
          >
            <FontAwesome name="exclamation-circle" size={24} color={isDark ? '#FCA5A5' : '#DC2626'} />
            <Text style={[styles.errorText, isDark && { color: '#FCA5A5' }]}>
              Order not found. Please check the order number and try again.
            </Text>
          </Animated.View>
        )}
        
        {order && (
          <>
            {/* Order Status */}
            <Animated.View 
              entering={FadeInDown.delay(100).duration(300)}
              style={[styles.card, isDark && styles.cardDark]}
            >
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                Order Status
              </Text>
              
              <View style={[styles.statusContainer, order.status === 'CANCELLED' && styles.cancelledStatus]}>
                <Text style={[styles.statusText, order.status === 'CANCELLED' ? styles.cancelledStatusText : {}]}>
                  {getStatusText(order.status)}
                </Text>
                
                {order.status === 'CANCELLED' && order.cancellationReason && (
                  <Text style={styles.cancellationReason}>
                    Reason: {order.cancellationReason.replace('_', ' ')}
                  </Text>
                )}
              </View>
              
              {order.status !== 'CANCELLED' && (
                <View style={styles.timelineContainer}>
                  {['PENDING', 'PROCESSING', 'READY', 'DELIVERED'].map((step, index) => {
                    const isActive = getStepProgress(order.status) >= index + 1;
                    const isLast = index === 3;
                    
                    return (
                      <View key={step} style={styles.timelineStep}>
                        <View style={styles.stepIconContainer}>
                          <View style={[
                            styles.stepCircle, 
                            isActive ? styles.activeStepCircle : {},
                            isDark && isActive ? styles.activeStepCircleDark : {}
                          ]}>
                            {isActive && (
                              <FontAwesome 
                                name={index === 3 ? "check" : "circle"} 
                                size={index === 3 ? 12 : 10} 
                                color="#fff" 
                              />
                            )}
                          </View>
                          {!isLast && (
                            <View style={[
                              styles.stepLine, 
                              getStepProgress(order.status) > index + 1 ? styles.activeStepLine : {},
                              isDark && getStepProgress(order.status) > index + 1 ? styles.activeStepLineDark : {}
                            ]} />
                          )}
                        </View>
                        <Text style={[
                          styles.stepLabel, 
                          isActive ? styles.activeStepLabel : {},
                          isDark && isActive ? styles.activeStepLabelDark : {},
                          isDark && !isActive ? styles.textMutedDark : {}
                        ]}>
                          {getStatusText(step as OrderStatus)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
              
              <View style={[styles.infoRow, { marginTop: 16 }]}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                  Payment Status:
                </Text>
                <Text style={[
                  styles.paymentStatus,
                  order.paymentStatus === 'PAID' ? styles.paidStatus : {},
                  order.paymentStatus === 'REFUNDED' ? styles.refundedStatus : {},
                  isDark && (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED') ? styles.textDark : {}
                ]}>
                  {getPaymentStatusText(order.paymentStatus)}
                </Text>
              </View>
              
              {order.estimatedDelivery && (
                <View style={[styles.infoRow, { marginTop: 8 }]}>
                  <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                    Estimated Delivery:
                  </Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {formatDate(order.estimatedDelivery)}
                  </Text>
                </View>
              )}
            </Animated.View>
            
            {/* Order Details */}
            <Animated.View 
              entering={FadeInDown.delay(200).duration(300)}
              style={[styles.card, isDark && styles.cardDark]}
            >
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                Order Details
              </Text>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                  Order Number:
                </Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {order.id.substring(0, 8).toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                  Order Date:
                </Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {formatDate(order.orderDate)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                  Total Amount:
                </Text>
                <Text style={[styles.totalValue]}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>
              
              {order.discountAmount > 0 && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, isDark && styles.textMutedDark]}>
                    Discount Applied:
                  </Text>
                  <Text style={[styles.discountValue, isDark && { color: '#34D399' }]}>
                    {formatCurrency(order.discountAmount)}
                  </Text>
                </View>
              )}
            </Animated.View>
            
            {/* Order Items */}
            {order.orderItems && order.orderItems.length > 0 && (
              <Animated.View 
                entering={FadeInDown.delay(300).duration(300)}
                style={[styles.card, isDark && styles.cardDark]}
              >
                <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
                  Items Ordered
                </Text>
                
                {order.orderItems.map((item, index) => (
                  <View 
                    key={item.id}
                    style={[
                      styles.orderItem,
                      index < order.orderItems!.length - 1 && styles.itemBorder,
                      index < order.orderItems!.length - 1 && isDark && styles.itemBorderDark
                    ]}
                  >
                    <View style={styles.itemDetails}>
                      <Text style={[styles.itemName, isDark && styles.textDark]}>
                        Product Variant: {item.variantId.substring(0, 8)}
                      </Text>
                      
                      {item.size && (
                        <Text style={[styles.itemVariant, isDark && styles.textMutedDark]}>
                          Size: {item.size}
                        </Text>
                      )}
                      
                      {item.customerNote && (
                        <Text style={[styles.itemNote, isDark && styles.textMutedDark]}>
                          Note: {item.customerNote}
                        </Text>
                      )}
                      
                      <View style={styles.itemPrice}>
                        <Text style={[styles.itemQuantity, isDark && styles.textMutedDark]}>
                          Qty: {item.quantity} × {formatCurrency(Number(item.price))}
                        </Text>
                        <Text style={[styles.itemTotal, isDark && styles.textDark]}>
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
      
      <View style={[styles.footer, isDark && styles.footerDark]}>
        <Button
          title="Back to Home"
          icon="home"
          className="w-full bg-primary"
          onPress={() => router.replace("/(tabs)")}
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
    backgroundColor: '#121212',
  },
  headerButton: {
    paddingHorizontal: 12, 
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1F2937',
    shadowOpacity: 0.2,
  },
  errorCardDark: {
    backgroundColor: '#7F1D1D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  searchInputDark: {
    backgroundColor: '#374151',
    color: '#F3F4F6',
  },
  searchButton: {
    backgroundColor: '#2C59DB',
    borderRadius: 8,
    padding: 12,
    marginLeft: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#DC2626',
    flex: 1,
  },
  statusContainer: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  cancelledStatus: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C59DB',
  },
  cancelledStatusText: {
    color: '#DC2626',
  },
  cancellationReason: {
    fontSize: 14,
    color: '#DC2626',
    marginTop: 4,
  },
  timelineContainer: {
    marginTop: 16,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#2C59DB',
    borderColor: '#2C59DB',
  },
  activeStepCircleDark: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
  },
  activeStepLine: {
    backgroundColor: '#2C59DB',
  },
  activeStepLineDark: {
    backgroundColor: '#3B82F6',
  },
  stepLabel: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
    paddingTop: 2,
  },
  activeStepLabel: {
    fontWeight: '600',
    color: '#2C59DB',
  },
  activeStepLabelDark: {
    color: '#3B82F6',
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
  paymentStatus: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  paidStatus: {
    color: '#059669',
    fontWeight: '600',
  },
  refundedStatus: {
    color: '#DC2626',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C59DB',
  },
  discountValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  orderItem: {
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  itemBorderDark: {
    borderBottomColor: '#374151',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 6,
  },
  itemPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerDark: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
  textDark: {
    color: '#F3F4F6',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
});

export default TrackOrderScreen; 