import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/stores/user.store';
import { useApiClient } from '@/lib/api';
import { ApiResponse } from '@/types/common';
import { Order, Payment } from '@prisma/client';
import { useAuth } from '@clerk/clerk-expo';
import { useUserImageQuery } from '@/lib/hooks/use-queries';

interface AccountOption {
  id: string;
  title: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  route?: string;
  action?: () => void;
  description?: string;
}

export default function AccountScreen() {
  const colorScheme = useColorScheme();
  const { user, clearUser, userId } = useUserStore();
  const router = useRouter();
  const api = useApiClient();
  const { signOut } = useAuth();
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [userData, setUserData] = React.useState(user);
  const [userImageState, setUserImageState] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUserData(user);
    setIsLoadingUser(false);
  }, [user]);

  const { data: userImage } = useUserImageQuery(user?.clerkId as string);

  React.useEffect(() => {
    if (userImage) {
      setUserImageState(userImage.data);
    }
  }, [userImage]);

  // Recent orders query - limited to 3
  const { data: recentOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', 'recent', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.post('/orders', {
        take: 3,
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: true
        }
      });
      return (response as ApiResponse<Order[]>).data;
    },
    enabled: !!userId,
  });

  // Recent payments query - limited to 3
  const { data: recentPayments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments', 'recent', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.post('/payments', {
        take: 3,
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
      });
      return (response as ApiResponse<Payment[]>).data;
    },
    enabled: !!userId,
  });

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
      route: '/account/profile',
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
      route: '/account/addresses',
      description: 'Manage your shipping addresses'
    },
    {
      id: 'settings',
      title: 'Account Settings',
      icon: 'cog',
      route: '/account/settings',
      description: 'Notification preferences, privacy settings, and more'
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'question-circle',
      route: '/account/help',
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

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView className="flex-1">
        {/* Header/Profile Section */}
        <View className="bg-primary p-5 pb-8 rounded-b-3xl shadow-sm mb-6">
          <View className="flex-row items-center">
            <Image 
              source={{ 
                uri: userImageState ?? `https://ui-avatars.com/api/?name=${user?.firstName ?? 'User'}&background=2C59DB&color=fff` 
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
              <Link href="/account/profile" asChild>
                <TouchableOpacity className="flex-row items-center mt-2">
                  <Text className="text-white mr-1">Edit Profile</Text>
                  <FontAwesome name="pencil" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-neutral-800 dark:text-white">
              Recent Orders
            </Text>
            <Link href="/account/orders" asChild>
              <Button
                title="View All"
                variant="outline"
                size="sm"
                icon="chevron-right"
                iconPosition="right"
                onPress={() => {}}
                className="border-0"
              />
            </Link>
          </View>
          
          {isLoadingOrders ? (
            <Card className="p-4">
              <Text className="text-neutral-500">Loading your orders...</Text>
            </Card>
          ) : recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} asChild>
                <Card className="p-4 mb-3">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-medium text-neutral-800 dark:text-white">
                      Order #{order.id}
                    </Text>
                    <Text className={`text-xs font-medium px-2 py-1 rounded-full ${
                      order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
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
              </Link>
            ))
          ) : (
            <Card className="p-4 items-center justify-center">
              <FontAwesome name="shopping-bag" size={24} color="#ADB5BD" className="mb-2" />
              <Text className="text-neutral-500 dark:text-neutral-400 text-center">
                You don't have any orders yet
              </Text>
              <Link href="/products" asChild>
                <Button
                  title="Start Shopping"
                  variant="outline"
                  size="sm"
                  icon="shopping-cart"
                  onPress={() => {}}
                  className="mt-2"
                />
              </Link>
            </Card>
          )}
        </View>

        {/* Recent Payments Section */}
        <View className="px-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-neutral-800 dark:text-white">
              Recent Payments
            </Text>
            <Link href="/account/payments" asChild>
              <Button
                title="View All"
                variant="outline"
                size="sm"
                icon="chevron-right"
                iconPosition="right"
                onPress={() => {}}
                className="border-0"
              />
            </Link>
          </View>
          
          {isLoadingPayments ? (
            <Card className="p-4">
              <Text className="text-neutral-500">Loading your payments...</Text>
            </Card>
          ) : recentPayments && recentPayments.length > 0 ? (
            recentPayments.map((payment) => (
              <Card key={payment.id} className="p-4 mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <FontAwesome 
                      name={payment.method === 'CREDIT_CARD' ? 'credit-card' : 
                        payment.method === 'PAYPAL' ? 'paypal' : 'money'}
                      size={16} 
                      color="#2C59DB" 
                      style={{ marginRight: 8 }}
                    />
                    <Text className="font-medium text-neutral-800 dark:text-white">
                      {payment.method} {payment.last4 ? `****${payment.last4}` : ''}
                    </Text>
                  </View>
                  <Text className={`text-xs font-medium px-2 py-1 rounded-full ${
                    payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-neutral-100 text-neutral-800'
                  }`}>
                    {payment.status}
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
              onPress={() => option.action ? option.action() : router.push(option.route)}
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