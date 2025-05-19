import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/stores/user.store';
import { useOrders } from '@/lib/hooks/use-queries';
import { OrderStatus } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QueryParams } from '@/types/common';

// Define the order type with items relation
interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  price: number;
  originalPrice: number;
  appliedRole: string;
  customerNote?: string | null;
  size?: string | null;
}

interface Order {
  id: string;
  customerId: string;
  processedById: string | null;
  orderDate: Date;
  status: OrderStatus;
  paymentStatus: string;
  cancellationReason?: string | null;
  totalAmount: number;
  discountAmount: number;
  estimatedDelivery: Date;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItem[];
}

// Status filter options
const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'READY', label: 'Ready' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

// Date filters
const DATE_FILTERS = [
  { id: 'ALL', label: 'All Time' },
  { id: 'MONTH', label: 'This Month' },
  { id: '3MONTHS', label: 'Last 3 Months' },
  { id: '6MONTHS', label: 'Last 6 Months' },
  { id: 'YEAR', label: 'This Year' },
];

const OrdersScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useUserStore();
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Build query params
  const getQueryParams = () => {
    const params: QueryParams = {
      where: { customerId: user?.id || '' },
      orderBy: { createdAt: 'desc' },
      include: { orderItems: true }
    };
    
    // Add status filter
    if (statusFilter !== 'ALL') {
      params.where = { 
        ...params.where,
        status: statusFilter as OrderStatus 
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
    
    // Search text
    if (searchText.trim()) {
      params.where = {
        ...params.where,
        OR: [{ id: { contains: searchText.trim() } }]
      };
    }
    
    return params;
  };

  // Fetch orders with filters
  const { data, isLoading, refetch } = useOrders(getQueryParams());
  const orders = (data?.data || []) as Order[];

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle search
  const handleSearch = () => {
    setIsSearching(true);
    refetch().then(() => setIsSearching(false));
  };
  
  // Navigate to order details / tracking
  const navigateToOrderDetails = (orderId: string) => {
    router.push({
      pathname: '/track-order',
      params: { orderId }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          title: 'My Orders',
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
              placeholder="Search by order number"
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

        {/* Filters */}
        <View className="mb-4">
          <Text className="text-neutral-700 dark:text-neutral-300 mb-2 font-medium">Status Filter</Text>
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
      
      {/* Orders List */}
      <ScrollView className="flex-1 px-4">
        {isLoading ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#2C59DB" />
            <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
              Loading orders...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <FontAwesome name="shopping-bag" size={50} color={isDark ? "#4B5563" : "#D1D5DB"} />
            <Text className="mt-4 text-neutral-500 dark:text-neutral-400 text-center">
              No orders found
            </Text>
            <Text className="mt-2 text-neutral-500 dark:text-neutral-400 text-center">
              {searchText || statusFilter !== 'ALL' || dateFilter !== 'ALL' 
                ? "Try changing your filters" 
                : "Start shopping to see your orders here"}
            </Text>
            {!searchText && statusFilter === 'ALL' && dateFilter === 'ALL' && (
              <Button
                title="Browse Products"
                className="mt-4 bg-primary"
                onPress={() => router.push('/products')}
              />
            )}
          </View>
        ) : (
          <View className="py-2">
            {orders.map((order) => (
              <Card key={order.id} className="mb-4 overflow-hidden">
                <View className="p-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-bold text-neutral-800 dark:text-white">
                      Order #{order.id.slice(0, 8)}
                    </Text>
                    <View className={`px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 dark:bg-green-900' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 dark:bg-blue-900' :
                          order.status === 'READY' ? 'bg-yellow-100 dark:bg-yellow-900' :
                            order.status === 'CANCELLED' ? 'bg-red-100 dark:bg-red-900' :
                              'bg-neutral-100 dark:bg-neutral-700'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        order.status === 'DELIVERED' ? 'text-green-800 dark:text-green-300' :
                          order.status === 'PROCESSING' ? 'text-blue-800 dark:text-blue-300' :
                            order.status === 'READY' ? 'text-yellow-800 dark:text-yellow-300' :
                              order.status === 'CANCELLED' ? 'text-red-800 dark:text-red-300' :
                                'text-neutral-800 dark:text-neutral-300'
                      }`}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between mb-3">
                    <Text className="text-neutral-600 dark:text-neutral-400">
                      {formatDate(order.createdAt)}
                    </Text>
                    <Text className="font-bold text-primary">
                      ${order.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <FontAwesome 
                        name={
                          order.paymentStatus === 'PAID' ? 'check-circle' :
                            order.paymentStatus === 'PENDING' ? 'clock-o' :
                              order.paymentStatus === 'DOWNPAYMENT' ? 'dollar' : 'times-circle'
                        } 
                        size={14}
                        color={
                          order.paymentStatus === 'PAID' ? '#10B981' :
                            order.paymentStatus === 'PENDING' ? '#FBBF24' :
                              order.paymentStatus === 'DOWNPAYMENT' ? '#3B82F6' : '#EF4444'
                        }
                        style={{ marginRight: 5 }}
                      />
                      <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                        {order.paymentStatus}
                      </Text>
                    </View>
                    
                    <View className="flex-row">
                      <Button
                        title="Track Order"
                        variant="outline"
                        size="sm"
                        icon="map-marker"
                        className="mr-2"
                        onPress={() => navigateToOrderDetails(order.id)}
                      />
                      <Button
                        title="Details"
                        size="sm"
                        icon="chevron-right"
                        iconPosition="right"
                        onPress={() => navigateToOrderDetails(order.id)}
                      />
                    </View>
                  </View>
                  
                  <View className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                      {order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''}
                    </Text>
                    <Text className="text-neutral-500 dark:text-neutral-400 text-sm" numberOfLines={1}>
                      {order.orderItems?.map(item => `${item.quantity}x ${item.variantId.slice(0, 6)}`).join(', ')}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen; 