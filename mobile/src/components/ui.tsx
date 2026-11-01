import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/theme';

export function Brand() {
  const { colors } = useTheme();
  return <View style={s.brand}><View style={s.logo}><Ionicons name="wallet-outline" size={23} color="white" /></View><Text style={[s.brandText, { color: colors.foreground }]}>bayarin<Text style={{ color: colors.primary }}>.</Text></Text></View>;
}

export function Button({ title, onPress, busy = false, disabled = false, outline = false }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean; outline?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: outline ? colors.card : colors.primary, borderColor: outline ? colors.border : colors.primary, opacity: disabled || busy ? 0.55 : pressed ? 0.8 : 1 }]}>{busy && <ActivityIndicator size="small" color={outline ? colors.primary : colors.onPrimary} />}<Text style={[s.buttonText, { color: outline ? colors.foreground : colors.onPrimary }]}>{title}</Text></Pressable>;
}

export function IconButton({ icon, label, onPress, disabled }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.iconButton, { opacity: disabled ? 0.35 : pressed ? 0.55 : 1 }]}><Ionicons name={icon} size={21} color={colors.foreground} /></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return <View style={s.field}><Text style={[s.label, { color: colors.foreground }]}>{label}</Text><TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.muted} style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }, props.style]} /></View>;
}

export function Loading({ message = 'Loading your bills…' }: { message?: string }) {
  const { colors } = useTheme();
  return <View style={[s.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} size="large" /><Text style={{ color: colors.muted, marginTop: 14 }}>{message}</Text></View>;
}

const s = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#ee6b12', alignItems: 'center', justifyContent: 'center' }, brandText: { fontSize: 23, fontWeight: '800', letterSpacing: -0.7 },
  button: { minHeight: 50, paddingHorizontal: 20, borderWidth: 1, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 15, fontWeight: '700' }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  field: { gap: 9 }, label: { fontSize: 13, fontWeight: '600' }, input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, minHeight: 50, fontSize: 16 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
