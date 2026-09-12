import React, { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { ScaledText as Text } from '../../components/ScaledText'
import * as ImagePicker from 'expo-image-picker'
import { reporterApi, mediaApi } from '../../api/endpoints'
import { colors, fonts } from '../../theme'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../api/client'
import { mediaUrl } from '../../config'
import { useTheme } from '../../context/ThemeContext'

export default function EkycScreen() {
  const { success, error } = useToast()
  const { colors } = useTheme()
  const [idProofType, setIdProofType] = useState('AADHAAR')
  const [idProofNumber, setIdProofNumber] = useState('')
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const pickDocument = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    if (result.canceled || !result.assets?.[0]) return
    const file = result.assets[0]
    try {
      const res = await mediaApi.upload({ uri: file.uri, name: file.fileName || 'id-doc.jpg', type: file.mimeType || 'image/jpeg' })
      setDocumentUrl(res.url)
      success('Document uploaded')
    } catch (e) {
      error(errorMessage(e))
    }
  }

  const submit = async () => {
    if (!idProofNumber.trim() || !documentUrl) {
      error('Fill ID number and upload document')
      return
    }
    setBusy(true)
    try {
      await reporterApi.submitEkyc({ idProofType, idProofNumber: idProofNumber.trim(), idProofDocumentUrl: documentUrl })
      success('eKYC submitted for verification')
    } catch (e) {
      error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={[styles.safe, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 20 }}>
      <Text style={[styles.title, { color: colors.text }]}>eKYC Verification</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>Upload your identity document to verify your reporter identity.</Text>

      <Text style={[styles.label, { color: colors.text }]}>ID Proof Type</Text>
      {['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE'].map((t) => (
        <Pressable key={t} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }, idProofType === t && [styles.optionActive, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]]} onPress={() => setIdProofType(t)}>
          <Text style={[styles.optionText, { color: colors.text }, idProofType === t && { color: colors.primary }]}>{t.replace(/_/g, ' ')}</Text>
        </Pressable>
      ))}

      <Text style={[styles.label, { color: colors.text }]}>ID Number</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} value={idProofNumber} onChangeText={setIdProofNumber} placeholder="ID number" placeholderTextColor={colors.textLight} />

      <Text style={[styles.label, { color: colors.text }]}>Document Image</Text>
      <Pressable style={[styles.uploadBtn, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]} onPress={pickDocument}>
        <Text style={styles.uploadText}>{documentUrl ? 'Document uploaded ✓ (tap to change)' : 'Upload document image'}</Text>
      </Pressable>
      {documentUrl ? <Image source={{ uri: mediaUrl(documentUrl) }} style={styles.preview} /> : null}

      <Pressable style={[styles.btn, busy && styles.btnDisabled]} onPress={submit} disabled={busy}>
        <Text style={styles.btnText}>{busy ? 'Submitting...' : 'Submit eKYC'}</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.serif[700], fontSize: 22, color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 18, marginBottom: 8 },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: colors.card },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  optionTextActive: { color: colors.primary },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.text },
  uploadBtn: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: 10, paddingVertical: 16, alignItems: 'center', backgroundColor: colors.primarySoft },
  uploadText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  preview: { width: '100%', height: 180, borderRadius: 10, marginTop: 10 },
  btn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
