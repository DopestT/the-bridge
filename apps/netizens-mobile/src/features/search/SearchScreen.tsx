import { useEffect, useRef, useState } from 'react';
import { Button, FlatList, Pressable, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useRuntime } from '../../runtime/RuntimeProvider';
import { AppShell } from '../../components/AppShell';
import { styles } from '../../components/mobile-styles';
import { ApiError, type Entity } from '../../api/netizens-repository';

export function SearchScreen() {
  const { repository } = useRuntime();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Entity[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  function edit(value: string) {
    generation.current++; setQuery(value); setRows([]); setBusy(false); setError(''); setSubmitted(false);
  }
  async function search() {
    const request = ++generation.current;
    setRows([]); setBusy(true); setError(''); setSubmitted(false);
    try {
      const result = await repository.searchEntities(query);
      if (generation.current === request) { setRows(result); setSubmitted(true); }
    } catch (e) {
      if (generation.current === request) setError(e instanceof ApiError && e.kind === 'validation'
        ? e.message : 'Search unavailable. Check your connection and try again.');
    } finally { if (generation.current === request) setBusy(false); }
  }
  return <AppShell title="Search" breadcrumb={['World']}>
    <Text style={styles.muted}>Find space titles across Places. Results respect your current access.</Text>
    <TextInput accessibilityLabel="Search space titles" style={styles.input} maxLength={80} value={query}
      onChangeText={edit} onSubmitEditing={() => void search()} returnKeyType="search" />
    <Button title="Find spaces" accessibilityLabel="Find spaces" disabled={busy} onPress={() => void search()} />
    {busy ? <Text style={styles.text} accessibilityLiveRegion="polite">Searching…</Text> : null}
    {error ? <Text style={styles.text} accessibilityRole="alert">{error}</Text> : null}
    <FlatList data={rows} keyExtractor={row => row.id}
      ListEmptyComponent={submitted ? <Text style={styles.text}>No accessible spaces match this title.</Text> : null}
      renderItem={({ item }) => <Pressable style={styles.card} accessibilityRole="button" onPress={() => router.push(`/entity/${item.id}`)}>
        <Text style={styles.title}>{item.title}</Text><Text style={styles.muted}>{item.place_id}</Text>
        <Text style={styles.text}>{item.summary}</Text>
      </Pressable>} />
  </AppShell>;
}
