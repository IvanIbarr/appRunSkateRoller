import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import {launchImageLibrary} from 'react-native-image-picker';
import {EmojiPicker} from './EmojiPicker';
import AvatarCropModal from './AvatarCropModal';
import chatService, {Message, type ChatResponse} from '../services/chatService';
import {pickAvatarImageFromLibrary} from '../utils/pickAvatarImage';
import {resolveMediaUrl} from '../config/api';

export type ChatThreadVariant = 'general' | 'staff';

interface ChatThreadProps {
  chatType: ChatThreadVariant;
  currentUserId: string;
  currentUserName: string;
  /** Para indicadores de actividad (tabs). */
  onLatestTimestamp?: (tsMs: number) => void;
}

const POLLING_INTERVAL = 3000;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
/** Evita cuelgues invisibles si el servidor tarda; el usuario recibe un error claro. */
const CHAT_SEND_TIMEOUT_MS = 60000;

function alertChat(title: string, message?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  chatType,
  currentUserId,
  currentUserName: _currentUserName,
  onLatestTimestamp,
}) => {
  void _currentUserName;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);
  const [webCropUri, setWebCropUri] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingMediaRef = useRef<typeof pendingMedia>(null);
  const isStaff = chatType === 'staff';
  const accent = isStaff ? '#34C759' : '#007AFF';

  useEffect(() => {
    pendingMediaRef.current = pendingMedia;
  }, [pendingMedia]);

  useEffect(() => {
    const loadInitialMessages = async () => {
      await loadMessages(true);
      startPolling();
    };
    loadInitialMessages();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const loadMessages = async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const response = await chatService.getMessages(chatType);
      if (response.success && response.messages) {
        const formattedMessages = response.messages.map(msg => ({
          ...msg,
          timestamp:
            typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        }));
        setMessages(formattedMessages);
        try {
          const last = formattedMessages[formattedMessages.length - 1];
          if (last) {
            const ms = (last.timestamp instanceof Date
              ? last.timestamp
              : new Date(last.timestamp)).getTime();
            if (Number.isFinite(ms)) {
              onLatestTimestamp?.(ms);
            }
          }
        } catch {
          // ignore
        }
        if (isInitialLoad) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: false});
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      if (isInitialLoad) {
        alertChat('Error', 'No se pudieron cargar los mensajes');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(() => {
      loadMessages(false);
    }, POLLING_INTERVAL);
  };

  const uploadBlobOrFile = async (payload: Blob | {uri: string; name: string; type: string}) => {
    setUploading(true);
    try {
      const res = await chatService.uploadMedia(payload);
      if (res.success && res.url && res.mediaType) {
        const next = {url: res.url, type: res.mediaType};
        setPendingMedia(next);
        pendingMediaRef.current = next;
      } else {
        alertChat('Error', res.error || 'No se pudo subir el archivo');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImageAfterPick = async (dataUri: string) => {
    try {
      const res = await fetch(dataUri);
      const blob = await res.blob();
      await uploadBlobOrFile(blob);
    } catch (e) {
      console.warn('ChatThread: subida imagen', e);
      alertChat('Error', 'No se pudo preparar la imagen para enviar.');
    }
  };

  const onPressAttachImage = async () => {
    const uri = await pickAvatarImageFromLibrary();
    if (!uri) {
      return;
    }
    if (Platform.OS === 'web') {
      setWebCropUri(uri);
      return;
    }
    await handleImageAfterPick(uri);
  };

  const onWebCropConfirm = (jpegDataUri: string) => {
    setWebCropUri(null);
    void handleImageAfterPick(jpegDataUri);
  };

  const onPressAttachVideo = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/mp4,video/quicktime,video/webm';
      input.setAttribute('aria-hidden', 'true');
      input.onchange = () => {
        const file = input.files?.[0];
        try {
          if (input.parentNode) {
            input.parentNode.removeChild(input);
          }
        } catch {
          /* ignore */
        }
        if (!file) {
          return;
        }
        if (file.size > MAX_VIDEO_BYTES) {
          alertChat('Chat', 'El video supera 80 MB.');
          return;
        }
        void uploadBlobOrFile(file);
      };
      document.body.appendChild(input);
      input.click();
      return;
    }
    void pickVideoNative();
  };

  const pickVideoNative = async () => {
    const result = await launchImageLibrary({
      mediaType: 'video',
      selectionLimit: 1,
    });
    if (result.didCancel || result.errorCode) {
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      alertChat('Chat', 'No se encontró el video.');
      return;
    }
    const size = asset.fileSize ?? 0;
    if (size > MAX_VIDEO_BYTES) {
      alertChat('Chat', 'El video supera 80 MB. Elige uno más corto o comprímelo.');
      return;
    }
    const name = asset.fileName || `chat-${Date.now()}.mp4`;
    const type = asset.type || 'video/mp4';
    await uploadBlobOrFile({uri: asset.uri, name, type});
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    const pending = pendingMediaRef.current;
    if (!text && !pending?.url) {
      return;
    }
    if (uploading || sending) {
      return;
    }
    const prevText = inputText;
    const prevPending = pending;
    setInputText('');
    setPendingMedia(null);
    pendingMediaRef.current = null;
    setSending(true);
    let sendTimeout: ReturnType<typeof setTimeout> | null = null;
    const clearSendTimeout = () => {
      if (sendTimeout !== null) {
        clearTimeout(sendTimeout);
        sendTimeout = null;
      }
    };
    try {
      const requestPromise = chatService
        .createMessage(
          chatType,
          text,
          prevPending?.url ? prevPending : undefined,
        )
        .then((res) => {
          clearSendTimeout();
          return res;
        });
      const response = await Promise.race<ChatResponse>([
        requestPromise,
        new Promise<ChatResponse>((_, reject) => {
          sendTimeout = setTimeout(() => {
            sendTimeout = null;
            reject(
              new Error(
                'El envío tardó demasiado (red o servidor). Revisa la conexión o inténtalo de nuevo en unos segundos.',
              ),
            );
          }, CHAT_SEND_TIMEOUT_MS);
        }),
      ]);
      const created = response.message;
      const sendOk =
        response.success === true ||
        Boolean(created?.id);

      if (sendOk) {
        if (created?.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === created.id)) {
              return prev;
            }
            const ts =
              typeof created.timestamp === 'string'
                ? new Date(created.timestamp)
                : (created.timestamp as Date);
            return [
              ...prev,
              {
                ...created,
                timestamp: ts,
              },
            ];
          });
        }
        // No bloquear la UI: antes se esperaba POST + recarga de todo el hilo; en redes lentas parecía “congelado”.
        void loadMessages(false)
          .then(() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({animated: true});
            }, 80);
          })
          .catch(() => {
            // ignore: ya mostramos el mensaje añadido
          });
      } else {
        alertChat('Error', response.error || 'No se pudo enviar el mensaje');
        setInputText(prevText);
        setPendingMedia(prevPending);
        pendingMediaRef.current = prevPending;
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const msg = error instanceof Error ? error.message : 'No se pudo enviar el mensaje';
      alertChat('Error', msg);
      setInputText(prevText);
      setPendingMedia(prevPending);
      pendingMediaRef.current = prevPending;
    } finally {
      clearSendTimeout();
      setSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasReadyAttachment = Boolean(pendingMedia?.url);
  const canSend =
    !sending &&
    !uploading &&
    (inputText.trim().length > 0 || hasReadyAttachment);

  const renderMessage = ({item}: {item: Message}) => {
    const isOwnMessage = item.userId === currentUserId;
    const isSystemMessage = item.userId === 'system';
    const mediaUri = item.attachmentUrl
      ? resolveMediaUrl(item.attachmentUrl)
      : '';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage &&
            (isStaff ? styles.ownMessageStaff : styles.ownMessageGeneral),
          isSystemMessage && styles.systemMessageContainer,
        ]}>
        {!isSystemMessage && (
          <View style={styles.msgHeaderRow}>
            <View
              style={[
                styles.avatarDot,
                isStaff ? styles.avatarDotStaff : styles.avatarDotGeneral,
                isOwnMessage && styles.avatarDotOwn,
              ]}
            />
            <Text style={[styles.userName, isOwnMessage && styles.ownUserName]}>
              {isOwnMessage ? 'Tú' : item.userName}
            </Text>
          </View>
        )}
        {item.attachmentType === 'image' && mediaUri ? (
          <View style={styles.msgImageWrap}>
            <Image
              source={{uri: mediaUri}}
              style={styles.msgImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
        {item.attachmentType === 'video' && mediaUri ? (
          <View style={styles.videoWrap}>
            {Platform.OS === 'web' ? (
              // En web, usa el <video> nativo para compatibilidad (Safari/iOS, Chrome, etc.)
              // eslint-disable-next-line react/no-unknown-property
              <video
                src={mediaUri}
                controls
                playsInline
                preload="metadata"
                style={{width: '100%', height: 200, display: 'block'}}
              />
            ) : (
              <Video
                source={{uri: mediaUri}}
                style={styles.msgVideo}
                controls
                resizeMode="contain"
                onError={(e) => {
                  console.warn('Chat video error', e);
                  alertChat('Chat', 'No se pudo reproducir el video.');
                }}
              />
            )}
          </View>
        ) : null}
        {!!item.text?.trim() && (
          <Text
            style={[
              styles.messageText,
              isOwnMessage && styles.ownMessageText,
              isSystemMessage && styles.systemMessageText,
            ]}>
            {item.text}
          </Text>
        )}
        <Text
          style={[
            styles.timestamp,
            isOwnMessage && styles.ownTimestamp,
            isOwnMessage &&
              isStaff &&
              styles.ownTimestampStaff,
          ]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
      <FlatList
        ref={flatListRef}
        style={styles.list}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
      />

      {pendingMedia ? (
        <View style={styles.pendingBar}>
          {pendingMedia.type === 'image' && pendingMedia.url ? (
            <Image
              source={{uri: resolveMediaUrl(pendingMedia.url)}}
              style={styles.pendingThumb}
            />
          ) : (
            <Text style={styles.pendingEmoji}>
              {pendingMedia.type === 'image' ? '🖼' : '🎬'}
            </Text>
          )}
          <Text style={styles.pendingText} numberOfLines={1}>
            {pendingMedia.type === 'image' ? 'Imagen lista' : 'Video listo'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setPendingMedia(null);
              pendingMediaRef.current = null;
            }}>
            <Text style={styles.pendingClear}>Quitar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.inputOuter}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={onPressAttachImage}
            disabled={uploading}>
            <Text style={styles.attachBtnText}>🖼</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={onPressAttachVideo}
            disabled={uploading}>
            <Text style={styles.attachBtnText}>🎬</Text>
          </TouchableOpacity>

          <View style={styles.inputPill}>
            <TouchableOpacity
              style={styles.emojiInlineBtn}
              onPress={() => setShowEmojiPicker(true)}
              disabled={uploading}>
              <Text style={styles.emojiButtonText}>😀</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Mensaje…"
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            hitSlop={10}
            style={({pressed}) => [
              styles.sendButton,
              styles.sendButtonHit,
              {backgroundColor: accent},
              !canSend && styles.sendButtonDisabled,
              Platform.OS === 'web' && styles.sendButtonWeb,
              pressed && canSend && styles.sendButtonPressed,
            ]}
            onPress={handleSendMessage}
            disabled={!canSend}>
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>➤</Text>
            )}
          </Pressable>
        </View>
        {sending ? (
          <Text style={styles.uploadHint}>Enviando… (si la red va lento, esto es normal)</Text>
        ) : uploading ? (
          <Text style={styles.uploadHint}>Subiendo archivo…</Text>
        ) : null}
      </View>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleEmojiSelect}
      />

      <AvatarCropModal
        visible={!!webCropUri}
        imageUri={webCropUri}
        onCancel={() => setWebCropUri(null)}
        onConfirm={onWebCropConfirm}
        previewShape="square"
        title="Ajustar imagen para el chat"
        hint="Vista cuadrada como en el mensaje. Zoom y flechas para encuadrar."
        confirmLabel="Usar en el chat"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#94a3b8',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    // Espacio para la barra flotante de ingreso
    paddingBottom: 120,
    flexGrow: 1,
  },
  messageContainer: {
    backgroundColor: 'rgba(2, 6, 23, 0.32)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    maxWidth: '88%',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.14)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
    borderTopLeftRadius: 8,
  },
  ownMessageGeneral: {
    backgroundColor: 'rgba(56, 189, 248, 0.22)',
    alignSelf: 'flex-end',
    borderColor: 'rgba(56, 189, 248, 0.38)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 6,
  },
  ownMessageStaff: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    alignSelf: 'flex-end',
    borderColor: 'rgba(74, 222, 128, 0.32)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 6,
  },
  systemMessageContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    alignSelf: 'center',
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  msgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  avatarDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(226,232,240,0.70)',
    backgroundColor: 'rgba(226,232,240,0.16)',
  },
  avatarDotGeneral: {
    borderColor: 'rgba(56, 189, 248, 0.95)',
  },
  avatarDotStaff: {
    borderColor: 'rgba(34, 197, 94, 0.95)',
  },
  avatarDotOwn: {
    borderColor: 'rgba(251, 191, 36, 0.95)',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(226, 232, 240, 0.90)',
    marginBottom: 0,
    letterSpacing: 0.2,
  },
  ownUserName: {
    color: 'rgba(226, 232, 240, 0.95)',
  },
  messageText: {
    fontSize: 16,
    color: 'rgba(248, 250, 252, 0.96)',
    marginBottom: 6,
    lineHeight: 21,
  },
  ownMessageText: {
    color: '#F8FAFC',
  },
  systemMessageText: {
    color: '#E2E8F0',
    fontWeight: '500',
    textAlign: 'center',
  },
  msgImageWrap: {
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: 280,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(15,23,42,0.2)',
  },
  msgImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.2)',
  },
  videoWrap: {
    width: 240,
    maxWidth: '100%',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  msgVideo: {
    width: '100%',
    height: 200,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(226,232,240,0.72)',
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.20)',
  },
  ownTimestamp: {
    color: '#BFDBFE',
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  ownTimestampStaff: {
    color: 'rgba(240, 253, 244, 0.9)',
  },
  pendingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  pendingThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#334155',
    marginRight: 10,
  },
  pendingEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  pendingText: {
    color: '#e2e8f0',
    fontSize: 14,
    flex: 1,
  },
  pendingClear: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 14,
  },
  inputOuter: {
    // Barra flotante estilo “cristal”
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    borderRadius: 26,
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.16)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(226, 232, 240, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  attachBtnText: {
    fontSize: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  inputPill: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(226, 232, 240, 0.10)',
    borderRadius: 22,
    paddingLeft: 6,
    paddingRight: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.14)',
  },
  emojiInlineBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(226, 232, 240, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  emojiButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 38,
    maxHeight: 96,
    fontSize: 16,
    backgroundColor: 'transparent',
    zIndex: 0,
    color: 'rgba(248, 250, 252, 0.96)',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Evita que el textarea (web) capture clics que visualmente caen sobre Enviar */
  sendButtonHit: {
    zIndex: 2,
    elevation: 4,
  },
  sendButtonWeb: Platform.select({
    web: {cursor: 'pointer' as const},
    default: {},
  }),
  sendButtonPressed: {
    opacity: 0.88,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  uploadHint: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontSize: 12,
    color: 'rgba(148, 163, 184, 0.95)',
  },
});
