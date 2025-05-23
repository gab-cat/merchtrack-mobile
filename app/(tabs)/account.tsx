import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/stores/user.store';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useOrders, usePayments } from '@/lib/hooks/use-queries';

// Define allowed routes for type checking
type AppRoute = '/' | '/account/orders' | '/account/payments' | '/products';

// Define Payment interface - using unknown for metadata to avoid any
interface Payment {
  id: string;
  userId: string;
  orderId: string;
  processedById?: string | null;
  paymentDate: Date;
  amount: number | { toFixed: (digits: number) => string };
  paymentStatus: string;
  referenceNo?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: unknown;
}

interface AccountOption {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  route?: AppRoute;
  action?: () => void;
  description?: string;
}

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const { user, clearUser } = useUserStore();
  const router = useRouter();

  const { signOut } = useAuth();
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [userData, setUserData] = React.useState(user);

  const { user: clerkUser } = useUser();

  React.useEffect(() => {
    setUserData(user);
    setIsLoadingUser(false);
  }, [user]);

  // Recent orders query - limited to 3
  const { data: recentOrdersData, isLoading: isLoadingOrders } = useOrders({
    take: 3,
    limit: 3,
    where: { customerId: user?.id as string },
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: true
    }
  });

  const recentOrders = recentOrdersData?.data;

  // Recent payments query - limited to 3
  const { data: recentPaymentsData, isLoading: isLoadingPayments } = usePayments({
    take: 3,
    where: { userId: user?.id as string },
    orderBy: { createdAt: 'desc' },
  });

  const recentPayments = recentPaymentsData?.data;

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
      clearUser();
      router.replace('/sign-in');
    },
  });


  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logoutMutation.mutate(), style: 'destructive' }
      ]
    );
  };

  const accountOptions: AccountOption[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      icon: 'user-circle',
      route: '/',
      description: 'Update your personal information and preferences'
    },
    {
      id: 'orders',
      title: 'My Orders',
      icon: 'shopping-bag',
      route: '/account/orders',
      description: 'View and track your order history'
    },
    {
      id: 'payments',
      title: 'Payment Methods',
      icon: 'credit-card',
      route: '/account/payments',
      description: 'Manage your saved payment methods'
    },
    {
      id: 'addresses',
      title: 'Shipping Addresses',
      icon: 'map-marker',
      route: '/',
      description: 'Manage your shipping addresses'
    },
    {
      id: 'settings',
      title: 'Account Settings',
      icon: 'cog',
      route: '/',
      description: 'Notification preferences, privacy settings, and more'
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'question-circle',
      route: '/',
      description: 'Get help with orders, returns, and other issues'
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'sign-out',
      action: handleLogout,
      description: 'Sign out from your account'
    },
  ];

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleDateString(undefined);
  };

  // Helper function to get payment status class
  const getPaymentStatusClass = (status: string) => {
    if (status === 'PAID' || status === 'COMPLETED' || status === 'VERIFIED') {
      return 'bg-green-100 text-green-800';
    } else if (status === 'PENDING' || status === 'PROCESSING') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'DECLINED') {
      return 'bg-red-100 text-red-800';
    } else if (status === 'REFUNDED' || status === 'REFUND_PENDING') {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView className="flex-1">
        {/* Header/Profile Section */}
        <View className="bg-primary p-5 pb-8 rounded-b-3xl shadow-sm mb-6">
          <View className="flex-row items-center">
            <Image 
              source={{ 
                uri: clerkUser?.imageUrl ?? `https://ui-avatars.com/api/?name=${user?.firstName ?? 'User'}&background=2C59DB&color=fff` 
              }}
              className="w-20 h-20 rounded-full border-2 border-white"
            />
            <View className="ml-4">
              <Text className="text-white text-xl font-bold">
                {isLoadingUser ? 'Loading...' : `${userData?.firstName} ${userData?.lastName}` }  
              </Text>
              <Text className="text-white/80">
                {userData?.email ?? 'No email provided'}
              </Text>
              <TouchableOpacity className="flex-row items-center mt-2" onPress={() => router.push('/')}>
                <Text className="text-white mr-1">Edit Profile</Text>
                <FontAwesome name="pencil" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-neutral-800 dark:text-white">
              Recent Orders
            </Text>
            <TouchableOpacity onPress={() => router.push('/account/orders' as AppRoute)}>
              <Button
                title="View All"
                variant="outline"
                size="sm"
                icon="chevron-right"
                iconPosition="right"
                onPress={() => {}}
                className="border-0"
              />
            </TouchableOpacity>
          </View>
          
          {isLoadingOrders ? (
            <Card className="p-4">
              <Text className="text-neutral-500">Loading your orders...</Text>
            </Card>
          ) : recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                onPress={() => router.push({
                  pathname: '/track-order',
                  params: { orderId: order.id }
                })}
              >
                <Card className="p-4 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-medium text-neutral-800 dark:text-white">
                      Order #{order.id.slice(0, 6)}
                    </Text>
                    <Text className={`text-xs font-medium px-2 py-1 rounded-full ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </Text>
                  </View>
                  <Text className="text-neutral-500 dark:text-neutral-400 mb-2">
                    Placed on {formatDate(order.createdAt)}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-primary font-bold">
                      ${order.totalAmount?.toFixed(2)}
                    </Text>
                    <FontAwesome name="chevron-right" size={14} color="#ADB5BD" />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Card className="p-4 items-center justify-center">
              <FontAwesome name="shopping-bag" size={24} color="#ADB5BD" className="mb-2" />
              <Text className="text-neutral-500 dark:text-neutral-400 text-center">
                You don&apos;t have any orders yet
              </Text>
              <TouchableOpacity onPress={() => router.push('/products' as AppRoute)}>
                <Button
                  title="Start Shopping"
                  variant="outline"
                  size="sm"
                  icon="shopping-cart"
                  onPress={() => {}}
                  className="mt-2"
                />
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* Recent Payments Section */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-neutral-800 dark:text-white">
              Recent Payments
            </Text>
            <TouchableOpacity onPress={() => router.push('/account/payments' as AppRoute)}>
              <Button
                title="View All"
                variant="outline"
                size="sm"
                icon="chevron-right"
                iconPosition="right"
                onPress={() => {}}
                className="border-0"
              />
            </TouchableOpacity>
          </View>
          
          {isLoadingPayments ? (
            <Card className="p-4">
              <Text className="text-neutral-500">Loading your payments...</Text>
            </Card>
          ) : recentPayments && recentPayments.length > 0 ? (
            (recentPayments as unknown as Payment[]).map((payment) => (
              <Card key={payment.id} className="p-4 mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <FontAwesome 
                      name="credit-card"
                      size={16} 
                      color="#2C59DB" 
                      style={{ marginRight: 8 }}
                    />
                    <Text className="font-medium text-neutral-800 dark:text-white">
                      Payment #{payment.id.slice(0, 6)}
                    </Text>
                  </View>
                  <Text className={`text-xs font-medium px-2 py-1 rounded-full ${getPaymentStatusClass(payment.paymentStatus)}`}>
                    {payment.paymentStatus || 'Unknown'}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-neutral-500 dark:text-neutral-400">
                    {formatDate(payment.createdAt)}
                  </Text>
                  <Text className="text-primary font-bold">
                    ${payment.amount?.toFixed(2)}
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <Card className="p-4 items-center justify-center">
              <FontAwesome name="credit-card" size={24} color="#ADB5BD" className="mb-2" />
              <Text className="text-neutral-500 dark:text-neutral-400 text-center">
                No payment history found
              </Text>
            </Card>
          )}
        </View>

        {/* Account Options */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-neutral-800 dark:text-white mb-4">
            Account Settings
          </Text>
          {accountOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                if (option.action) {
                  option.action();
                } else if (option.route) {
                  router.push(option.route);
                }
              }}
              className={`flex-row items-center mb-3 p-4 bg-white dark:bg-neutral-800 rounded-xl ${option.id === 'logout' ? 'border border-red-300 dark:border-red-800' : ''}`}
            >
              <View className={`w-10 h-10 rounded-full flex items-center justify-center ${option.id === 'logout' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
                <FontAwesome 
                  name={option.icon} 
                  size={18} 
                  color={option.id === 'logout' ? '#EF4444' : '#2C59DB'} 
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${option.id === 'logout' ? 'text-red-600 dark:text-red-400' : 'text-neutral-800 dark:text-white'}`}>
                  {option.title}
                </Text>
                {option.description && (
                  <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {option.description}
                  </Text>
                )}
              </View>
              {option.route && (
                <FontAwesome name="chevron-right" size={14} color="#ADB5BD" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App Information */}
        <View className="px-4 pb-8 items-center">
          <Text className="text-neutral-400 dark:text-neutral-500 text-xs">
            App Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}