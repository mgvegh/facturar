import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../ThemeContext';
import { spacing, radius, palette } from '../theme';
import { supabase } from '../supabase';

const CATEGORIAS = ['A','B','C','D','E','F','G','H','I','J','K'];

export default function PerfilScreen() {
  const { c, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cuit, setCuit] = useState('');
  const [categoria, setCategoria] = useState('D');
  const [puntoVenta, setPuntoVenta] = useState('2');
  // Guardamos los valores originales para cancelar
  const [original, setOriginal] = useState<any>({});

  useEffect(() => { cargarPerfil(); }, []);

  const cargarPerfil = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userEmail = user.email || '';
      setEmail(userEmail);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setNombre(data.nombre || '');
        setApellido(data.apellido || '');
        setCuit(data.cuit || '');
        setCategoria(data.categoria_monotributo || 'D');
        setPuntoVenta(String(data.punto_venta || '2'));
        setOriginal({ ...data, email: userEmail });
      } else {
        setOriginal({ email: userEmail });
      }
    }
    setLoading(false);
  };

  const handleEditar = () => setEditando(true);

  const handleCancelar = () => {
    setNombre(original.nombre || '');
    setApellido(original.apellido || '');
    setCuit(original.cuit || '');
    setCategoria(original.categoria_monotributo || 'D');
    setPuntoVenta(String(original.punto_venta || '2'));
    setEmail(original.email || '');
    setEditando(false);
  };

  const guardarPerfil = async () => {
    if (!nombre || !apellido || !cuit) {
      Alert.alert('Error', 'Completá nombre, apellido y CUIT');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
if (email !== original.email) {
  const { error: emailError } = await supabase.auth.updateUser({ email });
  if (emailError) {
    Alert.alert('Error', 'No se pudo actualizar el email: ' + emailError.message);
    setSaving(false);
    return;
  }
  Alert.alert('Verificación', 'Te enviamos un email de confirmación a ' + email + '. Confirmalo para que el cambio tome efecto.');
}
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        nombre,
        apellido,
        cuit,
        categoria_monotributo: categoria,
        punto_venta: parseInt(puntoVenta),
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setOriginal({ nombre, apellido, cuit, categoria_monotributo: categoria, punto_venta: parseInt(puntoVenta), email });
        setEditando(false);
        Alert.alert('', 'Perfil actualizado correctamente');
      }
    }
    setSaving(false);
  };

  const cerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={c.primary} />
      </SafeAreaView>
    );
  }

  const iniciales = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase() || email?.[0]?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.topbar, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <Text style={[styles.topbarTitle, { color: c.text }]}>Mi perfil</Text>
        {!editando ? (
          <TouchableOpacity onPress={handleEditar}>
            <Text style={[styles.topbarAction, { color: c.primary }]}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleCancelar}>
            <Text style={[styles.topbarAction, { color: c.danger }]}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: c.primaryLight }]}>
            <Text style={[styles.avatarText, { color: c.primary }]}>{iniciales}</Text>
          </View>
          <Text style={[styles.avatarName, { color: c.text }]}>
            {nombre && apellido ? `${nombre} ${apellido}` : email}
          </Text>
          <Text style={[styles.avatarEmail, { color: c.textMuted }]}>{email}</Text>
          {cuit ? <Text style={[styles.avatarCuit, { color: c.textMuted }]}>CUIT {cuit}</Text> : null}
        </View>

        {/* Datos personales */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.textMuted }]}>Datos personales</Text>

          <Text style={[styles.label, { color: c.textMuted }]}>Nombre</Text>
          <TextInput
            style={[styles.input, { borderColor: c.border, backgroundColor: editando ? c.cardAlt : c.bg, color: editando ? c.text : c.textMuted }]}
            value={nombre} onChangeText={setNombre}
            placeholder="Tu nombre" placeholderTextColor={c.textLight}
            editable={editando}
          />

          <Text style={[styles.label, { color: c.textMuted }]}>Apellido</Text>
          <TextInput
            style={[styles.input, { borderColor: c.border, backgroundColor: editando ? c.cardAlt : c.bg, color: editando ? c.text : c.textMuted }]}
            value={apellido} onChangeText={setApellido}
            placeholder="Tu apellido" placeholderTextColor={c.textLight}
            editable={editando}
          />

          <Text style={[styles.label, { color: c.textMuted }]}>Email</Text>
