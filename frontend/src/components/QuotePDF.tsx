import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Quote, QuoteTeamMember } from '../types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2 solid #FF6200', paddingBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FF6200' },
  subtitle: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#111827', borderBottom: '1 solid #D1D5DB', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { color: '#6B7280' },
  value: { fontWeight: 'bold' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 6, borderBottom: '1 solid #D1D5DB' },
  tableRow: { flexDirection: 'row', padding: 6, borderBottom: '1 solid #F3F4F6' },
  col1: { width: '35%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  bold: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#6B7280', borderTop: '1 solid #D1D5DB', paddingTop: 8 },
  badge: { backgroundColor: '#FFF0E5', color: '#E55800', padding: '3 8', borderRadius: 4, fontSize: 9 },
  bigPrice: { fontSize: 18, fontWeight: 'bold', color: '#FF6200', marginTop: 4 },
  policies: { fontSize: 8, color: '#6B7280', marginTop: 10, lineHeight: 1.4 },
});

function formatUSD(v: number) { return `$${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` }
function formatCOP(v: number) { return `$${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` }
function formatPct(v: number) { return `${(v * 100).toFixed(1)}%` }

interface Props { quote: Quote }

export default function QuotePDF({ quote }: Props) {
  const members = quote.teamMembers || [];
  const totalHours = members.reduce((s: number, m: QuoteTeamMember) => s + m.hours, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Imagine Apps</Text>
          <Text style={styles.subtitle}>Propuesta Comercial</Text>
          <View style={{ ...styles.row, marginTop: 10 }}>
            <Text>Código: {quote.code}</Text>
            <Text>Fecha: {new Date(quote.createdAt).toLocaleDateString('es-CO')}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Text style={styles.bold}>{quote.client?.name}</Text>
          <Text>{quote.client?.company}</Text>
          {quote.client?.email && <Text>{quote.client.email}</Text>}
        </View>

        {/* Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Proyecto</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Línea de Negocio</Text>
            <Text style={styles.value}>{quote.businessLine?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duración</Text>
            <Text style={styles.value}>{quote.durationMonths} mes(es)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>TRM</Text>
            <Text style={styles.value}>{formatCOP(quote.trmRate)}</Text>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipo del Proyecto</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.col1, ...styles.bold }}>Rol</Text>
              <Text style={{ ...styles.col2, ...styles.bold }}>Dedicación</Text>
              <Text style={{ ...styles.col3, ...styles.bold }}>Horas</Text>
              <Text style={{ ...styles.col4, ...styles.bold }}>USD/Hora</Text>
              <Text style={{ ...styles.col5, ...styles.bold }}>Total USD</Text>
            </View>
            {members.map((m: QuoteTeamMember, i: number) => {
              const memberHourlyRate = totalHours > 0
                ? (quote.grossMarginPriceUsd || 0) * (m.hours / totalHours) / m.hours
                : 0;
              const memberTotal = totalHours > 0
                ? (quote.grossMarginPriceUsd || 0) * (m.hours / totalHours)
                : 0;
              return (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.col1}>{m.roleName}</Text>
                  <Text style={styles.col2}>{formatPct(m.dedication)}</Text>
                  <Text style={styles.col3}>{m.hours.toFixed(0)}</Text>
                  <Text style={styles.col4}>{formatUSD(memberHourlyRate)}</Text>
                  <Text style={styles.col5}>{formatUSD(memberTotal)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inversión</Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Precio Total (USD)</Text>
              <Text style={styles.bigPrice}>{formatUSD(quote.grossMarginPriceUsd || 0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Precio Mensual (USD)</Text>
              <Text style={{ ...styles.bigPrice, fontSize: 14 }}>
                {formatUSD((quote.grossMarginPriceUsd || 0) / (quote.durationMonths || 1))}
              </Text>
            </View>
          </View>
          <View style={{ ...styles.row, marginTop: 8 }}>
            <Text style={styles.label}>Precio Total (COP)</Text>
            <Text>{formatCOP(quote.grossMarginPriceCop || 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>USD / Hora</Text>
            <Text>{formatUSD(quote.grossMarginHourlyUsd || 0)}</Text>
          </View>
        </View>

        {/* Server policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Política de Servidores</Text>
          <Text style={styles.policies}>
            - Si el despliegue es en servidor Imagine: Despliegue sin costo pero mensualidad entre 25 - 50 USD por plataforma (App o Web).{'\n'}
            - Precio promedio, sujeto al consumo real.{'\n'}
            - Si se despliega en servidor del cliente: el pricing debe contemplar un 12.5% de DevOps.{'\n'}
            - Migración entre servidores: 3 días hábiles, costo aprox. 1,500 USD.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Imagine Apps | Propuesta válida por 30 días | {quote.code}</Text>
        </View>
      </Page>
    </Document>
  );
}
