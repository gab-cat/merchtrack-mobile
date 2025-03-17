import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight } from 'react-native-reanimated';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useColorScheme } from '@/components/useColorScheme';
import { useUserStore } from '@/stores/user.store';
import { useApiClient } from '@/lib/api';

// Ticket status types with icons
const ticketStatus = {
  OPEN: { 
    color: 'bg-green-100 text-green-800', 
    label: 'Open',
    icon: 'envelope-open'
  },
  IN_PROGRESS: { 
    color: 'bg-blue-100 text-blue-800', 
    label: 'In Progress',
    icon: 'spinner'
  },
  RESOLVED: { 
    color: 'bg-gray-100 text-gray-800', 
    label: 'Resolved',
    icon: 'check-circle'
  },
  CLOSED: { 
    color: 'bg-red-100 text-red-800', 
    label: 'Closed',
    icon: 'times-circle'
  },
};

// Priority icons and colors
const priorityConfig = {
  LOW: { 
    color: 'bg-blue-50 border-blue-200',
    activeColor: 'bg-blue-500',
    icon: 'arrow-down'
  },
  MEDIUM: { 
    color: 'bg-yellow-50 border-yellow-200',
    activeColor: 'bg-yellow-500',
    icon: 'minus'
  },
  HIGH: { 
    color: 'bg-orange-50 border-orange-200',
    activeColor: 'bg-orange-500',
    icon: 'arrow-up'
  },
  URGENT: { 
    color: 'bg-red-50 border-red-200',
    activeColor: 'bg-red-500',
    icon: 'exclamation'
  },
};

