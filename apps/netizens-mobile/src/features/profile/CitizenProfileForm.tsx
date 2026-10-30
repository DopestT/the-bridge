import { useState } from 'react';
import { Button, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AVATAR_FORMS, AVATAR_MODES, validateProfile, type Citizen, type ProfileInput } from '../../api/citizen-profile';
import { styles } from '../../components/mobile-styles';

export function CitizenProfileForm({ citizen, onSave, onboarding = false, scrollable = true }: {
  citizen: Citizen | null;
  onSave: (value: ProfileInput) => Promise<Citizen>;
  onboarding?: boolean;
  scrollable?: boolean;
}) {
  const [handle, setHandle] = useState(onboarding ? '' : citizen?.handle ?? '');
  const [name, setName] = useState(onboarding ? '' : citizen?.display_name ?? '');
  const [form, setForm] = useState<ProfileInput['avatar_form']>(citizen?.avatar_form ?? 'privacy');
  const [mode, setMode] = useState<ProfileInput['avatar_mode']>(citizen?.avatar_mode ?? 'commons');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const changed = () => { setSaved(false); setError(''); };
  async function submit() {
    if (busy) return;
    setBusy(true); setSaved(false); setError('');
    try {
      await onSave(validateProfile({ handle, display_name: name, avatar_form: form, avatar_mode: mode }));
      setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Profile could not be saved.'); }
    finally { setBusy(false); }
  }
  const fields = <>
    <Text style={styles.text}>{onboarding ? 'Create your Citizen identity. One profile follows you across every Place.' : 'Your Citizen identity'}</Text>
    {citizen ? <Text style={styles.muted}>Level {citizen.level} · {citizen.xp} XP</Text> : null}
    <Text style={styles.text}>Display name</Text>
    <TextInput style={styles.input} accessibilityLabel="Display name" value={name} maxLength={60} editable={!busy}
      onChangeText={value => { setName(value); changed(); }} autoComplete="name" />
    <Text style={styles.text}>Citizen handle</Text>
    <TextInput style={styles.input} accessibilityLabel="Citizen handle" value={handle} maxLength={30} editable={!busy}
      onChangeText={value => { setHandle(value); changed(); }} autoCapitalize="none" autoCorrect={false} />
    <Text style={styles.muted}>Your name and handle are visible to Citizens who can view your profile.</Text>
    <Text style={styles.text}>Avatar form</Text>
    <View style={styles.row}>{AVATAR_FORMS.map(option => <Pressable key={option} style={styles.card} accessibilityRole="radio"
      accessibilityState={{ checked: option === form, disabled: busy }} disabled={busy}
      onPress={() => { setForm(option); changed(); }}>
      <Text style={styles.text}>{option === form ? '● ' : '○ '}{option}</Text>
    </Pressable>)}</View>
    <Text style={styles.muted}>This preference describes your identity style. No likeness or photo is required.</Text>
    <Text style={styles.text}>Home Place</Text>
    <View style={styles.row}>{AVATAR_MODES.map(option => <Pressable key={option} style={styles.card} accessibilityRole="radio"
      accessibilityState={{ checked: option === mode, disabled: busy }} disabled={busy}
      onPress={() => { setMode(option); changed(); }}>
      <Text style={styles.text}>{option === mode ? '● ' : '○ '}{option}</Text>
    </Pressable>)}</View>
    {error ? <Text style={styles.text} accessibilityRole="alert">{error}</Text> : null}
    {saved ? <Text style={styles.text} accessibilityLiveRegion="polite">Profile saved.</Text> : null}
    <Button title={busy ? 'Saving…' : onboarding ? 'Enter NETIZENS' : 'Save profile'} disabled={busy} onPress={() => void submit()} />
  </>;
  return scrollable ? <ScrollView keyboardShouldPersistTaps="handled">{fields}</ScrollView> : <View>{fields}</View>;
}
