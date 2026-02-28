import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface UserApproval {
  id?: string
  email: string
  status: ApprovalStatus
  requestedAt?: Timestamp
  approvedAt?: Timestamp
  approvedBy?: string
  note?: string
}

const COL = 'user_approvals'

export async function getMyApproval(email: string): Promise<UserApproval | null> {
  const ref = doc(db, COL, email.toLowerCase())
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as any) } as UserApproval
}

export async function requestApproval(email: string) {
  const ref = doc(db, COL, email.toLowerCase())
  await setDoc(ref, {
    email: email.toLowerCase(),
    status: 'pending',
    requestedAt: Timestamp.now(),
  }, { merge: true })
}

export async function listPendingApprovals(): Promise<UserApproval[]> {
  const q = query(collection(db, COL), where('status', '==', 'pending'), orderBy('requestedAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as UserApproval[]
}

export async function setApproval(email: string, status: ApprovalStatus, adminEmail: string) {
  const ref = doc(db, COL, email.toLowerCase())
  await updateDoc(ref, {
    status,
    approvedAt: Timestamp.now(),
    approvedBy: adminEmail.toLowerCase(),
  })
}
