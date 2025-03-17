import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

const requestResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  code: z.string().min(6, 'Please enter the verification code'),
});

type RequestResetInput = z.infer<typeof requestResetSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [successfulCreation, setSuccessfulCreation] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Form for requesting password reset
  const {
    control: requestControl,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors },
  } = useForm<RequestResetInput>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for resetting password
  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      code: '',
    },
  });

  // Request reset mutation
  const requestResetMutation = useMutation({
    mutationFn: async (data: RequestResetInput) => {
      if (!isLoaded) throw new Error('Auth is not loaded');

      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: data.email,
      });
      setSuccessfulCreation(true);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      if (!isLoaded) throw new Error('Auth is not loaded');

      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: data.code,
        password: data.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/');
      } else if (result.status === 'needs_second_factor') {
        throw new Error('2FA is required but not supported in this UI');
      } else {
        throw new Error('Password reset failed. Please try again.');
      }
    },
  });

  React.useEffect(() => {
    if (isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return null;
  }

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
              <FontAwesome 
                name={successfulCreation ? "envelope" : "lock"} 
                size={40} 
                color="#2C59DB" 
              />
            </View>
          </Animated.View>
          <Animated.Text 
            className="text-2xl font-bold text-neutral-7 dark:text-neutral-1 text-center"
            entering={FadeInUp.delay(400).duration(1000).springify()}
          >
            {successfulCreation ? 'Check Your Email' : 'Forgot Password?'}
          </Animated.Text>
          <Animated.Text 
            className="text-neutral-6 dark:text-neutral-4 text-center mt-2"
            entering={FadeInUp.delay(600).duration(1000).springify()}
          >
            {successfulCreation 
              ? 'Enter the verification code we sent you'
              : 'No worries, we\'ll send you reset instructions'}
          </Animated.Text>
        </View>

        <Card animated className="mb-6">
          {!successfulCreation ? (
            <>
              {requestResetMutation.error && (
                <View className="bg-accent-destructive/10 px-3 py-2 rounded-lg mb-4">
                  <Text className="text-accent-destructive text-sm">
                    {requestResetMutation.error.message}
                  </Text>
                </View>
              )}
              
              <Controller
                control={requestControl}
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
                    className="mb-6"
                    error={requestErrors.email?.message}
                  />
                )}
              />
              
              <Button 
                title="Send Reset Instructions" 
                onPress={handleRequestSubmit((data) => requestResetMutation.mutate(data))}
                isLoading={requestResetMutation.isPending}
                disabled={requestResetMutation.isPending}
                icon="paper-plane"
                iconPosition="right"
                className="w-full"
                size="lg"
              />
            </>
          ) : (
            <>
              {resetPasswordMutation.error && (
                <View className="bg-accent-destructive/10 px-3 py-2 rounded-lg mb-4">
                  <Text className="text-accent-destructive text-sm">
                    {resetPasswordMutation.error.message}
                  </Text>
                </View>
              )}
              
              <Controller
                control={resetControl}
                name="code"
                render={({ field: { onChange, value } }) => (
                  <TextInput 
                    label="Verification Code"
                    value={value}
                    placeholder="Enter verification code"
                    leftIcon="key"
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    className="mb-4"
                    error={resetErrors.code?.message}
                    maxLength={6}
                  />
                )}
              />
              
              <Controller
                control={resetControl}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <TextInput 
                    label="New Password"
                    value={value}
                    placeholder="Create new password"
                    leftIcon="lock"
                    rightIcon={showPassword ? "eye-slash" : "eye"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    secureTextEntry={!showPassword}
                    onChangeText={onChange}
                    className="mb-2"
                    error={resetErrors.password?.message}
                  />
                )}
              />
              
              <Text className="text-neutral-5 text-xs mb-6">
                Password must be at least 8 characters and include uppercase, lowercase, and numbers
              </Text>
              
              <Button 
                title="Reset Password" 
                onPress={handleResetSubmit((data) => resetPasswordMutation.mutate(data))}
                isLoading={resetPasswordMutation.isPending}
                disabled={resetPasswordMutation.isPending}
                icon="check"
                iconPosition="right"
                className="w-full"
                size="lg"
              />

              <Button 
                title="Resend Code"
                variant="outline"
                onPress={handleRequestSubmit((data) => requestResetMutation.mutate(data))}
                isLoading={requestResetMutation.isPending}
                disabled={requestResetMutation.isPending}
                icon="refresh"
                iconPosition="right"
                className="w-full mt-4"
                size="md"
              />
            </>
          )}
        </Card>
        
        <Animated.View 
          className="flex-row justify-center mt-6"
          entering={FadeInUp.delay(800).duration(1000).springify()}
        >
          <Text className="text-neutral-6 dark:text-neutral-4">Remember your password? </Text>
          <Button
            title="Sign in"
            variant="outline"
            onPress={() => router.push('/sign-in')}
            className="px-2 py-0"
          />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}