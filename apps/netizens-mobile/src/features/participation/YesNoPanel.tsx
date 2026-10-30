import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useRuntime } from '../../runtime/RuntimeProvider';
import type { VoteResult } from '../../api/netizens-repository';
import { styles } from '../../components/mobile-styles';

export function YesNoPanel({ entityId }: { entityId: string }) {
  const { repository } = useRuntime();
  const [result, setResult] = useState<VoteResult | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function vote(choice: 'yes' | 'no') {
    if (busy) return;
    setBusy(true); setError('');
    try { setResult(await repository.castVote(entityId, choice)); }
    catch { setError('Your vote was not confirmed. Reconnect and try again.'); }
    finally { setBusy(false); }
  }
  return <View>
    <Text style={styles.title}>Community question</Text>
    <Text style={styles.muted}>An advisory community poll. You can change your answer.</Text>
    {result ? <>
      <Text style={styles.text}>Your answer: {result.user_choice === 'yes' ? 'Yes' : 'No'}</Text>
      <Text style={styles.text} accessibilityLiveRegion="polite">Yes: {result.yes_count} · No: {result.no_count}</Text>
    </> : <Text style={styles.text}>Choose an answer to see the results.</Text>}
    <View style={styles.row}>
      <Button title="Yes" accessibilityLabel="Vote Yes" disabled={busy} onPress={() => void vote('yes')} />
      <Button title="No" accessibilityLabel="Vote No" disabled={busy} onPress={() => void vote('no')} />
    </View>
    {busy ? <Text style={styles.muted}>Confirming your vote…</Text> : null}
    {error ? <Text style={styles.text} accessibilityRole="alert">{error}</Text> : null}
  </View>;
}
