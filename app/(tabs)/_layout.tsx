import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function TabBarIcon(props: Readonly<{
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}>) {
  const scale = useSharedValue(props.focused ? 1.2 : 1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  React.useEffect(() => {
    scale.value = withSpring(props.focused ? 1.2 : 1, {
      damping: 15,
      stiffness: 120,
    });
  }, [props.focused]);

  return (
    <Animated.View style={animatedStyle}>
      <FontAwesome
        size={24}
        style={{ marginBottom: -3 }}
        {...props}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2C59DB',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#7B7F83' : '#ADB5BD',
        tabBarShowLabel: true,
        tabBarStyle: {
          elevation: 0,
          borderTopWidth: 0,
          backgroundColor: colorScheme === 'dark' ? '#212529' : '#FFFFFF',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: '#2C59DB',
        },
        headerTitleStyle: {
          color: colorScheme === 'dark' ? '#FFFFFF' : '#212529',
          fontWeight: '600',
        },
        headerShadowVisible: false,
        
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable className="mr-4">
                {({ pressed }) => (
                  <FontAwesome
                    name="bell"
                    size={25}
                    color={colorScheme === 'dark' ? '#FFFFFF' : '#212529'}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Merch',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="shopping-bag" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'My Account',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'My Tickets',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="ticket" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