// Define schema for new ticket form
const newTicketSchema = z.object({
  subject: z.string().min(5, 'Subject is required and must be at least 5 characters'),
  description: z.string().min(10, 'Description is required and must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

type NewTicketFormValues = z.infer<typeof newTicketSchema>;

export default function TicketsScreen() {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const api = useApiClient();
  
  // Form setup with zod validation
  const { control, handleSubmit, formState: { errors }, reset } = useForm<NewTicketFormValues>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  // Fetch user tickets
  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [], metadata: { total: 0 } };
      const response = await api.post('/tickets', {
        where: { createdById: user.id },
        orderBy: { createdAt: 'desc' },
      });
      return response;
    },
    enabled: !!user?.id,
  });

  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: NewTicketFormValues) => {
      return api.post('/api/tickets/create', {
        ...data,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setShowNewTicketForm(false);
      reset();
      Alert.alert('Success', 'Your support ticket has been created.');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
      console.error('Failed to create ticket:', error);
    },
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const onSubmitTicket = (data: NewTicketFormValues) => {
    createTicketMutation.mutate(data);
  };

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleDateString(undefined);
  };

  // Toggle form with animation
  const toggleNewTicketForm = () => {
    setShowNewTicketForm(!showNewTicketForm);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-900">
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Animated Header */}
      <Animated.View 
        className="px-4 pt-6 pb-6 bg-primary shadow-md"
        entering={FadeIn}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <FontAwesome name="ticket" size={24} color="#FFFFFF" />
            <Text className="text-2xl font-bold text-white ml-2">My Tickets</Text>
          </View>
          <Button
            title={showNewTicketForm ? "Cancel" : "New Ticket"}
            variant={showNewTicketForm ? "outline" : "primary"}
            size="sm"
            icon={showNewTicketForm ? "times" : "plus"}
            className={showNewTicketForm ? "bg-white/20 border-white/30" : "bg-white text-primary"}
            onPress={toggleNewTicketForm}
            iconColor={showNewTicketForm ? "#FFFFFF" : "#2C59DB"}
          />
        </View>
      </Animated.View>
      
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* New Ticket Form with animation */}
        {showNewTicketForm && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <Card className="p-4 mb-6 shadow-sm">
              <View className="flex-row items-center mb-4">
                <FontAwesome name="plus-circle" size={18} color="#2C59DB" />
                <Text className="text-lg font-bold text-neutral-800 dark:text-white ml-2">
                  Create New Support Ticket
                </Text>
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2 flex-row items-center">
                  <FontAwesome name="tag" size={14} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} />
                  <Text className="ml-2">Subject</Text>
                </Text>
                <TextInput
                  control={control}
                  name="subject"
                  placeholder="Enter ticket subject"
                  error={errors.subject?.message}
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2 flex-row items-center">
                  <FontAwesome name="file-text" size={14} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} />
                  <Text className="ml-2">Description</Text>
                </Text>
                <TextInput
                  control={control}
                  name="description"
                  placeholder="Describe your issue in detail"
                  multiline
                  numberOfLines={4}
                  error={errors.description?.message}
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2 flex-row items-center">
                  <FontAwesome name="flag" size={14} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} />
                  <Text className="ml-2">Priority</Text>
                </Text>
                <View className="flex-row flex-wrap">
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                        control._formValues.priority === priority
                          ? priorityConfig[priority as keyof typeof priorityConfig].activeColor
                          : priorityConfig[priority as keyof typeof priorityConfig].color
                      } flex-row items-center`}
                      onPress={() => control._setValue('priority', priority)}
                    >
                      <FontAwesome 
                        name={priorityConfig[priority as keyof typeof priorityConfig].icon} 
                        size={12} 
                        color={control._formValues.priority === priority ? "#FFFFFF" : "#6B7280"} 
                        className="mr-1" 
                      />
                      <Text
                        className={`${
                          control._formValues.priority === priority
                            ? 'text-white'
                            : 'text-neutral-800 dark:text-white'
                        } ml-1`}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.priority?.message && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.priority?.message}
                  </Text>
                )}
              </View>
              
              <Button
                title="Submit Ticket"
                variant="primary"
                icon="paper-plane"
                onPress={handleSubmit(onSubmitTicket)}
                isLoading={createTicketMutation.isPending}
                disabled={createTicketMutation.isPending}
              />
            </Card>
          </Animated.View>
        )}

        {/* Tickets List with animation */}
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#2C59DB" />
          </View>
        ) : tickets?.data && tickets.data.length > 0 ? (
          <>
            <Animated.View entering={FadeIn}>
              <View className="flex-row items-center mb-4">
                <FontAwesome name="list-alt" size={16} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} />
                <Text className="text-neutral-600 dark:text-neutral-400 ml-2">
                  {tickets.metadata?.total || 0} Support Tickets
                </Text>
              </View>
            </Animated.View>
            
            {tickets.data.map((ticket: any, index: number) => (
              <Animated.View 
                key={ticket.id} 
                entering={FadeInDown.delay(index * 100).springify()}
              >
                <Link href={`/ticket/${ticket.id}`} asChild>
                  <Card className="mb-4 overflow-hidden border-l-4 border-primary shadow-sm">
                    <View className="p-4">
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-1">
                          <Text className="font-medium text-neutral-800 dark:text-white" numberOfLines={1}>
                            {ticket.subject}
                          </Text>
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400 flex-row items-center">
                            <FontAwesome name="hashtag" size={10} color="#ADB5BD" />
                            <Text> {ticket.id.slice(0, 8)} • {formatDate(ticket.createdAt)}</Text>
                          </Text>
                        </View>
                        <View className={`flex-row items-center px-2 py-1 rounded-full ${
                          ticketStatus[ticket.status]?.color || 'bg-neutral-100 text-neutral-800'
                        }`}>
                          <FontAwesome 
                            name={ticketStatus[ticket.status]?.icon || 'circle'} 
                            size={10} 
                            color={ticket.status === 'OPEN' ? '#047857' : 
                              ticket.status === 'IN_PROGRESS' ? '#1E40AF' : 
                                ticket.status === 'RESOLVED' ? '#4B5563' : '#B91C1C'} 
                          />
                          <Text className={`text-xs font-medium ml-1 ${
                            ticketStatus[ticket.status]?.color || 'text-neutral-800'
                          }`}>
                            {ticketStatus[ticket.status]?.label || ticket.status}
                          </Text>
                        </View>
                      </View>
                      
                      <Text className="text-neutral-600 dark:text-neutral-300 text-sm mb-3" numberOfLines={2}>
                        {ticket.description}
                      </Text>
                      
                      {/* Last message preview with animation */}
                      {ticket.messages && ticket.messages.length > 0 && (
                        <Animated.View 
                          className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg"
                          entering={SlideInRight.delay(200 + index * 50)}
                        >
                          <View className="flex-row justify-between">
                            <View className="flex-row items-center">
                              <FontAwesome 
                                name={ticket.messages[0].isFromSupport ? "headset" : "user"} 
                                size={12} 
                                color="#ADB5BD" 
                              />
                              <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-1">
                                {ticket.messages[0].isFromSupport ? 'Support' : 'You'}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <FontAwesome name="clock-o" size={12} color="#ADB5BD" />
                              <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                                {formatDate(ticket.messages[0].createdAt)}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-neutral-600 dark:text-neutral-300 text-sm" numberOfLines={2}>
                            {ticket.messages[0].content}
                          </Text>
                        </Animated.View>
                      )}
                      
                      <View className="flex-row justify-between items-center mt-3">
                        <View className="flex-row items-center">
                          <FontAwesome name="comments" size={14} color="#ADB5BD" />
                          <Text className="text-neutral-500 dark:text-neutral-400 text-xs ml-1">
                            {ticket._count?.messages || 0} messages
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-primary font-medium text-sm mr-1">View Details</Text>
                          <FontAwesome name="chevron-right" size={12} color="#2C59DB" />
                        </View>
                      </View>
                    </View>
                  </Card>
                </Link>
              </Animated.View>
            ))}
          </>
        ) : (
          <Animated.View 
            className="items-center justify-center py-16"
            entering={FadeIn.delay(300)}
          >
            <FontAwesome name="ticket" size={64} color="#ADB5BD" className="mb-4" />
            <Text className="text-neutral-500 dark:text-neutral-400 mt-2 text-center text-lg">
              You don't have any support tickets yet
            </Text>
            <Text className="text-neutral-400 dark:text-neutral-500 text-center mb-4">
              Create a ticket if you need any assistance
            </Text>
            <Button
              title="Create New Ticket"
              variant="primary"
              icon="plus"
              size="md"
              onPress={toggleNewTicketForm}
              className="mt-2"
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}