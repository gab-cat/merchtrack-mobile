import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  rightIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  onRightIconPress?: () => void;
  className?: string;
}

export function TextInput({ 
  label, 
  error, 
  leftIcon,
  rightIcon,
  onRightIconPress,
  className = '',
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  ...props 
}: Readonly<CustomTextInputProps>) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnimation = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: `rgba(44, 89, 219, ${borderAnimation.value})`,
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    borderAnimation.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderAnimation.value = withTiming(0, { duration: 200 });
  };

  return (
    <View className={`w-full ${className}`}>
      {label && (
        <Text className="text-neutral-7 dark:text-neutral-3 text-sm mb-1.5 font-medium">{label}</Text>
      )}
      <Animated.View 
        className={`flex-row items-center border rounded-lg ${error ? 'border-accent-destructive' : 'border-neutral-4'} bg-neutral-2 dark:bg-neutral-7 overflow-hidden`} 
        style={animatedBorderStyle}
      >
        {leftIcon && (
          <View className="ml-3">
            <FontAwesome name={leftIcon} size={18} color={isFocused ? '#2C59DB' : '#ADB5BD'} />
          </View>
        )}
        <RNTextInput
          className={`flex-1 py-3 px-3 text-neutral-7 dark:text-neutral-1 min-h-12 ${leftIcon ? 'ml-1' : ''}`}
          placeholder={placeholder}
          placeholderTextColor="#ADB5BD"
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          {...props}
        />
        {rightIcon && (
          <FontAwesome
            name={rightIcon}
            size={18}
            color={isFocused ? '#2C59DB' : '#ADB5BD'}
            style={{ marginRight: 12 }}
            onPress={onRightIconPress}
          />
        )}
      </Animated.View>
      {error && (
        <Text className="text-accent-destructive text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}