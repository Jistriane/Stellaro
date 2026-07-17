import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  BotMessageSquare,
  LifeBuoy,
  SendHorizonal,
  ShieldAlert,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  escalateSupportThread,
  getSupportThread,
  getSupportThreads,
  startSupportChat,
} from '../lib/backend';
import { notify } from '../lib/notify';
import { theme } from '../lib/theme';

export default function Support() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const messageInputRef = React.useRef<TextInput | null>(null);
  const [pendingFocusThreadId, setPendingFocusThreadId] = React.useState<
    string | null
  >(null);
  const [thread, setThread] = React.useState<any | null>(null);
  const [threads, setThreads] = React.useState<any[]>([]);
  const [message, setMessage] = React.useState('');
  const [subject, setSubject] = React.useState('Suporte operacional');
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const scrollToEndAndFocus = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  }, []);

  const loadThreads = React.useCallback(async () => {
    const response = await getSupportThreads(10);
    const nextThreads = Array.isArray(response.threads) ? response.threads : [];
    setThreads(nextThreads);
    setThread((current: any | null) => {
      if (!current?.id) {
        return nextThreads[0] ?? null;
      }
      return nextThreads.find((item) => item.id === current.id) ?? current;
    });
  }, []);

  React.useEffect(() => {
    loadThreads().catch((error: any) => {
      console.warn('Falha ao carregar threads:', error?.message || error);
    });
  }, [loadThreads]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const response = await startSupportChat({
        threadId: thread?.id,
        subject: thread ? undefined : subject,
        message: message.trim(),
      });
      setThread(response.thread);
      await loadThreads();
      setMessage('');
      scrollToEndAndFocus();
    } catch (error: any) {
      notify('Falha no suporte', error?.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!thread?.id) return;
    setRefreshing(true);
    try {
      const response = await getSupportThread(thread.id);
      setThread(response.thread);
      await loadThreads();
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (error: any) {
      notify('Falha ao atualizar', error?.message || 'Não foi possível atualizar a thread.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectThread = async (threadId: string) => {
    setRefreshing(true);
    try {
      const response = await getSupportThread(threadId);
      setThread(response.thread);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (error: any) {
      notify('Falha ao carregar thread', error?.message || 'Não foi possível carregar a thread.');
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    const targetThreadId = route?.params?.threadId;
    if (!targetThreadId) return;
    if (thread?.id === targetThreadId) return;

    setPendingFocusThreadId(targetThreadId);
    handleSelectThread(targetThreadId)
      .then(() => {
        const draftSubject = route?.params?.draftSubject;
        const draftMessage = route?.params?.draftMessage;
        if (draftSubject && typeof draftSubject === 'string') {
          setSubject(draftSubject);
        }
        if (!message && draftMessage && typeof draftMessage === 'string') {
          setMessage(draftMessage);
        }
        navigation.setParams({
          threadId: undefined,
          draftSubject: undefined,
          draftMessage: undefined,
        });
      })
      .catch(() => undefined);
  }, [
    handleSelectThread,
    message,
    navigation,
    route?.params?.draftMessage,
    route?.params?.draftSubject,
    route?.params?.threadId,
    thread?.id,
  ]);

  React.useEffect(() => {
    if (!pendingFocusThreadId) return;
    if (thread?.id !== pendingFocusThreadId) return;

    scrollToEndAndFocus();

    setPendingFocusThreadId(null);
  }, [pendingFocusThreadId, scrollToEndAndFocus, thread?.id, thread?.messages?.length]);

  const handleEscalate = async () => {
    if (!thread?.id) return;
    setRefreshing(true);
    try {
      const response = await escalateSupportThread(thread.id);
      setThread((current: any) => ({ ...current, ...response.thread }));
      await loadThreads();
      notify('Thread escalonada', 'O atendimento humano foi sinalizado para esta conversa.');
    } catch (error: any) {
      notify('Falha ao escalonar', error?.message || 'Não foi possível escalonar a thread.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>ElizaOS Support</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleRefresh} disabled={!thread?.id}>
            {refreshing ? (
              <ActivityIndicator color={theme.colors.gold} size="small" />
            ) : (
              <LifeBuoy size={16} color={thread?.id ? theme.colors.gold : theme.colors.inkFaint} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Suporte assistivo read-only com contexto de KYC, orders e PIX.
        </Text>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Threads recentes</Text>
            <Text style={styles.sectionCaption}>{threads.length} abertas</Text>
          </View>
          {threads.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma thread recente encontrada.</Text>
          ) : (
            threads.map((item) => {
              const selected = item.id === thread?.id;
              const preview =
                item.messages?.[0]?.messageText || item.subject || 'Sem mensagens ainda';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.threadRow, selected && styles.threadRowSelected]}
                  onPress={() => handleSelectThread(item.id)}
                >
                  <View style={styles.threadMeta}>
                    <Text style={styles.threadTitle}>{item.subject || 'Suporte operacional'}</Text>
                    <Text style={styles.threadPreview} numberOfLines={1}>
                      {preview}
                    </Text>
                  </View>
                  <Text style={styles.threadStatus}>{item.status}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nova mensagem</Text>
            {thread?.id ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleEscalate}
                disabled={refreshing || thread?.status === 'ESCALATED'}
              >
                <ShieldAlert size={14} color={theme.colors.gold} />
                <Text style={styles.secondaryButtonText}>
                  {thread?.status === 'ESCALATED' ? 'Escalonada' : 'Escalonar'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.sectionTitle}>Assunto</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            editable={!thread}
            placeholder="Ex.: Status do saque PIX"
            placeholderTextColor={theme.colors.inkFaint}
          />
          <Text style={styles.sectionTitle}>Mensagem</Text>
          <TextInput
            ref={messageInputRef}
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Descreva o que você precisa consultar..."
            placeholderTextColor={theme.colors.inkFaint}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleSend} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <>
                <SendHorizonal size={16} color={theme.colors.bg} />
                <Text style={styles.primaryButtonText}>
                  {thread ? 'Enviar nova mensagem' : 'Abrir thread com ElizaOS'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Conversa</Text>
          {!thread?.messages?.length ? (
            <View style={styles.emptyState}>
              <BotMessageSquare size={20} color={theme.colors.gold} />
              <Text style={styles.emptyText}>
                Inicie uma conversa para consultar status de KYC, ordem ou PIX.
              </Text>
            </View>
          ) : (
            thread.messages.map((item: any) => (
              <View
                key={item.id}
                style={[
                  styles.messageBubble,
                  item.senderType === 'assistant'
                    ? styles.assistantBubble
                    : styles.userBubble,
                ]}
              >
                <Text style={styles.messageRole}>
                  {item.senderType === 'assistant' ? 'ElizaOS' : 'Você'}
                </Text>
                <Text style={styles.messageText}>{item.messageText}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: theme.colors.ink, fontSize: 24, fontFamily: theme.fonts.sansMedium },
  subtitle: { color: theme.colors.inkDim, fontSize: 14, fontFamily: theme.fonts.sansLight },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bg2,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.bg2,
    borderRadius: theme.radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: { color: theme.colors.ink, fontSize: 16, fontFamily: theme.fonts.sansMedium },
  sectionCaption: {
    color: theme.colors.inkDim,
    fontSize: 12,
    fontFamily: theme.fonts.sansLight,
  },
  input: {
    backgroundColor: theme.colors.bg3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansRegular,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: { color: theme.colors.bg, fontFamily: theme.fonts.sansMedium, fontSize: 14 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.rule,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.bg3,
  },
  secondaryButtonText: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
  },
  emptyState: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansLight,
    fontSize: 13,
    textAlign: 'center',
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.rule,
  },
  threadRowSelected: {
    backgroundColor: theme.colors.bg3,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  threadMeta: { flex: 1 },
  threadTitle: {
    color: theme.colors.ink,
    fontFamily: theme.fonts.sansMedium,
    fontSize: 14,
  },
  threadPreview: {
    color: theme.colors.inkDim,
    fontFamily: theme.fonts.sansLight,
    fontSize: 12,
    marginTop: 4,
  },
  threadStatus: {
    color: theme.colors.gold,
    fontFamily: theme.fonts.mono,
    fontSize: 11,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  assistantBubble: {
    backgroundColor: theme.colors.bg3,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  userBubble: {
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.rule,
  },
  messageRole: {
    color: theme.colors.gold,
    fontSize: 11,
    fontFamily: theme.fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  messageText: {
    color: theme.colors.ink,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.fonts.sansRegular,
  },
});
