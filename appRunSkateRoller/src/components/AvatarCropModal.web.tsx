import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {normalizeAvatarWebCanvas} from '../utils/avatarImageNormalize.web';

interface Props {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (jpegDataUri: string) => void;
  /** Perfil: círculo. Chat: cuadrado con esquinas redondeadas. */
  previewShape?: 'circle' | 'square';
  title?: string;
  hint?: string;
  confirmLabel?: string;
}

/**
 * Ajuste de encuadre (web): zoom y desplazamiento antes de subir.
 * Vista previa circular (perfil) o cuadrada (chat).
 */
const AvatarCropModalWeb: React.FC<Props> = ({
  visible,
  imageUri,
  onCancel,
  onConfirm,
  previewShape = 'circle',
  title = 'Ajustar foto de perfil',
  hint = 'Recorte cuadrado centrado. Usa zoom y flechas para encuadrar tu cara.',
  confirmLabel = 'Usar esta foto',
}) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const {width: winW, height: winH} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  /** Círculo más pequeño en móviles bajos para que quepan botones y scroll cómodo */
  const previewSize = useMemo(() => {
    const maxByWidth = Math.min(220, winW - 56);
    const maxByHeight = Math.max(120, Math.min(200, winH * 0.26));
    return Math.round(Math.min(maxByWidth, maxByHeight));
  }, [winW, winH]);

  const sheetMaxHeight = useMemo(() => {
    const usable = winH - insets.top - insets.bottom - 20;
    return Math.min(usable, winH * 0.94);
  }, [winH, insets.top, insets.bottom]);

  useEffect(() => {
    if (!visible || !imageUri) {
      return;
    }
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [visible, imageUri]);

  useEffect(() => {
    if (!imageUri || !visible) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setWorking(true);
    normalizeAvatarWebCanvas(imageUri, {zoom, panX, panY}).then((u) => {
      if (!cancelled) {
        setPreview(u);
        setWorking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [imageUri, zoom, panX, panY, visible]);

  const bumpZoom = (delta: number) => {
    setZoom((z) => Math.max(1, Math.min(3, Math.round((z + delta) * 100) / 100)));
  };

  const bumpPan = (dx: number, dy: number) => {
    setPanX((x) => Math.max(-1, Math.min(1, Math.round((x + dx) * 10) / 10)));
    setPanY((y) => Math.max(-1, Math.min(1, Math.round((y + dy) * 10) / 10)));
  };

  const handleConfirm = () => {
    if (preview) {
      onConfirm(preview);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  const previewRingStyle = useMemo(() => {
    const isSquare = previewShape === 'square';
    return {
      width: previewSize,
      height: previewSize,
      borderRadius: isSquare ? 14 : previewSize / 2,
    };
  }, [previewSize, previewShape]);
  const previewImgStyle = useMemo(
    () => ({width: previewSize, height: previewSize}),
    [previewSize],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, {paddingTop: Math.max(8, insets.top + 4), paddingBottom: Math.max(8, insets.bottom + 4)}]}>
        <View style={styles.sheet}>
          <ScrollView
            style={{maxHeight: sheetMaxHeight}}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            bounces={false}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.hint}>{hint}</Text>

            <View style={[styles.previewRing, previewRingStyle]}>
              {preview ? (
                <Image source={{uri: preview}} style={previewImgStyle} resizeMode="cover" />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Text style={styles.previewPlaceholderText}>{working ? '…' : '—'}</Text>
                </View>
              )}
            </View>

            <Text style={styles.label}>Zoom {zoom.toFixed(2)}×</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.stepBtn, styles.stepBtnSpacer]} onPress={() => bumpZoom(-0.15)}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.stepBtn} onPress={() => bumpZoom(0.15)}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Posición</Text>
            <View style={styles.pad}>
              <View style={styles.padRow}>
                <TouchableOpacity style={styles.padBtn} onPress={() => bumpPan(0, -0.1)}>
                  <Text style={styles.padBtnText}>↑</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.padRow}>
                <TouchableOpacity style={styles.padBtn} onPress={() => bumpPan(-0.1, 0)}>
                  <Text style={styles.padBtnText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.padBtn} onPress={() => bumpPan(0.1, 0)}>
                  <Text style={styles.padBtnText}>→</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.padRow}>
                <TouchableOpacity style={styles.padBtn} onPress={() => bumpPan(0, 0.1)}>
                  <Text style={styles.padBtnText}>↓</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.okBtn, !preview && styles.okBtnDisabled]}
                onPress={handleConfirm}
                disabled={!preview}>
                <Text style={styles.okBtnText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  previewRing: {
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#6C63FF',
    marginBottom: 14,
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderText: {
    fontSize: 28,
    color: '#999',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepBtn: {
    minWidth: 52,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  stepBtnSpacer: {
    marginRight: 12,
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  pad: {
    alignItems: 'center',
    marginBottom: 12,
  },
  padRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 4,
  },
  padBtn: {
    minWidth: 48,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  padBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    marginRight: 6,
  },
  cancelBtnText: {
    fontWeight: '700',
    color: '#334155',
  },
  okBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    marginLeft: 6,
  },
  okBtnDisabled: {
    opacity: 0.45,
  },
  okBtnText: {
    fontWeight: '800',
    color: '#fff',
  },
});

export default AvatarCropModalWeb;
