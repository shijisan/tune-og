import Searchbar from '@/components/searchbar';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Discover() {
  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} 
      >
        <View className="flex-1 px-4 w-full" >
          <Searchbar apiPath="search" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
