import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {ApiClient} from './api';
import {clearTokens, loadTokens, saveTokens} from './storage';
import type {Chat, Message, User} from './types';
import {KrugWebSocket} from './ws';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => new ApiClient(async () => token), [token]);
  const ws = useMemo(() => new KrugWebSocket(), []);

  const loadChats = async () => setChats(await api.chats());
  const loadMessages = async (chat: Chat) => {
    setActiveChat(chat);
    setMessages((await api.messages(chat.id)).reverse());
  };

  useEffect(() => {
    (async () => {
      const saved = await loadTokens();
      if (!saved) return setLoading(false);
      setToken(saved.accessToken);
      try {
        const client = new ApiClient(async () => saved.accessToken);
        setUser(await client.me());
        setChats(await client.chats());
      } catch {
        await clearTokens();
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    ws.connect(token);
    return ws.on(event => {
      if (event.type === 'message.created' && activeChat && event.chatId === activeChat.id) {
        const message = event.message as Message;
        setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      }
      if (event.type === 'message.created' || event.type === 'chat.member_added' || event.type === 'chat.member_removed') {
        loadChats().catch(() => undefined);
      }
    });
  }, [token, ws, activeChat]);

  useEffect(() => () => ws.disconnect(), [ws]);

  const completeAuth = async (accessToken: string, authenticatedUser: User) => {
    await saveTokens({accessToken});
    setToken(accessToken);
    setUser(authenticatedUser);
    setChats(await new ApiClient(async () => accessToken).chats());
  };

  const logout = async () => {
    ws.disconnect();
    await clearTokens();
    setToken(null);
    setUser(null);
    setChats([]);
    setActiveChat(null);
    setMessages([]);
  };

  if (loading) return <Centered label="Loading Krug…" />;
  if (!user) return <AuthScreen api={api} onAuthenticated={completeAuth} />;
  if (activeChat) {
    return <MessagesScreen chat={activeChat} messages={messages} onBack={() => setActiveChat(null)} onSend={async text => {
      const message = await api.sendMessage(activeChat.id, text);
      setMessages(current => [...current, message]);
    }} />;
  }
  return <ChatsScreen user={user} chats={chats} onRefresh={() => loadChats().catch(error => Alert.alert('Could not load chats', error.message))} onOpen={chat => loadMessages(chat).catch(error => Alert.alert('Could not load messages', error.message))} onLogout={logout} />;
}

function AuthScreen({api, onAuthenticated}: {api: ApiClient; onAuthenticated: (token: string, user: User) => Promise<void>}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bootstrap, setBootstrap] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const result = bootstrap ? await api.bootstrap(email, password, displayName) : await api.login(email, password);
      await onAuthenticated(result.accessToken, result.user);
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Unknown error');
    } finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.screen}><Text style={styles.title}>Krug</Text><Text style={styles.subtitle}>{bootstrap ? 'Create the first owner account' : 'Sign in to your messenger'}</Text>
    <TextInput style={styles.input} autoCapitalize="none" keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
    <TextInput style={styles.input} secureTextEntry placeholder="Password" value={password} onChangeText={setPassword} />
    {bootstrap && <TextInput style={styles.input} placeholder="Display name" value={displayName} onChangeText={setDisplayName} />}
    {busy ? <ActivityIndicator /> : <Button title={bootstrap ? 'Bootstrap owner' : 'Login'} onPress={submit} />}
    <View style={styles.spacer} /><Button title={bootstrap ? 'I already have an account' : 'Create first owner account'} onPress={() => setBootstrap(!bootstrap)} />
  </SafeAreaView>;
}

function ChatsScreen({user, chats, onRefresh, onOpen, onLogout}: {user: User; chats: Chat[]; onRefresh: () => void; onOpen: (chat: Chat) => void; onLogout: () => void}) {
  return <SafeAreaView style={styles.screen}><View style={styles.row}><View><Text style={styles.title}>Chats</Text><Text>{user.displayName}</Text></View><Button title="Logout" onPress={onLogout} /></View><Button title="Refresh" onPress={onRefresh} />
    <FlatList data={chats} keyExtractor={item => item.id} ListEmptyComponent={<Text style={styles.empty}>No chats yet.</Text>} renderItem={({item}) => <TouchableOpacity style={styles.chat} onPress={() => onOpen(item)}><Text style={styles.chatTitle}>{item.title || (item.type === 'direct' ? 'Direct chat' : 'Untitled group')}</Text><Text>{item.updated_at}</Text></TouchableOpacity>} />
  </SafeAreaView>;
}

function MessagesScreen({chat, messages, onBack, onSend}: {chat: Chat; messages: Message[]; onBack: () => void; onSend: (text: string) => Promise<void>}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => { if (!text.trim()) return; setBusy(true); try { await onSend(text.trim()); setText(''); } catch (error) { Alert.alert('Could not send', error instanceof Error ? error.message : 'Unknown error'); } finally { setBusy(false); } };
  return <SafeAreaView style={styles.screen}><View style={styles.row}><Button title="Back" onPress={onBack} /><Text style={styles.title}>{chat.title || 'Chat'}</Text></View><FlatList data={messages} keyExtractor={item => item.id} renderItem={({item}) => <View style={styles.message}><Text>{item.text || '[message unavailable]'}</Text><Text style={styles.timestamp}>{item.created_at}</Text></View>} />
    <View style={styles.composer}><TextInput style={[styles.input, styles.composerInput]} placeholder="Message" value={text} onChangeText={setText} /><Button title={busy ? '…' : 'Send'} disabled={busy} onPress={send} /></View>
  </SafeAreaView>;
}

function Centered({label}: {label: string}) { return <View style={styles.center}><ActivityIndicator /><Text>{label}</Text></View>; }

const styles = StyleSheet.create({screen: {flex: 1, padding: 16, gap: 12}, center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12}, title: {fontSize: 28, fontWeight: '700'}, subtitle: {fontSize: 16, color: '#555'}, input: {borderWidth: 1, borderColor: '#bbb', borderRadius: 6, padding: 12, fontSize: 16}, spacer: {height: 8}, row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}, chat: {paddingVertical: 16, borderBottomWidth: 1, borderColor: '#ddd'}, chatTitle: {fontSize: 18, fontWeight: '600'}, empty: {paddingTop: 32, textAlign: 'center', color: '#666'}, message: {padding: 10, marginVertical: 4, backgroundColor: '#f1f1f1', borderRadius: 6}, timestamp: {fontSize: 11, color: '#666', marginTop: 4}, composer: {flexDirection: 'row', alignItems: 'center', gap: 8}, composerInput: {flex: 1}});
