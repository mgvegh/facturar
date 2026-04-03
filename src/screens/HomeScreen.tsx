import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { spacing, radius, palette } from '../theme';
import { CATEGORIAS_MONOTRIBUTO } from '../data';
import { supabase } from '../supabase';

export default function HomeScreen({ navigation }: any) {
  const { c, isDark, toggle } = useTheme();
  const [perfil, setPerfil] = useState<any>(null);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    cargarDatos();
  }, []));

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [perfilRes, facturasRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('facturas').select('*').eq('user_id', user.id).order('numero', { ascending: false }),
      ]);
      if (perfilRes.data) setPerfil(perfilRes.data);
      if (facturasRes.data) setFacturas(facturasRes.data);
    }
    setLoading(false);
  };

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const facturadoMes = facturas
    .filter(f => {
      const d = new Date(f.fecha_emision + 'T00:00:00');
      return d.getMonth() === mesActual && d.getFullYear() === anioActual && f.monto > 0;
    })
    .reduce((sum, f) => sum + f.monto, 0);

  const cantMes = facturas.filter(f => {
    const d = new Date(f.fecha_emision + 'T00:00:00');
    return d.getMonth() === mesActual && d.getFullYear() === anioActual;
  }).length;

  const facturadoAnio = facturas
    .filter(f => new Date(f.fecha_emision + 'T00:00:00').getFullYear() === anioActual && f.monto > 0)
    .reduce((sum, f) => sum + f.monto, 0);

  const cantAnio = facturas.filter(f => new Date(f.fecha_emision + 'T00:00:00').getFullYear() === anioActual).length;

  const categoria = perfil?.categoria_monotributo || 'D';
  const limite = CATEGORIAS_MONOTRIBUTO[categoria] || CATEGORIAS_MONOTRIBUTO['D'];
  const porcentaje = Math.min(Math.round((facturadoAnio / limite) * 100), 100);
  const nombreMostrar = perfil?.nombre || 'Usuario';
  const cuit = perfil?.cuit || '—';
  const recientes = facturas.slice(0, 3);

  // Alerta de límite
  const alertaLimite = porcentaje >= 80 && porcentaje < 100;
  const limiteAlcanzado = porcentaje >= 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: c.headerBg }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.greeting, { color: c.headerText }]}>Hola, {nombreMostrar} 👋</Text>
              <Text style={[styles.cuit, { color: c.headerMuted }]}>CUIT: {cuit}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={toggle} style={styles.themeToggle}>
                <Text style={{ fontSize: 18 }}>{isDark ? '🌙' : '☀️'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.avatarBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)' }]}
                onPress={() => navigation.navigate('Perfil')}
              >
                <Text style={[styles.avatarBtnText, { color: c.headerText }]}>
                  {`${perfil?.nombre?.[0] || ''}${perfil?.apellido?.[0] || ''}`.toUpperCase() || '👤'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(36,44,79,0.3)' : 'rgba(255,255,255,0.2)' }]}>
            <View style={styles.dotGreen} />
            <Text style={[styles.badgeText, { color: c.headerText }]}>ARCA conectado · Categoría {categoria}</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg }}>

          {/* Alerta límite */}
          {(alertaLimite || limiteAlcanzado) && (
            <View style={[styles.alertaCard, { backgroundColor: limiteAlcanzado ? c.dangerLight : c.warningLight, borderColor: limiteAlcanzado ? c.danger : c.warning }]}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: limiteAlcanzado ? c.dangerText : c.warningText }}>
                {limiteAlcanzado ? '⛔ Límite de categoría alcanzado' : `⚠️ Llegaste al ${porcentaje}% de tu límite anual`}
              </Text>
              <Text style={{ fontSize: 12, color: limiteAlcanzado ? c.dangerText : c.warningText, marginTop: 4 }}>
                {limiteAlcanzado ? 'Debés recategorizarte antes de seguir facturando' : `Te quedan $${(limite - facturadoAnio).toLocaleString('es-AR')} antes de tener que recategorizarte`}
              </Text>
            </View>
          )}

          {/* Métricas */}
          <View style={styles.metricGrid}>
            <TouchableOpacity
              style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => navigation.navigate('Historial')}
            >
              <Text style={[styles.metricLabel, { color: c.textMuted }]}>Este mes</Text>
              <Text style={[styles.metricValue, { color: c.text }]}>${facturadoMes.toLocaleString('es-AR')}</Text>
              <Text style={[styles.metricSub, { color: c.textMuted }]}>{cantMes} facturas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => navigation.navigate('Historial')}
            >
              <Text style={[styles.metricLabel, { color: c.textMuted }]}>Este año</Text>
              <Text style={[styles.metricValue, { color: c.text }]}>${facturadoAnio.toLocaleString('es-AR')}</Text>
              <Text style={[styles.metricSub, { color: c.textMuted }]}>{cantAnio} facturas</Text>
            </TouchableOpacity>
          </View>

          {/* Barra límite */}
          <View style={[styles.progressCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: c.text }]}>Límite anual categoría {categoria}</Text>
              <Text style={[styles.progressPct, { color: porcentaje >= 80 ? c.warning : c.textMuted }]}>{porcentaje}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: c.cardAlt }]}>
              <View style={[styles.progressFill, { width: `${porcentaje}%` as any, backgroundColor: porcentaje >= 80 ? c.warning : c.primary }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressSub, { color: c.textMuted }]}>${facturadoAnio.toLocaleString('es-AR')} facturado</Text>
              <Text style={[styles.progressSub, { color: c.textMuted }]}>Quedan ${(limite - facturadoAnio).toLocaleString('es-AR')}</Text>
            </View>
          </View>

          {/* Últimas facturas */}
          <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Últimas facturas</Text>

          {recientes.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={{ fontSize: 14, color: c.textMuted, textAlign: 'center' }}>
                Todavía no emitiste ninguna factura.{'\n'}Tocá el botón + para comenzar.
              </Text>
            </View>
          ) : (
            recientes.map(f => (
              <TouchableOpacity
                key={f.id}
                style={[styles.invoiceRow, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => navigation.navigate('DetalleFactura', { factura: f })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invoiceClient, { color: c.text }]}>{f.cliente_nombre}</Text>
                  <Text style={[styles.invoiceNum, { color: c.textMuted }]}>
                    FC C-{String(perfil?.punto_venta || 2).padStart(4,'0')}-{String(f.numero).padStart(8,'0')} · {new Date(f.fecha_emision + 'T00:00:00').toLocaleDateString('es-AR')}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.invoiceAmount, { color: c.text }]}>${f.monto.toLocaleString('es-AR')}</Text>
                  <View style={[styles.badge2, { backgroundColor: c.successLight }]}>
                    <Text style={[styles.badge2Text, { color: c.successText }]}>Emitida</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: c.primary }]} onPress={() => navigation.navigate('Nueva')}>
        <Text style={[styles.fabText, { color: isDark ? palette.navy : palette.white }]}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg, paddingTop: spacing.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 18, fontWeight: '500' },
  cuit: { fontSize: 13, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeToggle: { padding: 4 },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarBtnText: { fontSize: 15, fontWeight: '600' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: spacing.sm, alignSelf: 'flex-start' },
  dotGreen: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#7ee67e' },
  badgeText: { fontSize: 12 },
  alertaCard: { borderRadius: radius.md, borderWidth: 0.5, padding: spacing.md, marginBottom: spacing.md },
  metricGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  metricCard: { flex: 1, borderRadius: radius.md, borderWidth: 0.5, padding: spacing.md },
  metricLabel: { fontSize: 11 },
  metricValue: { fontSize: 18, fontWeight: '500', marginTop: 4 },
  metricSub: { fontSize: 11, marginTop: 2 },
  progressCard: { borderRadius: radius.md, borderWidth: 0.5, padding: spacing.md, marginBottom: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressTitle: { fontSize: 13, fontWeight: '500' },
  progressPct: { fontSize: 13 },
  progressBg: { borderRadius: 4, height: 8, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressSub: { fontSize: 11 },
  sectionTitle: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm },
  emptyCard: { borderRadius: radius.md, borderWidth: 0.5, padding: spacing.xl, alignItems: 'center' },
  invoiceRow: { borderRadius: radius.md, borderWidth: 0.5, padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  invoiceClient: { fontSize: 14, fontWeight: '500' },
  invoiceNum: { fontSize: 12, marginTop: 2 },
  invoiceAmount: { fontSize: 15, fontWeight: '500' },
  badge2: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full, marginTop: 4 },
  badge2Text: { fontSize: 11, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 80, right: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { fontSize: 28, lineHeight: 32 },
});
