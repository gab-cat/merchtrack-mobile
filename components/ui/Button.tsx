import React, { forwardRef, ForwardRefRenderFunction } from 'react';
import { Text, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconPosition?: 'left' | 'right';
  className?: string;
  iconColor?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ButtonComponent: ForwardRefRenderFunction<Pressable, ButtonProps> = (
  {
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    className = '',
    iconColor,
  },
  ref
) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };
  
  const getVariantClass = () => {
    switch(variant) {
    case 'primary':
      return 'bg-primary text-neutral-1';
    case 'secondary':
      return 'bg-secondary text-neutral-1';
    case 'outline':
      return 'bg-neutral-1 border border-primary text-primary';
    default:
      return 'bg-primary text-neutral-1';
    }
  };
  
  const getSizeClass = () => {
    switch(size) {
    case 'sm':
      return 'py-2 px-4';
    case 'md':
      return 'py-3 px-6';
    case 'lg':
      return 'py-4 px-8';
    default:
      return 'py-3 px-6';
    }
  };

  // Determine icon color - use provided iconColor or default based on variant
  const finalIconColor = iconColor || (variant === 'outline' ? '#2C59DB' : '#FFFFFF');
  
  return (
    <AnimatedPressable
      ref={ref}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={animatedStyle}
      className={`rounded-xl shadow-sm items-center justify-center flex-row ${getVariantClass()} ${getSizeClass()} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? '#2C59DB' : '#FFFFFF'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <FontAwesome
              name={icon}
              size={size === 'lg' ? 20 : size === 'md' ? 16 : 14}
              color={finalIconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`font-medium ${variant === 'outline' ? 'text-primary' : 'text-neutral-1'} text-center`}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <FontAwesome
              name={icon}
              size={size === 'lg' ? 20 : size === 'md' ? 16 : 14}
              color={finalIconColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </>
      )}
    </AnimatedPressable>
  );
};

export const Button = forwardRef(ButtonComponent);