import { useSignIn, useSSO } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { View, Text, SafeAreaView } from 'react-native';
import React, { useCallback, useEffect } from 'react';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Card } from '@/components/ui/Card';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { useMutation } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

// Warm up browser hook for faster authentication
const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export default function SignInScreen() {
  // Warm up the browser for better user experience
  useWarmUpBrowser();
  
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { startSSOFlow } = useSSO();

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
  const [googleAuthPending, setGoogleAuthPending] = React.useState(false);
  const [oauthError, setOauthError] = React.useState<string | null>(null);

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

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setGoogleAuthPending(true);
      setOauthError(null);
      
      // Use the correct scheme from app.json (myapp) and the standard Clerk callback path
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'myapp',
        path: 'oauth-native-callback'
      });
      
      // Start the SSO flow with the proper redirect URL
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });
      
      // If sign in was successful, set the active session
      if (result) {
        const { createdSessionId, setActive: setOAuthActive } = result;
        if (createdSessionId && setOAuthActive) {
          await setOAuthActive({ session: createdSessionId });
          router.replace('/');
        }
      }
    } catch (err: unknown) {
      console.error("OAuth error:", err);
      // Display user-friendly error message
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in with Google. Please try again.";
      setOauthError(errorMessage);
    } finally {
      setGoogleAuthPending(false);
    }
  }, [startSSOFlow, router]);

  return (
    <SafeAreaView className="flex-1 px-4 bg-neutral-2 dark:bg-neutral-8">
      <Animated.View 
        className="justify-center flex-1"
        entering={FadeInDown.duration(1000).springify()}
      >
        <View className="items-center mb-10">
          <Animated.View 
            entering={FadeInUp.delay(200).duration(1000).springify()}
          >
            <View className="items-center justify-center w-20 h-20 mb-4 rounded-3xl bg-primary-100">
              <FontAwesome name="shopping-bag" size={40} color="#2C59DB" />
            </View>
          </Animated.View>
          <Animated.Text 
            className="text-2xl font-bold text-center text-neutral-7 dark:text-neutral-1"
            entering={FadeInUp.delay(400).duration(1000).springify()}
          >
            Welcome Back!
          </Animated.Text>
          <Animated.Text 
            className="mt-2 text-center text-neutral-6 dark:text-neutral-4"
            entering={FadeInUp.delay(600).duration(1000).springify()}
          >
            Sign in to continue to MerchTrack
          </Animated.Text>
        </View>

        <Card animated className="mb-6">
          {signInMutation.error && (
            <View className="px-3 py-2 mb-4 rounded-lg bg-accent-destructive/10">
              <Text className="text-sm text-accent-destructive">
                {signInMutation.error.message}
              </Text>
            </View>
          )}
          
          {oauthError && (
            <View className="px-3 py-2 mb-4 rounded-lg bg-accent-destructive/10">
              <Text className="text-sm text-accent-destructive">
                {oauthError}
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
              <Text className="font-medium text-primary">Reset</Text>
            </Link>
          </View>

          {/* Divider with "or" text */}
          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-neutral-4/30" />
            <Text className="mx-4 text-neutral-5">or continue with</Text>
            <View className="flex-1 h-px bg-neutral-4/30" />
          </View>

          {/* Google Sign In Button */}
          <Button 
            title={googleAuthPending ? "Signing in..." : "Sign in with Google"}
            onPress={handleGoogleSignIn}
            isLoading={googleAuthPending}
            disabled={googleAuthPending}
            icon="google"
            variant="outline"
            className="w-full font-medium bg-white border-white text-neutral-8"
            iconColor="#2C59DB"
            size="lg"
          />
        </Card>
        
        <Animated.View 
          className="flex-row justify-center mt-6"
          entering={FadeInUp.delay(800).duration(1000).springify()}
        >
          <Text className="text-neutral-6 dark:text-neutral-4">Don&apos;t have an account? </Text>
          <Link href="/sign-up" asChild>
            <Text className="font-medium text-primary">Sign up</Text>
          </Link>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}