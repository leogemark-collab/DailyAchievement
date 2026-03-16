import { useNavigation, type NavigationProp } from '@react-navigation/native';

import type { RootStackParamList } from '@/types/navigation';

export function useTypedNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}
