import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/stores/user.store';
import { usePayments } from '@/lib/hooks/use-queries';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QueryParams } from '@/types/common';

// Define the payment type
interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  processedById?: string | null;
  paymentDate: Date;
  amount: number;
  method: string;
  status: string;
  transactionId?: string;
  referenceNo?: string;
  last4?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Status filter options
const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'REFUNDED', label: 'Refunded' },
];

// Date filters
const DATE_FILTERS = [
  { id: 'ALL', label: 'All Time' },
  { id: 'MONTH', label: 'This Month' },
  { id: '3MONTHS', label: 'Last 3 Months' },
  { id: '6MONTHS', label: 'Last 6 Months' },
  { id: 'YEAR', label: 'This Year' },
];

// Payment methods
const PAYMENT_METHODS = [
  { id: 'ALL', label: 'All Methods' },
  { id: 'CREDIT_CARD', label: 'Credit Card' },
  { id: 'DEBIT_CARD', label: 'Debit Card' },
  { id: 'PAYPAL', label: 'PayPal' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { id: 'CASH', label: 'Cash' },
];

const PaymentsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useUserStore();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Build query params
  const getQueryParams = () => {
    const params: QueryParams = {
      where: { userId: user?.id || '' },
      orderBy: { createdAt: 'desc' },
      include: { order: true }
    };
    
    // Add status filter
    if (statusFilter !== 'ALL') {
      params.where = {
        ...params.where,
        status: statusFilter
      };
    }
    
    // Add method filter
    if (methodFilter !== 'ALL') {
      params.where = {
        ...params.where,
        method: methodFilter
      };
    }
    
    // Add date filter
    const now = new Date();
    if (dateFilter === 'MONTH') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      params.where = {
        ...params.where,
        createdAt: { gte: monthStart }
      };
    } else if (dateFilter === '3MONTHS') {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      params.where = {
        ...params.where,
        createdAt: { gte: threeMonthsAgo }
      };
    } else if (dateFilter === '6MONTHS') {
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      params.where = {
        ...params.where,
        createdAt: { gte: sixMonthsAgo }
      };
    } else if (dateFilter === 'YEAR') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      params.where = {
        ...params.where,
        createdAt: { gte: yearStart }
      };
    }
    
    // Search text (reference number, transaction ID)
    if (searchText.trim()) {
      params.where = {
        ...params.where,
        OR: [
          { transactionId: { contains: searchText.trim() } },
          { referenceNo: { contains: searchText.trim() } }
        ]
      };
    }
    
    return params;
  };
  
  // Fetch payments with filters
  const { data, isLoading, refetch } = usePayments(getQueryParams());
  const payments = (data?.data || []) as unknown as Payment[];
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format time
  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Handle search
  const handleSearch = () => {
    setIsSearching(true);
    refetch().then(() => setIsSearching(false));
  };
  
  // View payment details
  const viewPaymentDetails = (payment: Payment) => {
    Alert.alert(
      `Payment #${payment.id.slice(0, 8)}`,
      `Transaction ID: ${payment.transactionId || 'N/A'}\n` +
      `Reference: ${payment.referenceNo || 'N/A'}\n` +
      `Amount: $${payment.amount.toFixed(2)}\n` +
      `Method: ${payment.method}\n` +
      `Status: ${payment.status}\n` +
      `Date: ${formatDate(payment.createdAt)} ${formatTime(payment.createdAt)}`,
      [{ text: 'OK' }]
    );
  };
  
  // View related order (if one exists)
  const viewRelatedOrder = (payment: Payment) => {
    if (payment.orderId) {
      router.push({
        pathname: '/track-order',
        params: { orderId: payment.orderId }
      });
    } else {
      Alert.alert(
        'No Order Found',
        'This payment is not associated with any order.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Get icon for payment method
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
    case 'CREDIT_CARD':
    case 'DEBIT_CARD':
      return 'credit-card';
    case 'PAYPAL':
      return 'paypal';
    case 'BANK_TRANSFER':
      return 'bank';
    case 'CASH':
      return 'money';
    default:
      return 'credit-card';
    }
  };
  
  // Get color for payment status
  const getStatusColor = (status: string, isDarkMode: boolean) => {
    switch (status) {
    case 'COMPLETED':
      return {
        bg: isDarkMode ? 'bg-green-900' : 'bg-green-100',
        text: isDarkMode ? 'text-green-300' : 'text-green-800'
      };
    case 'PENDING':
    case 'PROCESSING':
      return {
        bg: isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100',
        text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
      };
    case 'FAILED':
      return {
        bg: isDarkMode ? 'bg-red-900' : 'bg-red-100',
        text: isDarkMode ? 'text-red-300' : 'text-red-800'
      };
    case 'REFUNDED':
      return {
        bg: isDarkMode ? 'bg-blue-900' : 'bg-blue-100',
        text: isDarkMode ? 'text-blue-300' : 'text-blue-800'
      };
    default:
      return {
        bg: isDarkMode ? 'bg-neutral-700' : 'bg-neutral-100',
        text: isDarkMode ? 'text-neutral-300' : 'text-neutral-800'
      };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          title: 'Payment History',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 10 }}>
              <FontAwesome name="arrow-left" size={22} color={isDark ? "#ccc" : "#888"} />
            </TouchableOpacity>
          )
        }}
      />
      
      <View className="px-4 py-3">
        {/* Search Bar */}
        <View className="flex-row mb-4">
          <View className="flex-1 flex-row items-center bg-white dark:bg-neutral-800 rounded-lg px-3 mr-2">
            <FontAwesome name="search" size={16} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
            <TextInput
              className="flex-1 py-2 px-2 text-neutral-800 dark:text-white"
              placeholder="Search by reference or transaction ID"
              placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity 
            className={`justify-center px-3 rounded-lg ${isSearching ? "bg-neutral-400" : "bg-primary"}`}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text className="text-white font-medium">Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <View className="mb-4">
          <Text className="text-neutral-700 dark:text-neutral-300 mb-2 font-medium">Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    statusFilter === filter.id 
                      ? "bg-primary" 
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                  onPress={() => setStatusFilter(filter.id)}
                >
                  <Text 
                    className={`${
                      statusFilter === filter.id 
                        ? "text-white" 
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Method Filter */}
        <View className="mb-4">
          <Text className="text-neutral-700 dark:text-neutral-300 mb-2 font-medium">Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {PAYMENT_METHODS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    methodFilter === filter.id 
                      ? "bg-primary" 
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                  onPress={() => setMethodFilter(filter.id)}
                >
                  <Text 
                    className={`${
                      methodFilter === filter.id 
                        ? "text-white" 
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        {/* Date Filter */}
        <View className="mb-4">
          <Text className="text-neutral-700 dark:text-neutral-300 mb-2 font-medium">Date Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {DATE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    dateFilter === filter.id 
                      ? "bg-primary" 
                      : "bg-neutral-200 dark:bg-neutral-700"
                  }`}
                  onPress={() => setDateFilter(filter.id)}
                >
                  <Text 
                    className={`${
                      dateFilter === filter.id 
                        ? "text-white" 
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
      
      {/* Payments List */}
      <ScrollView className="flex-1 px-4">
        {isLoading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#2C59DB" />
            <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
              Loading payment history...
            </Text>
          </View>
        ) : payments.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <FontAwesome name="credit-card" size={50} color={isDark ? "#4B5563" : "#D1D5DB"} />
            <Text className="mt-4 text-neutral-500 dark:text-neutral-400 text-center">
              No payment records found
            </Text>
            <Text className="mt-2 text-neutral-500 dark:text-neutral-400 text-center">
              {searchText || statusFilter !== 'ALL' || methodFilter !== 'ALL' || dateFilter !== 'ALL' 
                ? "Try changing your filters" 
                : "Your payment history will appear here"}
            </Text>
            
            {!searchText && statusFilter === 'ALL' && methodFilter === 'ALL' && dateFilter === 'ALL' && (
              <Button
                title="Browse Products"
                className="mt-4 bg-primary"
                onPress={() => router.push('/products')}
              />
            )}
          </View>
        ) : (
          <View className="py-2">
            {payments.map((payment) => {
              const statusStyle = getStatusColor(payment.status, isDark);
              
              return (
                <Card key={payment.id} className="mb-4 overflow-hidden">
                  <View className="p-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3`}>
                          <FontAwesome 
                            name={getPaymentMethodIcon(payment.method)} 
                            size={16} 
                            color="#2C59DB" 
                          />
                        </View>
                        <View>
                          <Text className="font-bold text-neutral-800 dark:text-white">
                            Payment #{payment.id.slice(0, 8)}
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            {payment.method}
                            {payment.last4 ? ` •••• ${payment.last4}` : ''}
                          </Text>
                        </View>
                      </View>
                      
                      <View className={`px-2 py-1 rounded-full ${statusStyle.bg}`}>
                        <Text className={`text-xs font-medium ${statusStyle.text}`}>
                          {payment.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-neutral-600 dark:text-neutral-400">
                        {formatDate(payment.createdAt)} • {formatTime(payment.createdAt)}
                      </Text>
                      <Text className="font-bold text-primary">
                        ${payment.amount?.toFixed(2)}
                      </Text>
                    </View>
                    
                    {payment.referenceNo && (
                      <Text className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                        Ref: {payment.referenceNo}
                      </Text>
                    )}
                    
                    <View className="flex-row justify-between">
                      <Button
                        title="View Details"
                        variant="outline"
                        size="sm"
                        icon="info-circle"
                        onPress={() => viewPaymentDetails(payment)}
                      />
                      
                      {payment.orderId && (
                        <Button
                          title="View Order"
                          size="sm"
                          icon="shopping-bag"
                          onPress={() => viewRelatedOrder(payment)}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentsScreen; 