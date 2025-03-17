import React, { forwardRef, ForwardRefRenderFunction } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const CardComponent: ForwardRefRenderFunction<View, CardProps> = (
  { children, animated = false, className = '', ...props }, 
  ref
) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  React.useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withTiming(0, { duration: 500 });
    }
  }, []);
  
  if (animated) {
    return (
      <AnimatedView 
        ref={ref}
        className={`bg-neutral-1 dark:bg-neutral-7 rounded-xl shadow-sm p-5 ${className}`} 
        style={animatedStyle}
        {...props}
      >
        {children}
      </AnimatedView>
    );
  }
  
  return (
    <View 
      ref={ref}
      className={`bg-neutral-1 dark:bg-neutral-7 rounded-xl shadow-sm p-5 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
};

export const Card = forwardRef(CardComponent);