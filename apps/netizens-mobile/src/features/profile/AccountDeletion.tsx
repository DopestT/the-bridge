import { useRef, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { styles } from '../../components/mobile-styles';
export function AccountDeletion({ onDelete }: { onDelete: (email: string, password: string, confirmation: string) => Promise<void> }) {
  const [open, setOpen] = useState(false), [email, setEmail] = useState(''), [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const inFlight = useRef(false);
  async function remove() {
    if (inFlight.current || confirmation !== 'DELETE' || !email.trim() || !password) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await onDelete(email.trim(), password, confirmation); }
    catch { setError('Deletion was not confirmed. Sign in again to check your account before retrying.'); }
    finally { setPassword(''); inFlight.current = false; setBusy(false); }
  }
  if (!open) return <Button title="Delete account" onPress={() => setOpen(true)} />;
  return <View style={styles.card}>
    <Text style={styles.title}>Delete your Citizen account</Text>
    <Text style={styles.text}>Your identity, profile, posts, messages and memberships will be removed. Owned spaces and conversations, including their nested spaces, discussions and other participants’ messages, will also be removed. This cannot be undone.</Text>
    <Text style={styles.muted}>Enter your account email, current password and DELETE to confirm.</Text>
    <TextInput style={styles.input} accessibilityLabel="Account email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy} />
    <TextInput style={styles.input} accessibilityLabel="Current password" secureTextEntry value={password} onChangeText={setPassword} editable={!busy} />
    <TextInput style={styles.input} accessibilityLabel="Confirm permanent deletion" autoCapitalize="characters" autoCorrect={false} value={confirmation} onChangeText={setConfirmation} editable={!busy} />
    {error ? <Text style={styles.text} accessibilityRole="alert">{error}</Text> : null}
    <Button title={busy ? 'Deleting account…' : 'Permanently delete account'} disabled={busy || confirmation !== 'DELETE' || !email.trim() || !password} onPress={() => void remove()} />
    <Button title="Keep account" disabled={busy} onPress={() => { setOpen(false); setPassword(''); setEmail(''); setConfirmation(''); setError(''); }} />
  </View>;
}
