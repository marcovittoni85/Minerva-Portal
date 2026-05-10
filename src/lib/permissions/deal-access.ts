/** Permission helpers for deal access gating */

export function canSeePostL2Data(
  request: { l2_status: string; l2_admin_verified: boolean } | null | undefined
): boolean {
  if (!request) return false
  return request.l2_admin_verified === true &&
    (request.l2_status === 'approved' || request.l2_status === 'pending_originator')
}

export function canSeeL1Data(
  request: { l1_status: string } | null | undefined
): boolean {
  if (!request) return false
  return request.l1_status === 'approved'
}
