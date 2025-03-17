import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { View, Text, SafeAreaView } from 'react-native';
import React from 'react';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { useMutation } from '@tanstack/react-query';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const signInMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      if (!isLoaded) throw new Error('Auth is not loaded');

      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        throw new Error('Authentication failed. Please check your credentials.');
      }
    },
  });

  const onSubmit = handleSubmit((data) => {
    signInMutation.mutate(data);
  });

  return (
    <SafeAreaView className="flex-1 bg-neutral-2 dark:bg-neutral-8 px-4">
      <Animated.View 
        className="flex-1 justify-center"
        entering={FadeInDown.duration(1000).springify()}
      >
        <View className="items-center mb-10">
          <Animated.View 
            entering={FadeInUp.delay(200).duration(1000).springify()}
          >
            <View className="h-20 w-20 rounded-3xl bg-primary-100 items-center justify-center mb-4">
              <FontAwesome name="shopping-bag" size={40} color="#2C59DB" />
            </View>
          </Animated.View>
          <Animated.Text 
            className="text-2xl font-bold text-neutral-7 dark:text-neutral-1 text-center"
            entering={FadeInUp.delay(400).duration(1000).springify()}
          >
            Welcome Back!
          </Animated.Text>
          <Animated.Text 
            className="text-neutral-6 dark:text-neutral-4 text-center mt-2"
            entering={FadeInUp.delay(600).duration(1000).springify()}
          >
            Sign in to continue to MerchTrack
          </Animated.Text>
        </View>

        <Card animated className="mb-6">
          {signInMutation.error && (
            <View className="bg-accent-destructive/10 px-3 py-2 rounded-lg mb-4">
              <Text className="text-accent-destructive text-sm">
                {signInMutation.error.message}
              </Text>
            </View>
          )}
          
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput 
                label="Email Address"
                autoCapitalize="none"
                value={value}
                placeholder="Enter your email"
                leftIcon="envelope"
                onChangeText={onChange}
                keyboardType="email-address"
                className="mb-4"
                error={errors.email?.message}
              />
            )}
          />
          
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput 
                label="Password"
                value={value}
                placeholder="Enter your password"
                leftIcon="lock"
                rightIcon={showPassword ? "eye-slash" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
                onChangeText={onChange}
                className="mb-6"
                error={errors.password?.message}
              />
            )}
          />
          
          <Button 
            title="Sign in" 
            onPress={onSubmit}
            isLoading={signInMutation.isPending}
            disabled={signInMutation.isPending}
            icon="sign-in"
            iconPosition="right"
            className="w-full"
            size="lg"
          />
          
          <View className="flex-row justify-end mt-4">
            <Text className="text-neutral-6 dark:text-neutral-4">Forgot your password? </Text>
            <Link href="/forgot-password" asChild>
              <Text className="text-primary font-medium">Reset</Text>
            </Link>
          </View>
        </Card>
        
        <Animated.View 
          className="flex-row justify-center mt-6"
          entering={FadeInUp.delay(800).duration(1000).springify()}
        >
          <Text className="text-neutral-6 dark:text-neutral-4">Don&apos;t have an account? </Text>
          <Link href="/sign-up" asChild>
            <Text className="text-primary font-medium">Sign up</Text>
          </Link>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}