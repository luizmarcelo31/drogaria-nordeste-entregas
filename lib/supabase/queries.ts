import { createClient } from '@/lib/supabase/client'
import { onlyDigits } from '@/lib/formatters'

export type Rider = {
  id: string
  name: string
  cpf: string
  plate: string
  phone: string
  model: string | null
  color: string | null
  status: 'ativo' | 'bloqueado' | 'inativo'
  documentExpiration: string | null
}

export type AccessEvent = {
  id: string
  riderId: string
  type: 'entrada' | 'saida'
  status: 'registrado' | 'bloqueado'
  reason: string | null
  createdAt: string
  rider: Rider
}

export type Occurrence = {
  id: string
  riderId: string | null
  riderName: string
  plate: string | null
  type: string
  description: string
  level: 'advertencia' | 'grave' | 'bloqueio'
  status: 'aberta' | 'resolvida'
  createdAt: string
}

export type Alert = {
  id: string
  title: string
  description: string
  severity: 'advertencia' | 'grave' | 'bloqueio'
  status: 'aberta' | 'resolvida'
  createdAt: string
}

const riderFields = 'id,nome,cpf,placa,telefone,modelo,cor,status,documento_validade'

function mapRider(row: Record<string, unknown>): Rider {
  return {
    id: String(row.id),
    name: String(row.nome),
    cpf: String(row.cpf),
    plate: String(row.placa),
    phone: String(row.telefone),
    model: row.modelo as string | null,
    color: row.cor as string | null,
    status: row.status as Rider['status'],
    documentExpiration: row.documento_validade as string | null,
  }
}

export async function listRiders() {
  const { data, error } = await createClient().from('entregadores').select(riderFields).neq('status', 'inativo').order('nome')
  if (error) throw error
  return (data ?? []).map((row) => mapRider(row as Record<string, unknown>))
}

export async function findRider(identifier: string) {
  const value = identifier.trim()
  const digits = onlyDigits(value)
  const client = createClient()
  const normalizedPlate = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const query = digits.length === 11
    ? client.from('entregadores').select(riderFields).eq('cpf', digits).maybeSingle()
    : normalizedPlate.length === 7
      ? client.from('entregadores').select(riderFields).eq('placa', normalizedPlate).maybeSingle()
      : client.from('entregadores').select(riderFields).ilike('nome', `%${value}%`).limit(1).maybeSingle()
  const { data, error } = await query
  if (error) throw error
  return data ? mapRider(data as Record<string, unknown>) : null
}

export async function createRider(input: { name: string; cpf: string; plate: string; phone: string }) {
  const { data, error } = await createClient().from('entregadores').insert({
    nome: input.name.trim(),
    cpf: onlyDigits(input.cpf),
    placa: input.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
    telefone: input.phone.trim(),
  }).select(riderFields).single()
  if (error) throw error
  return mapRider(data as Record<string, unknown>)
}

export async function updateRiderStatus(id: string, status: Rider['status']) {
  const { error } = await createClient().from('entregadores').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deactivateRider(id: string) {
  return updateRiderStatus(id, 'inativo')
}

export async function listAccessEvents(limit = 500) {
  const { data, error } = await createClient().from('acessos').select(`id,entregador_id,tipo,status,motivo,created_at,entregadores (${riderFields})`).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return (data ?? []).flatMap((row) => {
    const rider = Array.isArray(row.entregadores) ? row.entregadores[0] : row.entregadores
    return rider ? [{ id: row.id, riderId: row.entregador_id, type: row.tipo, status: row.status, reason: row.motivo, createdAt: row.created_at, rider: mapRider(rider as Record<string, unknown>) } as AccessEvent] : []
  })
}

export async function registerAccess(rider: Rider, type: AccessEvent['type'], status: AccessEvent['status'] = 'registrado', reason?: string) {
  const { data: user } = await createClient().auth.getUser()
  const { data: access, error } = await createClient().from('acessos').insert({
    entregador_id: rider.id,
    tipo: type,
    status,
    motivo: reason ?? null,
    registrado_por: user.user?.id ?? null,
  }).select('id').single()
  if (error) throw error
  if (status === 'bloqueado') {
    const { error: alertError } = await createClient().from('alertas').insert({ acesso_id: access.id, titulo: 'Tentativa de acesso bloqueada', descricao: `${rider.name} · ${rider.plate}`, severidade: 'bloqueio' })
    if (alertError) throw alertError
  }
}

export async function listOccurrences() {
  const { data, error } = await createClient().from('ocorrencias').select('id,entregador_id,placa,tipo,descricao,nivel,status,created_at,entregadores (nome)').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => {
    const rider = Array.isArray(row.entregadores) ? row.entregadores[0] : row.entregadores
    return { id: row.id, riderId: row.entregador_id, riderName: rider?.nome ?? 'Sem entregador', plate: row.placa, type: row.tipo, description: row.descricao, level: row.nivel, status: row.status, createdAt: row.created_at } as Occurrence
  })
}

export async function createOccurrence(input: { rider: string; plate: string; type: string; description: string; level: Occurrence['level'] }) {
  const rider = input.plate ? await findRider(input.plate) : await findRider(input.rider)
  const { data: user } = await createClient().auth.getUser()
  const { data: occurrence, error } = await createClient().from('ocorrencias').insert({
    entregador_id: rider?.id ?? null,
    placa: rider?.plate ?? (input.plate ? input.plate.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : null),
    tipo: input.type,
    descricao: input.description,
    nivel: input.level,
    registrada_por: user.user?.id ?? null,
  }).select('id').single()
  if (error) throw error
  if (input.level === 'bloqueio') {
    const { error: alertError } = await createClient().from('alertas').insert({ ocorrencia_id: occurrence.id, titulo: 'Ocorrência com bloqueio', descricao: input.description, severidade: 'bloqueio' })
    if (alertError) throw alertError
  }
}

export async function listAlerts() {
  const { data, error } = await createClient().from('alertas').select('id,titulo,descricao,severidade,status,created_at').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({ id: row.id, title: row.titulo, description: row.descricao, severity: row.severidade, status: row.status, createdAt: row.created_at }) as Alert)
}

export async function resolveAlert(id: string) {
  const { data: user } = await createClient().auth.getUser()
  const { error } = await createClient().from('alertas').update({ status: 'resolvida', resolvido_at: new Date().toISOString(), resolvido_por: user.user?.id ?? null }).eq('id', id)
  if (error) throw error
}
