import { useEffect, useState } from 'react';
import { Button, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useRuntime } from '../../runtime/RuntimeProvider';
import { styles } from '../../components/mobile-styles';
import type { Entity } from '../../api/netizens-repository';
import { loadCached } from './world-model';

const publicRows = (rows: Entity[]) => rows.filter(row => row.visibility === 'public' && row.place_id !== 'circles');
export function EntityChildren({ parent }: { parent: Entity }) {
  const runtime = useRuntime(), router = useRouter();
  const [rows, setRows] = useState<Entity[]>([]), [offset, setOffset] = useState(0);
  const [more, setMore] = useState(false), [notice, setNotice] = useState('');
  useEffect(() => {
    let live = true;
    const key = `children:${parent.id}:${offset}`;
    const cacheable = parent.visibility === 'public' && parent.place_id !== 'circles';
    void loadCached<Entity[]>({
      cached: async () => {
        if (!cacheable) return null;
        const data = (await runtime.projections.get<Entity[]>('entities', key))?.body;
        return Array.isArray(data) ? publicRows(data) : null;
      },
      refresh: () => runtime.repository.children(parent.id, offset),
      save: async data => {
        if (cacheable) await runtime.projections.put('entities', key, publicRows(data));
        else await runtime.projections.remove('entities', key);
      },
      clear: () => runtime.projections.remove('entities', key),
      emit: result => {
        if (!live) return;
        setRows(result.data ?? []);
        setMore(result.phase === 'ready' && result.data?.length === 50);
        setNotice(result.phase === 'offlineCached' ? 'Offline — showing saved nested spaces.'
          : ['unavailable', 'unauthorized'].includes(result.phase) ? 'Nested spaces unavailable. Reconnect to refresh.' : '');
      },
    });
    return () => { live = false; };
  }, [parent.id, parent.place_id, parent.visibility, offset, runtime.repository, runtime.projections, runtime.revision]);
  return <View>
    {parent.parent_entity_id ? <Button title="Open parent space" onPress={() => router.push(`/entity/${parent.parent_entity_id}`)} /> : null}
    {notice ? <Text style={styles.muted}>{notice}</Text> : null}
    {rows.length ? <Text style={styles.title}>Inside this space</Text> : null}
    {rows.map(row => <Pressable key={row.id} style={styles.card} accessibilityRole="button" onPress={() => router.push(`/entity/${row.id}`)}>
      <Text style={styles.title}>{row.title}</Text><Text style={styles.muted}>{row.place_id}</Text>
      <Text style={styles.text}>{row.summary}</Text>
    </Pressable>)}
    {offset ? <Button title="Previous nested spaces" onPress={() => setOffset(Math.max(0, offset - 50))} /> : null}
    {more ? <Button title="More nested spaces" onPress={() => setOffset(offset + 50)} /> : null}
  </View>;
}
