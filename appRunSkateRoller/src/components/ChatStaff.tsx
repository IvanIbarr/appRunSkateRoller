import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {EmojiPicker} from './EmojiPicker';
import chatService, {Message} from '../services/chatService';

interface ChatStaffProps {
  currentUserId: string;
  currentUserName: string;
}

const POLLING_INTERVAL = 3000; // 3 segundos

export const ChatStaff: React.FC<ChatStaffProps> = ({
  currentUserId,
  currentUserName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageDateRef = useRef<Date | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  // Cargar mensajes iniciales y configurar polling
  useEffect(() => {
    const loadInitialMessages = async () => {
      await loadMessages(true);
      // Iniciar polling después de cargar mensajes iniciales
      startPolling();
    };

    loadInitialMessages();

    // Cleanup: limpiar intervalo al desmontar
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const loadMessages = async (isInitialLoad: boolean = false) => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      
      if (isInitialLoad) {
        setLoading(true);
      }

      const response = await chatService.getMessages('staff');
      if (response.success && response.messages) {
        const formattedMessages = response.messages.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        }));
        setMessages(formattedMessages);
        
        // Guardar fecha del último mensaje
        if (formattedMessages.length > 0) {
          const lastMsg = formattedMessages[formattedMessages.length - 1];
          lastMessageDateRef.current = lastMsg.timestamp instanceof Date 
            ? lastMsg.timestamp 
            : new Date(lastMsg.timestamp);
        }
        
        // Scroll al final solo en carga inicial
        if (isInitialLoad) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: false});
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      // Solo mostrar alerta en carga inicial para no molestar durante polling
      if (isInitialLoad) {
        Alert.alert('Error', 'No se pudieron cargar los mensajes');
      }
    } finally {
      isLoadingRef.current = false;
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    // Limpiar intervalo existente si hay uno
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    // Iniciar nuevo intervalo para polling
    pollingRef.current = setInterval(() => {
      loadMessages(false); // No es carga inicial, es polling
    }, POLLING_INTERVAL);
  };

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const textToSend = inputText.trim();
      setInputText('');
      
      try {
        const response = await chatService.createMessage('staff', textToSend);
        if (response.success) {
          // Recargar mensajes para obtener el último (sin mostrar loading)
          await loadMessages(false);
          // Scroll al final después de enviar
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
        } else {
          Alert.alert('Error', response.error || 'No se pudo enviar el mensaje');
          setInputText(textToSend); // Restaurar texto si falla
        }
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        Alert.alert('Error', 'No se pudo enviar el mensaje');
        setInputText(textToSend); // Restaurar texto si falla
      }
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

  const renderMessage = ({item}: {item: Message}) => {
    const isOwnMessage = item.userId === currentUserId;
    const isSystemMessage = item.userId === 'system';

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage && styles.ownMessageContainer,
          isSystemMessage && styles.systemMessageContainer,
        ]}>
        {!isSystemMessage && (
          <Text style={styles.userName}>
            {isOwnMessage ? 'Tú' : item.userName}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            isOwnMessage && styles.ownMessageText,
            isSystemMessage && styles.systemMessageText,
          ]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(true)}>
          <Text style={styles.emojiButtonText}>😀</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
      
      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleEmojiSelect}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Sin fondo para que la imagen de fondo se vea
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Sin fondo para que la imagen de fondo se vea
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownMessageContainer: {
    backgroundColor: '#34C759',
    alignSelf: 'flex-end',
  },
  systemMessageContainer: {
    backgroundColor: 'rgba(255, 243, 205, 0.95)',
    alignSelf: 'center',
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#FFC107',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#FFF',
  },
  systemMessageText: {
    color: '#856404',
    fontWeight: '500',
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  emojiButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  sendButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
