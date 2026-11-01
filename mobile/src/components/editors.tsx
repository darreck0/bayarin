import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, IconButton } from './ui';
import { useTheme } from '../context/theme';
import { errorMessage, saveBill, saveName } from '../lib/api';
import { amountToCents, centsToAmount } from '../lib/money';
import { monthLabel } from '../lib/calendar';
import type { Bill } from '../lib/database.types';

function Sheet({ title, description, busy, onClose, children }: { title: string; description: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const { colors } = useTheme();
  return <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onClose(); }}>
    <KeyboardAvoidingView style={[s.overlay, { backgroundColor: colors.overlay }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.sheet, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={['bottom']} style={{ flexShrink: 1 }}>
          <View style={s.heading}><View style={{ flex: 1 }}><Text style={[s.title, { color: colors.foreground }]}>{title}</Text><Text style={[s.description, { color: colors.muted }]}>{description}</Text></View><IconButton icon="close" label="Close dialog" disabled={busy} onPress={onClose} /></View>
          <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export function BillEditor({ bill, month, onSaved, onClose }: { bill?: Bill; month: string; onSaved: () => Promise<void>; onClose: () => void }) {
  const { colors } = useTheme();
  const [name, setName] = useState(bill?.name ?? '');
  const [amount, setAmount] = useState(bill ? centsToAmount(amountToCents(bill.amount)) : '');
  const [day, setDay] = useState(String(bill?.due_day ?? 1));
  const [recurring, setRecurring] = useState(bill?.is_recurring ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startMonth = bill?.start_month.slice(0, 7) ?? month;
  async function submit() {
    setBusy(true); setError(null);
    try { await saveBill({ id: bill?.id, name, amount, due_day: day, is_recurring: recurring, month }); await onSaved(); onClose(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <Sheet title={bill ? 'Edit bill' : 'Add a bill'} description={bill ? `Changes apply to every occurrence. Starts ${monthLabel(startMonth)}.` : `A new bill for ${monthLabel(month)}.`} busy={busy} onClose={onClose}>
    <Field label="Bill name" value={name} onChangeText={setName} placeholder="e.g. Internet" maxLength={100} editable={!busy} />
    <View style={s.row}><View style={{ flex: 1 }}><Field label="Amount (₱)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" maxLength={13} editable={!busy} /></View><View style={{ flex: 1 }}><Field label="Due day" value={day} onChangeText={setDay} keyboardType="number-pad" maxLength={2} editable={!busy} /></View></View>
    <Text style={[s.help, { color: colors.muted }]}>Choose a day from 1–31. Shorter months use their last day.</Text>
    <View style={[s.recurring, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[s.label, { color: colors.foreground }]}>Recurring monthly</Text><Text style={[s.help, { color: colors.muted, marginTop: 5 }]}>{recurring ? `Every month from ${monthLabel(startMonth)}.` : `Only in ${monthLabel(startMonth)}.`}</Text></View><Switch accessibilityLabel="Recurring monthly" value={recurring} onValueChange={setRecurring} disabled={busy} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#ffffff" /></View>
    {error && <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
    <View style={s.row}><View style={{ flex: 1 }}><Button title="Cancel" outline onPress={onClose} disabled={busy} /></View><View style={{ flex: 1 }}><Button title={busy ? 'Saving…' : bill ? 'Save changes' : 'Add bill'} onPress={submit} busy={busy} /></View></View>
  </Sheet>;
}

export function NameEditor({ name: currentName, onClose }: { name: string; onClose: () => void }) {
  const { colors } = useTheme();
  const [name, setName] = useState(currentName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setBusy(true); setError(null);
    try { await saveName(name); onClose(); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <Sheet title="What should we call you?" description="Choose the name you want to see in your greeting." busy={busy} onClose={onClose}>
    <Field label="Your name" value={name} onChangeText={setName} placeholder="e.g. Alex" autoComplete="nickname" maxLength={60} editable={!busy} />
    {error && <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 13 }}>{error}</Text>}
    <View style={s.row}><View style={{ flex: 1 }}><Button title="Cancel" outline onPress={onClose} disabled={busy} /></View><View style={{ flex: 1 }}><Button title={busy ? 'Saving…' : 'Save name'} onPress={submit} busy={busy} /></View></View>
  </Sheet>;
}

const s = StyleSheet.create({ overlay: { flex: 1, justifyContent: 'flex-end' }, sheet: { maxHeight: '92%', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' }, heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 22, paddingTop: 23, paddingBottom: 10 }, title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 }, description: { marginTop: 8, fontSize: 13, lineHeight: 21 }, content: { padding: 22, paddingBottom: 28, gap: 20 }, row: { flexDirection: 'row', gap: 12 }, help: { fontSize: 12, lineHeight: 19 }, label: { fontSize: 14, fontWeight: '600' }, recurring: { borderWidth: 1, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 } });
