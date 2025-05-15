import { useUserImageQuery } from "@/lib/hooks/use-queries";
import { cn } from "@/utils/cn";
import { View, Image } from "react-native";


interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  alt?: string;
  className?: string;
  [key: string]: string | number | undefined | object;
}

const Avatar = ({ size = 'md', src, alt, className, ...props }: AvatarProps) => {
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  const { data: imageUrl } = useUserImageQuery(src ?? '');

  return (
    <View className={cn('rounded-full overflow-hidden', sizeClass[size], className)} {...props}>
      {src ? (
        <Image source={{ uri: imageUrl?.data ?? 'https://placehold.co/40x40/E0E0E0/B0B0B0/png?text=U' }} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <View className="w-full h-full bg-neutral-200 dark:bg-neutral-700" />
      )}
    </View>
  );
};

export default Avatar;