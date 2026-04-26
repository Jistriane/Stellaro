import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Users, Vote, CheckCircle2, Clock } from 'lucide-react-native';

export default function DAO() {
  const proposals = [
    { title: 'Adicionar RWA Imobiliário SP', status: 'Ativa', votes: '1.2M STLT', timeLeft: '2 dias' },
    { title: 'Aumentar LTV para Empréstimos XLM', status: 'Votação', votes: '850K STLT', timeLeft: '12 horas' },
    { title: 'Reduzir taxas de bridge para Ethereum', status: 'Aprovada', votes: '3.1M STLT', timeLeft: 'Finalizado' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Governança DAO</Text>
        <Text style={styles.subtitle}>Vote e decida o futuro do protocolo</Text>

        <View style={styles.governanceStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Seu Poder de Voto</Text>
            <Text style={styles.statValue}>12.500 STLT</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Propostas Ativas</Text>

        {proposals.map((prop, index) => (
          <TouchableOpacity key={index} style={styles.proposalCard}>
            <View style={styles.proposalHeader}>
              <View style={[styles.statusBadge, { backgroundColor: prop.timeLeft === 'Finalizado' ? '#334155' : '#1e40af' }]}>
                <Text style={styles.statusText}>{prop.status}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Clock size={14} color="#94a3b8" />
                <Text style={styles.timeText}>{prop.timeLeft}</Text>
              </View>
            </View>
            
            <Text style={styles.proposalTitle}>{prop.title}</Text>
            
            <View style={styles.votesRow}>
              <View style={styles.votesInfo}>
                <Vote size={16} color="#94a3b8" />
                <Text style={styles.votesText}>{prop.votes} votaram</Text>
              </View>
              <TouchableOpacity style={styles.voteButton}>
                <Text style={styles.voteButtonText}>Votar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4, marginBottom: 30 },
  governanceStats: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 30, borderLeftWidth: 4, borderLeftColor: '#10b981' },
  statLabel: { color: '#94a3b8', fontSize: 12 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  proposalCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 16 },
  proposalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeText: { color: '#94a3b8', fontSize: 12, marginLeft: 4 },
  proposalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  votesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  votesInfo: { flexDirection: 'row', alignItems: 'center' },
  votesText: { color: '#94a3b8', fontSize: 12, marginLeft: 6 },
  voteButton: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  voteButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
