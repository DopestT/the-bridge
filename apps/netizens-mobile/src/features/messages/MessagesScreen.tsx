import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useRuntime } from "../../runtime/RuntimeProvider";
import { AppShell } from "../../components/AppShell";
import { styles } from "../../components/mobile-styles";
import { ApiError, type ConversationRequest, type Thread } from "../../api/netizens-repository";
export function MessagesScreen() {
  const r = useRuntime(),
    router = useRouter();
  const [rows, setRows] = useState<Thread[]>([]),
    [requests, setRequests] = useState<ConversationRequest[]>([]),
    [handle, setHandle] = useState(''), [notice, setNotice] = useState(''),
    [error, setError] = useState(''), [threadError, setThreadError] = useState(''),
    [requestError, setRequestError] = useState(''), [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const live = useRef(true), generation = useRef(0);
  const refresh = useCallback(async () => {
    const attempt = ++generation.current;
    const [threads, invitations] = await Promise.allSettled([r.repository.threads(), r.repository.conversationRequests()]);
    if (!live.current || attempt !== generation.current) return;
    setLoading(false);
    if (threads.status === 'fulfilled') { setRows(threads.value); setThreadError(''); }
    else { setRows([]); setThreadError('Reconnect to open private conversations.'); }
    if (invitations.status === 'fulfilled') { setRequests(invitations.value); setRequestError(''); }
    else { setRequests([]); setRequestError('Conversation requests unavailable. Reconnect to refresh.'); }
  }, [r.repository]);
  useEffect(() => {
    live.current = true;
    // refresh sets state only after both external reads settle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    return () => { live.current = false; };
  }, [refresh, r.revision]);
  async function invite() {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const outcome = await r.repository.requestConversation(handle.trim().replace(/^@/, '').toLowerCase());
      if (!live.current) return;
      if (outcome.status === 'accepted' && outcome.thread_id) router.push(`/messages/${outcome.thread_id}`);
      else { setNotice('Invitation pending. Messages unlock after acceptance.'); setHandle(''); await refresh(); }
    } catch (e) {
      if (live.current) setError(e instanceof ApiError && e.kind === 'validation' ? e.message
        : e instanceof ApiError && e.code === 'PT429' ? 'Too many invitations. Try again later.'
        : 'Invitation not confirmed. Check the handle, connection or contact permissions.');
    } finally { if (live.current) setBusy(false); }
  }
  async function respond(id: string, action: 'accept' | 'decline' | 'cancel') {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const outcome = await r.repository.respondConversationRequest(id, action);
      if (!live.current) return;
      if (outcome.status === 'accepted' && outcome.thread_id) {
        generation.current++;
        setRequests(current => current.filter(row => row.id !== id));
        router.push(`/messages/${outcome.thread_id}`);
        await refresh();
      }
      else { setNotice(action === 'decline' ? 'Invitation declined.' : 'Invitation cancelled.'); await refresh(); }
    } catch { if (live.current) setError('Could not update this invitation. Refresh and try again.'); }
    finally { if (live.current) setBusy(false); }
  }
  async function block(id: string) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await r.repository.blockCitizen(id);
      if (!live.current) return;
      setRequests(current => current.filter(row => row.requester_id !== id));
      setNotice('Citizen blocked.'); await refresh();
    } catch { if (live.current) setError('Could not block this Citizen. Try again when connected.'); }
    finally { if (live.current) setBusy(false); }
  }
  return (
    <AppShell title="Messages">
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New conversation</Text>
        <Text style={styles.muted}>Invite an exact Citizen handle. Private messages unlock only after they accept.</Text>
        <TextInput style={styles.input} accessibilityLabel="Citizen handle" autoCapitalize="none" autoCorrect={false}
          maxLength={41} value={handle} editable={!busy} onChangeText={setHandle} placeholder="e.g. river" placeholderTextColor="#aaa" />
        <Button title="Request conversation" disabled={busy || !handle.trim()} onPress={() => void invite()} />
        {error ? <Text style={styles.text} accessibilityRole="alert">{error}</Text> : null}
        {notice ? <Text style={styles.text} accessibilityLiveRegion="polite">{notice}</Text> : null}
        <Text style={styles.title}>Invitations</Text>
        {requestError ? <Text style={styles.text} accessibilityRole="alert">{requestError}</Text> : null}
        {!loading && !requestError && !requests.length ? <Text style={styles.muted}>No pending invitations.</Text> : null}
        {requests.map(invitation => {
          const incoming = invitation.recipient_id === r.userId;
          const contact = incoming ? invitation.requester : invitation.recipient;
          return <View key={invitation.id} style={styles.card}>
            <Text style={styles.text}>{incoming ? 'From' : 'To'} @{contact?.handle ?? 'Citizen'}</Text>
            {incoming ? <View style={styles.row}>
              <Button title="Accept" disabled={busy} onPress={() => void respond(invitation.id, 'accept')} />
              <Button title="Decline" disabled={busy} onPress={() => void respond(invitation.id, 'decline')} />
              <Button title="Block Citizen" disabled={busy} onPress={() => void block(invitation.requester_id)} />
            </View> : <Button title="Cancel invitation" disabled={busy} onPress={() => void respond(invitation.id, 'cancel')} />}
          </View>;
        })}
        <Text style={styles.title}>Conversations</Text>
        {loading ? <Text style={styles.muted}>Loading conversations…</Text> : null}
        {threadError ? <Text style={styles.text} accessibilityRole="alert">{threadError}</Text> : null}
        {!loading && !threadError && !rows.length ? <Text style={styles.muted}>No conversations available.</Text> : null}
        {rows.map(thread => <Pressable key={thread.id} accessibilityRole="button" style={styles.card} onPress={() => router.push(`/messages/${thread.id}`)}>
          <Text style={styles.text}>{thread.title ?? 'Private conversation'}</Text>
        </Pressable>)}
        <Button title="Refresh conversations" disabled={busy} onPress={() => void refresh()} />
      </ScrollView>
    </AppShell>
  );
}
