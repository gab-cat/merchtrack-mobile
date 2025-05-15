import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal, TextInput as RNTextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeIn, FadeInDown, FadeOut, SlideInRight } from 'react-native-reanimated';
import * as z from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

// Add TicketUpdate type
type TicketStatus = "OPEN" | "CLOSED" | "IN_PROGRESS" | "RESOLVED";

interface TicketUpdate {
  status: TicketStatus;
  message: string;
  createdBy?: string;
  createdAt?: string;
}

// Add Ticket interface
interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  createdById: string;
  updates: TicketUpdate[] | undefined | null | string;
  messages?: {
    id: string;
    content: string;
    isFromSupport: boolean;
    createdAt: string;
  }[];
}

// Define API response type
interface TicketsResponse {
  data: Ticket[];
  metadata: {
    total: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

// Valid FontAwesome icon type
type IconName = React.ComponentProps<typeof FontAwesome>['name'];

export default function TicketsScreen() {
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const api = useApiClient();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form setup with zod validation
  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<NewTicketFormValues>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      subject: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  // Fetch user tickets
  const { data: ticketsResponse, isLoading, refetch } = useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return { data: [], metadata: { total: 0 } } as TicketsResponse;
      const response = await api.post('/tickets', {
        where: { createdById: user.id },
        orderBy: { createdAt: 'desc' },
      });
      return response as TicketsResponse;
    },
    enabled: !!user?.id,
  });

  // Access data safely
  const tickets = ticketsResponse?.data || [];
  const metadata = ticketsResponse?.metadata || { total: 0 };

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

  // Process updates to ensure they're in array format
  const processUpdates = (updates: TicketUpdate[] | undefined | null | string): TicketUpdate[] => {
    if (!updates) {
      return [];
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof updates === 'string') {
      try {
        const parsedUpdates = JSON.parse(updates);
        return Array.isArray(parsedUpdates) ? parsedUpdates : [];
      } catch (error) {
        console.warn('Failed to parse updates string:', error);
        return [];
      }
    }
    
    // If it's already an array, return it
    if (Array.isArray(updates)) {
      return updates;
    }
    
    // If we reached here, we have something unexpected
    console.warn('Unexpected updates format:', updates);
    return [];
  };

  // Function to handle opening the ticket detail modal
  const openTicketModal = (ticket: Ticket) => {
    // Process ticket updates to ensure it's an array
    const processedTicket = {
      ...ticket,
      updates: processUpdates(ticket.updates)
    };
    
    setSelectedTicket(processedTicket);
    setModalVisible(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTicket(null);
  };

  // Helper to get FontAwesome icon name safely
  const getIconName = (iconName: string | undefined): IconName => {
    // This cast is acceptable because we're using a fallback value
    return (iconName as IconName) || 'circle';
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
                <Controller
                  control={control}
                  name="subject"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <RNTextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter ticket subject"
                      className="border border-neutral-300 dark:border-neutral-600 rounded-md p-2.5 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                      placeholderTextColor={colorScheme === 'dark' ? '#A3A3A3' : '#737373'}
                    />
                  )}
                />
                {errors.subject?.message && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.subject?.message}
                  </Text>
                )}
              </View>
              
              <View className="mb-4">
                <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2 flex-row items-center">
                  <FontAwesome name="file-text" size={14} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} />
                  <Text className="ml-2">Description</Text>
                </Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <RNTextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Describe your issue in detail"
                      multiline
                      numberOfLines={4}
                      className="border border-neutral-300 dark:border-neutral-600 rounded-md p-2.5 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                      placeholderTextColor={colorScheme === 'dark' ? '#A3A3A3' : '#737373'}
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.description?.message && (
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.description?.message}
                  </Text>
                )}
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
                        watch('priority') === priority
                          ? priorityConfig[priority as keyof typeof priorityConfig].activeColor
                          : priorityConfig[priority as keyof typeof priorityConfig].color
                      } flex-row items-center`}
                      onPress={() => setValue('priority', priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                    >
                      <FontAwesome 
                        name={getIconName(priorityConfig[priority as keyof typeof priorityConfig].icon)} 
                        size={12} 
                        color={watch('priority') === priority ? "#FFFFFF" : "#6B7280"} 
                        className="mr-1" 
                      />
                      <Text
                        className={`${
                          watch('priority') === priority
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

        {/* Ticket Detail Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View className="flex-1 justify-end bg-black/0">
            <View className="bg-white border-neutral-400 border-t-4 dark:bg-neutral-800 rounded-t-3xl h-5/6 p-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-neutral-800 dark:text-white">Ticket Details</Text>
                <TouchableOpacity onPress={closeModal} className="p-2">
                  <FontAwesome name="times" size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              </View>
              
              {selectedTicket && (
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  {/* Ticket Header */}
                  <View className="mb-4">
                    <Text className="text-lg font-semibold text-neutral-800 dark:text-white mb-1">{selectedTicket.subject}</Text>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                        ID: {selectedTicket.id.slice(0, 8)}
                      </Text>
                      <View className={`flex-row items-center px-2 py-1 rounded-full ${
                        ticketStatus[selectedTicket.status]?.color || 'bg-neutral-100 text-neutral-800'
                      }`}>
                        <FontAwesome 
                          name={getIconName(ticketStatus[selectedTicket.status]?.icon)} 
                          size={12} 
                          color={selectedTicket.status === 'OPEN' ? '#047857' : 
                            selectedTicket.status === 'IN_PROGRESS' ? '#1E40AF' : 
                              selectedTicket.status === 'RESOLVED' ? '#4B5563' : '#B91C1C'} 
                        />
                        <Text className={`text-xs font-medium ml-1 ${
                          ticketStatus[selectedTicket.status]?.color || 'text-neutral-800'
                        }`}>
                          {ticketStatus[selectedTicket.status]?.label || selectedTicket.status}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mb-2">
                      <FontAwesome name="calendar" size={14} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} className="mr-2" />
                      <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                        Created on {formatDate(selectedTicket.createdAt)}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center mb-3">
                      <FontAwesome 
                        name={getIconName(priorityConfig[selectedTicket.priority as keyof typeof priorityConfig]?.icon)} 
                        size={14} 
                        color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} 
                        className="mr-2" 
                      />
                      <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                        Priority: {selectedTicket.priority}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Ticket Description */}
                  <View className="bg-neutral-100 dark:bg-neutral-700 p-4 rounded-lg mb-6">
                    <Text className="text-sm font-medium text-neutral-800 dark:text-white mb-2">Description</Text>
                    <Text className="text-neutral-600 dark:text-neutral-300">{selectedTicket.description}</Text>
                  </View>
                  
                  {/* Updates Timeline */}
                  <View className="mb-4">
                    <Text className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">Updates History</Text>
                    
                    {selectedTicket.updates && Array.isArray(selectedTicket.updates) && selectedTicket.updates.length > 0 ? (
                      selectedTicket.updates.map((update, index) => (
                        <View key={index} className="mb-4 relative pl-8">
                          {/* Timeline dot */}
                          <View className="absolute left-0 top-0 w-4 h-4 bg-primary rounded-full items-center justify-center">
                            <View className="w-2 h-2 bg-white rounded-full" />
                          </View>
                          
                          {/* Timeline line */}
                          {index < (selectedTicket.updates && Array.isArray(selectedTicket.updates) ? selectedTicket.updates.length : 0) - 1 && (
                            <View className="absolute left-[7.5px] top-4 w-0.5 h-full bg-neutral-300 dark:bg-neutral-600" />
                          )}
                          
                          {/* Update content */}
                          <View className="bg-white dark:bg-neutral-700 p-3 rounded-lg border border-neutral-200 dark:border-neutral-600">
                            <View className="flex-row justify-between items-center mb-2">
                              <View className={`px-2 py-0.5 rounded-full ${ticketStatus[update.status]?.color || 'bg-neutral-100'}`}>
                                <Text className="text-xs font-medium">{update.status}</Text>
                              </View>
                              {update.createdAt && (
                                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {formatDate(update.createdAt)}
                                </Text>
                              )}
                            </View>
                            <Text className="text-sm text-neutral-700 dark:text-neutral-300">{update.message}</Text>
                            {update.createdBy && (
                              <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic">
                                - {update.createdBy}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text className="text-neutral-500 dark:text-neutral-400 text-center italic">No updates available</Text>
                    )}
                  </View>
                  
                  {/* Messages Section */}
                  {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-lg font-semibold text-neutral-800 dark:text-white mb-4">Conversation</Text>
                      
                      {selectedTicket.messages.map((message) => (
                        <View 
                          key={message.id ?? message.createdAt} 
                          className={`mb-3 p-3 rounded-lg ${
                            message.isFromSupport 
                              ? 'bg-blue-50 dark:bg-blue-900/30 ml-4' 
                              : 'bg-neutral-100 dark:bg-neutral-700 mr-4'
                          }`}
                        >
                          <View className="flex-row justify-between items-center mb-1">
                            <Text className="text-xs font-medium text-neutral-800 dark:text-neutral-300">
                              {message.isFromSupport ? 'Support Team' : 'You'}
                            </Text>
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatDate(message.createdAt)}
                            </Text>
                          </View>
                          <Text className="text-sm text-neutral-700 dark:text-neutral-300">{message.content}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Close button */}
                  <Button
                    title="Close"
                    variant="outline"
                    icon="times"
                    className="mt-3 mb-10"
                    onPress={closeModal}
                  />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Tickets List with animation */}
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#2C59DB" />
          </View>
        ) : tickets && tickets.length > 0 ? (
          <>
            <Animated.View entering={FadeIn}>
              <View className="flex-row items-center mb-4">
                <FontAwesome name="list-alt" size={16} color={colorScheme === 'dark' ? '#ADB5BD' : '#6B7280'} />
                <Text className="text-neutral-600 dark:text-neutral-400 ml-2">
                  {metadata?.total || 0} Support Tickets
                </Text>
              </View>
            </Animated.View>
            
            {tickets.map((ticket: Ticket, index: number) => (
              <Animated.View 
                key={ticket.id} 
                entering={FadeInDown.delay(index * 100).springify()}
              >
                <TouchableOpacity onPress={() => openTicketModal(ticket)}>
                  <Card className="mb-3 p-0 overflow-hidden border-l-4 border-primary shadow-sm">
                    <View className="p-3">
                      {/* Header section with subject and status */}
                      <View className="flex-row justify-between items-center mb-1">
                        <View className="flex-1 mr-2">
                          <Text className="font-medium text-neutral-800 dark:text-white" numberOfLines={1}>
                            {ticket.subject}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                              ID: {ticket.id.slice(0, 8)} • {formatDate(ticket.createdAt)}
                            </Text>
                            {/* Badge for priority */}
                            <View className="ml-2 px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700">
                              <Text className="text-xs text-neutral-600 dark:text-neutral-400">
                                {ticket.priority}
                              </Text>
                            </View>
                          </View>
                        </View>
                        
                        <View className={`flex-row items-center px-2 py-1 rounded-full ${
                          ticketStatus[ticket.status]?.color || 'bg-neutral-100 text-neutral-800'
                        }`}>
                          <FontAwesome 
                            name={getIconName(ticketStatus[ticket.status]?.icon)} 
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
                      
                      {/* Description text */}
                      <Text className="text-neutral-600 dark:text-neutral-300 text-xs mb-2" numberOfLines={2}>
                        {ticket.description}
                      </Text>
                      
                      {/* Last message preview with animation - only if message exists */}
                      {ticket.messages && ticket.messages.length > 0 && (
                        <Animated.View 
                          className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg mb-1"
                          entering={SlideInRight.delay(200 + index * 50)}
                        >
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center flex-1">
                              <FontAwesome 
                                name={ticket.messages[0].isFromSupport ? "headset" as IconName : "user" as IconName} 
                                size={10} 
                                color="#ADB5BD" 
                              />
                              <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400 ml-1 mr-1">
                                {ticket.messages[0].isFromSupport ? 'Support' : 'You'}:
                              </Text>
                              <Text className="text-neutral-600 dark:text-neutral-300 text-xs flex-1" numberOfLines={1}>
                                {ticket.messages[0].content}
                              </Text>
                            </View>
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                              {new Date(ticket.messages[0].createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </Animated.View>
                      )}
                      
                      {/* Footer with stats and view button */}
                      <View className="flex-row justify-between items-center mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-700">
                        <View className="flex-row items-center">
                          {/* Updates count */}
                          <View className="flex-row items-center mr-3">
                            <FontAwesome name="refresh" size={12} color="#ADB5BD" />
                            <Text className="text-neutral-500 dark:text-neutral-400 text-xs ml-1">
                              {Array.isArray(ticket.updates) ? ticket.updates.length : 0}
                            </Text>
                          </View>
                          
                          {/* Messages count */}
                          <View className="flex-row items-center">
                            <FontAwesome name="comments" size={12} color="#ADB5BD" />
                            <Text className="text-neutral-500 dark:text-neutral-400 text-xs ml-1">
                              {ticket.messages?.length || 0}
                            </Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => openTicketModal(ticket)}
                          className="flex-row items-center bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full"
                        >
                          <Text className="text-primary font-medium text-xs mr-1">Details</Text>
                          <FontAwesome name="chevron-right" size={8} color="#2C59DB" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
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
              You don&apos;t have any support tickets yet
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