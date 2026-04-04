import api from '../api';

export interface AdminKPIs {
  active_policies: number;
  total_premium: number;
  total_claims_paid: number;
  system_loss_ratio: number;
}

export interface HexZone {
  city: string;
  h3_index: string;
  dci_score: number;
  status: string;
}

export interface RiskForecast {
  city: string;
  risk: number;
}

export interface FraudQueueItem {
  claim_id: string;
  created_at: string;
  worker_name: string;
  city: string;
  status: string;
  resolution_path: string;
  fraud_score: number;
  flags: string[];
}

export async function fetchKPIs(): Promise<AdminKPIs> {
  const { data } = await api.get<AdminKPIs>('/admin/dashboard/kpis');
  return data;
}

export async function fetchLiveZones(): Promise<HexZone[]> {
  const { data } = await api.get<HexZone[]>('/admin/dashboard/zones');
  return data;
}

export async function fetchRiskForecast(): Promise<RiskForecast[]> {
  const { data } = await api.get<RiskForecast[]>('/admin/dashboard/risk-forecast');
  return data;
}

export async function fetchFraudQueue(): Promise<FraudQueueItem[]> {
  const { data } = await api.get<FraudQueueItem[]>('/admin/dashboard/fraud-queue');
  return data;
}
