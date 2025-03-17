import * as React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, verificationSchema, type SignUpInput, type VerificationInput } from '@/lib/validations/auth';
import { useMutation } from '@tanstack/react-query';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [pendingVerification, setPendingVerification] = React.useState(false);

  // Sign up form
  const {
    control: signUpControl,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Verification form
  const {
    control: verificationControl,
    handleSubmit: handleVerificationSubmit,
    formState: { errors: verificationErrors },
  } = useForm<VerificationInput>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpInput) => {
      if (!isLoaded) throw new Error('Auth is not loaded');

      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    },
  });

  // Verification mutation
  const verificationMutation = useMutation({
    mutationFn: async (data: VerificationInput) => {
      if (!isLoaded) throw new Error('Auth is not loaded');

      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: data.code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        throw new Error('Verification failed. Please check your code and try again.');
      }
    },
  });

  const onSignUpSubmit = handleSignUpSubmit((data) => {
    signUpMutation.mutate(data);
  });

  const onVerificationSubmit = handleVerificationSubmit((data) => {
    verificationMutation.mutate(data);
  });

  if (pendingVerification) {
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
                <FontAwesome name="envelope" size={40} color="#2C59DB" />
              </View>
            </Animated.View>
            <Animated.Text 
              className="text-2xl font-bold text-neutral-7 dark:text-neutral-1 text-center"
              entering={FadeInUp.delay(400).duration(1000).springify()}
            >
              Verify Your Email
            </Animated.Text>
            <Animated.Text 
              className="text-neutral-6 dark:text-neutral-4 text-center mt-2"
              entering={FadeInUp.delay(600).duration(1000).springify()}
            >
              Please enter the verification code we sent to your email
            </Animated.Text>
          </View>

          <Card animated className="mb-6">
            {verificationMutation.error && (
              <View className="bg-accent-destructive/10 px-3 py-2 rounded-lg mb-4">
                <Text className="text-accent-destructive text-sm">
                  {verificationMutation.error.message}
                </Text>
              </View>
            )}
            
            <Controller
              control={verificationControl}
              name="code"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  label="Verification Code"
                  value={value}
                  placeholder="Enter verification code"
                  leftIcon="key"
                  onChangeText={onChange}
                  keyboardType="number-pad"
                  className="mb-6"
                  error={verificationErrors.code?.message}
                  maxLength={6}
                />
              )}
            />
            
            <Button 
              title="Verify Email" 
              onPress={onVerificationSubmit}
              isLoading={verificationMutation.isPending}
              disabled={verificationMutation.isPending}
              icon="check"
              iconPosition="right"
              className="w-full"
              size="lg"
            />
            
            <Animated.View 
              className="mt-4 items-center"
              entering={FadeInUp.delay(800).duration(1000).springify()}
            >
              <Text className="text-neutral-6 dark:text-neutral-4 text-center">
                Didn&apos;t receive a code?
              </Text>
              <Button
                title="Resend Code"
                variant="outline"
                onPress={async () => {
                  try {
                    await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
                  } catch (err) {
                    console.error('Error resending code:', err);
                  }
                }}
                className="mt-2"
                size="sm"
              />
            </Animated.View>
          </Card>
        </Animated.View>
      </SafeAreaView>
    );
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
              <FontAwesome name="user-plus" size={40} color="#2C59DB" />
            </View>
          </Animated.View>
          <Animated.Text 
            className="text-2xl font-bold text-neutral-7 dark:text-neutral-1 text-center"
            entering={FadeInUp.delay(400).duration(1000).springify()}
          >
            Create Account
          </Animated.Text>
          <Animated.Text 
            className="text-neutral-6 dark:text-neutral-4 text-center mt-2"
            entering={FadeInUp.delay(600).duration(1000).springify()}
          >
            Sign up to start tracking your merch
          </Animated.Text>
        </View>

        <Card animated className="mb-6">
          {signUpMutation.error && (
            <View className="bg-accent-destructive/10 px-3 py-2 rounded-lg mb-4">
              <Text className="text-accent-destructive text-sm">
                {signUpMutation.error.message}
              </Text>
            </View>
          )}
          
          <Controller
            control={signUpControl}
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
                error={signUpErrors.email?.message}
              />
            )}
          />
          
          <Controller
            control={signUpControl}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput 
                label="Password"
                value={value}
                placeholder="Create a password"
                leftIcon="lock"
                rightIcon={showPassword ? "eye-slash" : "eye"}
                onRightIconPress={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
                onChangeText={onChange}
                className="mb-2"
                error={signUpErrors.password?.message}
              />
            )}
          />
          
          <Text className="text-neutral-5 text-xs mb-6">
            Password must contain at least 8 characters, including uppercase, lowercase, and numbers
          </Text>
          
          <Button 
            title="Sign Up" 
            onPress={onSignUpSubmit}
            isLoading={signUpMutation.isPending}
            disabled={signUpMutation.isPending}
            icon="user-plus"
            iconPosition="right"
            className="w-full"
            size="lg"
          />
          
          <View className="flex-row justify-center mt-4">
            <Text className="text-xs text-neutral-5">
              By signing up, you agree to our{' '}
              <Text className="text-primary">Terms of Service</Text> and{' '}
              <Text className="text-primary">Privacy Policy</Text>
            </Text>
          </View>
        </Card>
        
        <Animated.View 
          className="flex-row justify-center mt-6"
          entering={FadeInUp.delay(800).duration(1000).springify()}
        >
          <Text className="text-neutral-6 dark:text-neutral-4">Already have an account? </Text>
          <Link href="/sign-in" asChild>
            <Text className="text-primary font-medium">Sign in</Text>
          </Link>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}