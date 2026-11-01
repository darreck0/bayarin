import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { User } from '@supabase/supabase-js';
import { Brand, Button, IconButton, Loading } from '../components/ui';
import { BillEditor, NameEditor } from '../components/editors';
import { useSession } from '../context/session';
import { useTheme } from '../context/theme';
import { errorMessage, fetchMonth, removeBill, setPayment } from '../lib/api';
import { displayStatus, summarize, type MonthlyBill } from '../lib/bills';
import { manilaDate, monthLabel, shiftMonth, shortDueDate } from '../lib/calendar';
import { formatMoney } from '../lib/money';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const { session, ready } = useSession();
  if (!ready) return <Loading message="Opening Bayarin…" />;
  if (!session) return <Redirect href="/login" />;
  return <Dashboard user={session.user} />;
}

function Dashboard({ user }: { user: User }) {
  const { colors, mode, toggle: toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [today, setToday] = useState(manilaDate);
  const [month, setMonth] = useState(() => manilaDate().slice(0, 7));
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editor, setEditor] = useState<MonthlyBill | 'new' | null>(null);
  const [editingName, setEditingName] = useState(false);
  const request = useRef({ id: 0 });
  const displayName = [user.user_metadata.display_name, user.user_metadata.full_name, user.user_metadata.name].find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
  const summary = summarize(bills);
  const overdueCount = bills.filter(bill => displayStatus(bill.paymentStatus, bill.dueDate, today) === 'overdue').length;

  const reload = useCallback(async () => {
    const id = ++request.current.id;
    setRefreshing(true);
    setError(null);
    try { const rows = await fetchMonth(month); if (id === request.current.id) setBills(rows); }
    catch (err) { if (id === request.current.id) setError(errorMessage(err)); }
    finally { if (id === request.current.id) { setLoading(false); setRefreshing(false); } }
  }, [month]);

  useEffect(() => {
    const pendingRequest = request.current;
    const id = ++pendingRequest.id;
    fetchMonth(month).then(rows => { if (id === pendingRequest.id) setBills(rows); })
      .catch(err => { if (id === pendingRequest.id) setError(errorMessage(err)); })
      .finally(() => { if (id === pendingRequest.id) { setLoading(false); setRefreshing(false); } });
    return () => { pendingRequest.id++; };
  }, [month]);
  useEffect(() => {
    const update = () => setToday(manilaDate());
    const timer = setInterval(update, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') { update(); void reload(); } });
    return () => { clearInterval(timer); listener.remove(); };
  }, [reload]);

  function changeMonth(delta: number) {
    const next = shiftMonth(month, delta);
    if (!next || busy) return;
    request.current.id++; setBills([]); setError(null); setLoading(true); setMonth(next);
  }
  async function mark(bill: MonthlyBill) {
    if (busy) return;
    setBusy(bill.id);
    try { await setPayment(bill.id, month, bill.paymentStatus === 'paid' ? 'unpaid' : 'paid'); await reload(); }
    catch (err) { Alert.alert('Could not update bill', errorMessage(err)); }
    finally { setBusy(null); }
  }
  function options(bill: MonthlyBill) {
    Alert.alert(bill.name, 'Changes apply across all applicable months.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit bill', onPress: () => setEditor(bill) },
      { text: 'Delete bill', style: 'destructive', onPress: () => Alert.alert(`Delete ${bill.name}?`, 'This removes the bill from every month and deletes all payment history. This cannot be undone.', [
        { text: 'Keep bill', style: 'cancel' },
        { text: 'Delete bill', style: 'destructive', onPress: async () => {
          setBusy(bill.id);
          try { await removeBill(bill.id); await reload(); } catch (err) { Alert.alert('Could not delete bill', errorMessage(err)); } finally { setBusy(null); }
        } },
      ]) },
    ]);
  }
  async function signOut() {
    if (!supabase || busy) return;
    setBusy('logout');
    try { const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' }); if (signOutError) Alert.alert('Could not sign out', 'Please check your connection and try again.'); }
    catch { Alert.alert('Could not sign out', 'Please try again.'); }
    finally { setBusy(null); }
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={[s.screen, { backgroundColor: colors.background }]}>
    <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}><Brand /><View style={s.row}><IconButton icon={mode === 'dark' ? 'sunny-outline' : 'moon-outline'} label="Toggle light or dark mode" onPress={toggleTheme} /><IconButton icon="log-out-outline" label="Sign out" onPress={signOut} disabled={!!busy} /></View></View>
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: 112 + insets.bottom }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { if (!busy) void reload(); }} tintColor={colors.primary} colors={[colors.primary]} />}>
      <View style={s.greeting}><Text style={[s.hello, { color: colors.primary }]}>{displayName ? `Hello, ${displayName}!` : 'Hello!'}</Text><Pressable accessibilityRole="button" accessibilityLabel={displayName ? 'Edit your name' : 'Add your name'} onPress={() => setEditingName(true)} disabled={!!busy} style={s.nameButton}><Ionicons name="pencil-outline" size={16} color={colors.muted} />{!displayName && <Text style={{ color: colors.muted, fontSize: 12 }}>Add your name</Text>}</Pressable></View>
      <Text style={[s.title, { color: colors.foreground }]}>A clearer view of <Text style={{ color: colors.primary }}>your bills.</Text></Text>
      <Text style={[s.subtitle, { color: colors.muted }]}>Less mental clutter. A little more peace of mind.</Text>
      <View style={[s.month, { backgroundColor: colors.card, borderColor: colors.border }]}><IconButton icon="chevron-back" label="Previous month" onPress={() => changeMonth(-1)} disabled={!!busy || !shiftMonth(month, -1)} /><Text style={[s.monthTitle, { color: colors.foreground }]}>{monthLabel(month)}</Text><IconButton icon="chevron-forward" label="Next month" onPress={() => changeMonth(1)} disabled={!!busy || !shiftMonth(month, 1)} /></View>
      {loading ? <View style={[s.loading, { backgroundColor: colors.card, borderColor: colors.border }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.muted, marginTop: 12 }}>Loading your bills…</Text></View> : <>
        <LinearGradient colors={[colors.summaryFrom, colors.summaryTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.summary, { borderColor: colors.summaryLine }]}>
          <Text style={[s.summaryLabel, { color: colors.summaryMuted }]}>Total this month</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.6} style={[s.total, { color: colors.summaryText }]}>{formatMoney(summary.total)}</Text>
          <View style={[s.subTotals, { borderTopColor: colors.summaryLine }]}><View style={{ flex: 1 }}><Text style={[s.summaryLabel, { color: colors.summaryMuted }]}>✓  Paid</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[s.subAmount, { color: colors.summaryText }]}>{formatMoney(summary.paid)}</Text></View><View style={[s.remaining, { borderLeftColor: colors.summaryLine }]}><Text style={[s.summaryLabel, { color: colors.summaryMuted }]}>◌  Remaining</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[s.subAmount, { color: colors.summaryText }]}>{formatMoney(summary.remaining)}</Text></View></View>
          <View accessibilityRole="progressbar" accessibilityLabel="Bill amount paid" accessibilityValue={{ min: 0, max: 100, now: Math.round(summary.progress) }} style={[s.progressTrack, { backgroundColor: colors.summaryLine }]}><View style={[s.progress, { backgroundColor: colors.primary, width: `${summary.progress}%` }]} /></View>
          <View style={s.between}><Text style={[s.summarySmall, { color: colors.summaryMuted }]}>{summary.paidCount} of {bills.length} bills paid</Text><Text style={[s.summarySmall, { color: colors.summaryMuted }]}>{Math.round(summary.progress)}% complete</Text></View>
        </LinearGradient>
        <View style={[s.between, { marginTop: 28, marginBottom: 17 }]}><View style={s.row}><Text style={[s.sectionTitle, { color: colors.foreground }]}>Your bills</Text><View style={[s.count, { backgroundColor: colors.secondary }]}><Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>{bills.length}</Text></View></View><Text style={{ fontSize: 11, color: colors.muted }}>By due date</Text></View>
        {error && <View style={[s.notice, { backgroundColor: colors.overdueBg }]}><Text accessibilityRole="alert" style={{ color: colors.overdueText, fontSize: 13, lineHeight: 20 }}>{error}</Text><Pressable onPress={() => void reload()} accessibilityRole="button" style={{ paddingTop: 10 }}><Text style={{ color: colors.overdueText, fontWeight: '700' }}>Try again</Text></Pressable></View>}
        {overdueCount > 0 && <Text style={{ color: colors.danger, fontSize: 12, marginBottom: 14 }}>{overdueCount} {overdueCount === 1 ? 'bill needs' : 'bills need'} your attention.</Text>}
        <View style={{ gap: 13 }}>{bills.map(bill => {
          const status = displayStatus(bill.paymentStatus, bill.dueDate, today);
          const paid = status === 'paid', overdue = status === 'overdue';
          const statusColor = paid ? colors.paidText : overdue ? colors.overdueText : colors.unpaidText;
          const statusBg = paid ? colors.paidBg : overdue ? colors.overdueBg : colors.unpaidBg;
          return <View key={bill.id} style={[s.bill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable accessibilityRole="checkbox" accessibilityLabel={`${bill.name}, ${formatMoney(bill.cents)}, ${status}. Mark ${paid ? 'unpaid' : 'paid'}`} accessibilityState={{ checked: paid, disabled: !!busy, busy: busy === bill.id }} disabled={!!busy} onPress={() => void mark(bill)} style={({ pressed }) => [s.billTap, { opacity: pressed || busy === bill.id ? 0.55 : 1 }]}>
              <View style={[s.statusCircle, { backgroundColor: statusBg }]}>{busy === bill.id ? <ActivityIndicator size="small" color={statusColor} /> : <Ionicons name={paid ? 'checkmark' : 'ellipse-outline'} size={18} color={statusColor} />}</View>
              <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={[s.billName, { color: overdue ? colors.danger : colors.foreground }]}>{bill.name}</Text><View style={[s.row, { gap: 5, marginTop: 6 }]}><Text style={{ fontSize: 11, color: overdue ? colors.danger : colors.muted }}>Due {shortDueDate(bill.dueDate)}</Text>{bill.is_recurring && <Ionicons name="repeat-outline" size={12} color={colors.muted} />}</View></View>
              <View style={s.billRight}><Text adjustsFontSizeToFit numberOfLines={1} style={[s.billAmount, { color: overdue ? colors.danger : colors.foreground }]}>{formatMoney(bill.cents)}</Text><View style={[s.badge, { backgroundColor: statusBg }]}><Text style={{ fontSize: 10, fontWeight: '600', color: statusColor }}>{paid ? 'Paid' : overdue ? 'Overdue' : 'Unpaid'}</Text></View></View>
            </Pressable>
            <IconButton icon="ellipsis-horizontal" label={`Options for ${bill.name}`} onPress={() => options(bill)} disabled={!!busy} />
          </View>;
        })}</View>
        {!bills.length && !error && <View style={[s.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[s.emptyIcon, { backgroundColor: colors.secondary }]}><Ionicons name="receipt-outline" size={28} color={colors.primary} /></View><Text style={[s.sectionTitle, { color: colors.foreground }]}>A clean slate.</Text><Text style={[s.emptyText, { color: colors.muted }]}>No bills for this month yet.{`\n`}Add one to start keeping track.</Text><Button title="Add your first bill" outline onPress={() => setEditor('new')} disabled={!!busy} /></View>}
        {!!bills.length && <Text style={[s.hint, { color: colors.muted }]}>Tap a bill to mark it paid or unpaid.</Text>}
      </>}
      <View style={s.footer}><Ionicons name="shield-checkmark-outline" size={13} color={colors.muted} /><Text style={{ fontSize: 11, color: colors.muted }}>Your space. Your pace.</Text></View>
    </ScrollView>
    <Pressable accessibilityRole="button" accessibilityLabel="Add bill" disabled={!!busy || loading} onPress={() => setEditor('new')} style={({ pressed }) => [s.fab, { bottom: Math.max(22, insets.bottom + 12), backgroundColor: colors.primary, opacity: busy || loading ? 0.5 : pressed ? 0.8 : 1 }]}><Ionicons name="add" size={25} color={colors.onPrimary} /><Text style={{ fontSize: 14, fontWeight: '700', color: colors.onPrimary }}>Add bill</Text></Pressable>
    {editor && <BillEditor key={editor === 'new' ? 'new' : editor.id} bill={editor === 'new' ? undefined : editor} month={month} onSaved={() => reload()} onClose={() => setEditor(null)} />}
    {editingName && <NameEditor name={displayName} onClose={() => setEditingName(false)} />}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 8 }, between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, content: { paddingHorizontal: 20, paddingTop: 23, maxWidth: 680, width: '100%', alignSelf: 'center' },
  greeting: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10, flexWrap: 'wrap' }, hello: { fontSize: 14, fontWeight: '600', flexShrink: 1 }, nameButton: { minWidth: 40, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, title: { fontSize: 30, lineHeight: 37, fontWeight: '700', letterSpacing: -0.8 }, subtitle: { fontSize: 13, lineHeight: 21, marginTop: 9, marginBottom: 25 },
  month: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 17, padding: 5, marginBottom: 17 }, monthTitle: { fontSize: 15, fontWeight: '600' }, loading: { minHeight: 300, borderWidth: 1, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  summary: { borderWidth: 1, borderRadius: 24, padding: 24 }, summaryLabel: { fontSize: 12, fontWeight: '500' }, total: { marginTop: 13, fontSize: 38, fontWeight: '700', letterSpacing: -1.5, fontVariant: ['tabular-nums'] }, subTotals: { marginTop: 22, paddingTop: 21, flexDirection: 'row', borderTopWidth: 1, gap: 16 }, remaining: { flex: 1, paddingLeft: 17, borderLeftWidth: 1 }, subAmount: { fontSize: 19, fontWeight: '700', letterSpacing: -0.5, marginTop: 8, fontVariant: ['tabular-nums'] }, progressTrack: { height: 7, marginTop: 25, marginBottom: 12, borderRadius: 5, overflow: 'hidden' }, progress: { height: '100%', borderRadius: 5 }, summarySmall: { fontSize: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700' }, count: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, bill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, paddingRight: 2 }, billTap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', paddingVertical: 19, paddingLeft: 13, paddingRight: 3, gap: 10 }, statusCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }, billName: { fontSize: 13, fontWeight: '700' }, billRight: { alignItems: 'flex-end', maxWidth: '44%' }, billAmount: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.3 }, badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  notice: { padding: 16, borderRadius: 15, marginBottom: 15 }, empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 22, alignItems: 'center', padding: 28, gap: 14 }, emptyIcon: { height: 60, width: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, emptyText: { fontSize: 13, lineHeight: 22, textAlign: 'center' }, hint: { fontSize: 11, textAlign: 'center', marginTop: 20 }, footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 30 }, fab: { position: 'absolute', right: 20, minHeight: 54, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 21, elevation: 5, shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
});
