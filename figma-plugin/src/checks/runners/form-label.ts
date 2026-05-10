// 3.3.2 Labels or Instructions. Pure DTO consumer.

import type { AuditDTO, FormInputElement } from '../../shared/dtos'
import type { Finding } from '../findings.ts'

export function runFormLabelCheck(dto: AuditDTO): Finding[] {
  return dto.formInputs.map(auditFormInput)
}

function auditFormInput(input: FormInputElement): Finding {
  // A visible label is anything that proves the user can see what to fill in:
  //   1. External sibling label outside the form-input wrapper
  //   2. A text outside the entry zone but inside the wrapper (geometric
  //      signal — works regardless of layer naming)
  //   3. A text whose name or ancestor frame name suggests a label
  //      (fallback for ghost-styled inputs without a drawn entry zone)
  // Any of these → pass. Only a placeholder sitting alone in the entry zone
  // is the flag-worthy case.
  if (input.hasExternalLabel) return passFinding(input)

  const hasOutsideEntryZoneText = input.childTextNodes.some(t => !t.isInsideInput)
  if (hasOutsideEntryZoneText) return passFinding(input)

  const hasNestedLabel = input.childTextNodes.some(t => t.isLabel)
  if (hasNestedLabel) return passFinding(input)

  if (input.childTextNodes.length === 0) {
    return {
      criterion: '3.3.2',
      status: 'flag',
      scope: 'element',
      nodeId: input.id,
      nodeName: input.name,
      message: 'No label or placeholder.',
    }
  }

  return {
    criterion: '3.3.2',
    status: 'flag',
    scope: 'element',
    nodeId: input.id,
    nodeName: input.name,
    message: 'Placeholder only — no visible label.',
  }
}

function passFinding(input: FormInputElement): Finding {
  return {
    criterion: '3.3.2',
    status: 'pass',
    scope: 'element',
    nodeId: input.id,
    nodeName: input.name,
    message: '3.3.2 — visible label present.',
  }
}