<View style={{ flexDirection: 'row', gap: spacing.sm }}>
  <TextInput
    style={[styles.input, { flex: 1, borderColor: c.border, backgroundColor: editando ? c.cardAlt : c.bg, color: editando ? c.text : c.textMuted }]}
    value={email}
    onChangeText={setEmail}
    placeholder="tu@email.com"
    keyboardType="email-address"
    autoCapitalize="none"
    placeholderTextColor={c.textLight}
    editable={editando}
  />
</View>
        </View>

        {/* Datos fiscales */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.textMuted }]}>Datos fiscales</Text>

          <Text style={[styles.label, { color: c.textMuted }]}>CUIT</Text>
          <TextInput
            style={[styles.input, { borderColor: c.border, backgroundColor: editando ? c.cardAlt : c.bg, color: editando ? c.text : c.textMuted }]}
            value={cuit} onChangeText={setCuit}
            placeholder="20-12345678-9" keyboardType="numeric"
            placeholderTextColor={c.textLight}
            editable={editando}
          />

          <Text style={[styles.label, { color: c.textMuted }]}>Categoría monotributo</Text>
          <View style={[styles.categGrid, { opacity: editando ? 1 : 0.6 }]}>
            {CATEGORIAS.map(cat => (
              <TouchableOpacity
                key={cat}
                disabled={!editando}
                onPress={() => setCategoria(cat)}
                style={[styles.categBtn, {
                  backgroundColor: categoria === cat ? c.primary : c.cardAlt,
                  borderColor: categoria === cat ? c.primary : c.border,
                }]}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: categoria === cat ? (isDark ? palette.navy : palette.white) : c.textMuted }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: c.textMuted }]}>Punto de venta</Text>
          <TextInput
            style={[styles.input, { borderColor: c.border, backgroundColor: editando ? c.cardAlt : c.bg, color: editando ? c.text : c.textMuted }]}
            value={puntoVenta} onChangeText={setPuntoVenta}
            keyboardType="numeric" placeholderTextColor={c.textLight}
            editable={editando}
          />
        </View>

        {/* Botón guardar — solo visible al editar */}
        {editando && (
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={guardarPerfil}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={isDark ? palette.navy : palette.white} />
              : <Text style={[styles.btnText, { color: isDark ? palette.navy : palette.white }]}>Guardar cambios</Text>
            }
          </TouchableOpacity>
        )}

        {/* Cerrar sesión */}
        <TouchableOpacity style={[styles.btnDanger, { borderColor: c.danger }]} onPress={cerrarSesion}>
          <Text style={[styles.btnText, { color: c.danger }]}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: c.textLight }]}>FacturAR v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 0.5 },
  topbarTitle: { fontSize: 16, fontWeight: '500' },
  topbarAction: { fontSize: 14, fontWeight: '500' },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 28, fontWeight: '500' },
  avatarName: { fontSize: 18, fontWeight: '500', marginBottom: 4 },
  avatarEmail: { fontSize: 14 },
  avatarCuit: { fontSize: 13, marginTop: 4 },
  card: { borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  cardTitle: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  label: { fontSize: 12, marginBottom: 4, marginTop: spacing.sm },
  input: { borderWidth: 0.5, borderRadius: radius.md, padding: spacing.md, fontSize: 14 },
  categGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  categBtn: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnDanger: { borderWidth: 0.5, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  btnText: { fontSize: 15, fontWeight: '500' },
  version: { fontSize: 12, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
});
