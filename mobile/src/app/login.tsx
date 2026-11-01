import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Brand, Button, Field, IconButton, Loading } from '../components/ui';
import { useSession } from '../context/session';
import { useTheme } from '../context/theme';
import { isConfigured, supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { session, ready } = useSession();
  const { colors, mode, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function signIn() {
    if (!supabase) return;
    if (!email.trim() || !password) { setError('Enter your email address and password.'); return; }
    setBusy(true); setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) setError('Could not sign in. Check your email and password, then try again.');
    } catch { setError('Could not reach Supabase. Please try again.'); }
    finally { setBusy(false); }
  }
  if (!ready) return <Loading message="Opening Bayarin…" />;
  if (session) return <Redirect href="/" />;
  return <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]}>
    <View style={s.header}><Brand /><IconButton icon={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} label="Toggle theme" onPress={toggle} /></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.form}>
          <Text style={[s.eyebrow, { color: colors.primary }]}>A LITTLE CLARITY, EVERY MONTH</Text>
          <Text style={[s.title, { color: colors.foreground }]}>Welcome back.</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>Your bills, a little more under control.{`\n`}Sign in to pick up where you left off.</Text>
          {!isConfigured && <Text accessibilityRole="alert" style={[s.notice, { backgroundColor: colors.secondary, color: colors.foreground }]}>This build needs its Supabase configuration. Follow the mobile README before building.</Text>}
          <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" editable={!busy && isConfigured} />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" editable={!busy && isConfigured} onSubmitEditing={signIn} />
          {error && <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
          <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={signIn} busy={busy} disabled={!isConfigured} />
          <View style={s.private}><Ionicons name="lock-closed-outline" size={13} color={colors.muted} /><Text style={{ color: colors.muted, fontSize: 12 }}>A private space. Just for you.</Text></View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const s = StyleSheet.create({ screen: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 12 }, content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }, form: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 20 }, eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 }, title: { fontSize: 37, fontWeight: '700', letterSpacing: -1.3 }, subtitle: { fontSize: 15, lineHeight: 24, marginTop: -8, marginBottom: 12 }, notice: { padding: 15, borderRadius: 14, fontSize: 13, lineHeight: 21 }, private: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingTop: 4 } });
