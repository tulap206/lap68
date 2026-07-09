import {
  fetchBusinesses,
  fetchCategories,
  insertBusiness,
  insertCategory,
  insertTransaction,
  insertSchedule,
  insertCounterparty,
} from "./supabase"
import type { ExportUserData } from "./types"

export async function importUserDataFromBackup(userId: string, data: ExportUserData) {
  const existingBiz = await fetchBusinesses(userId)
  const bizMap = new Map<string, string>()
  for (const b of existingBiz) {
    if (b.code) bizMap.set(b.code, b.id)
    bizMap.set(b.name, b.id)
    bizMap.set(b.id, b.id)
  }

  if (Array.isArray(data.businesses)) {
    for (const b of data.businesses) {
      const key = b.code || b.name
      if (!bizMap.has(key) && !bizMap.has(b.id)) {
        const created = await insertBusiness({
          user_id: userId,
          name: b.name,
          code: b.code || null,
          color: b.color || "#059669",
          icon: b.icon || "briefcase",
          description: b.description || null,
          status: b.status || "active",
          sort_order: b.sort_order || 0,
          ghi_chu: b.ghi_chu || {},
        })
        bizMap.set(key, created.id)
        if (b.name) bizMap.set(b.name, created.id)
        bizMap.set(created.id, created.id)
      }
    }
  }

  const defaultBizId = existingBiz[0]?.id || bizMap.values().next().value
  const existingCats = await fetchCategories(userId)
  const catMap = new Map<string, string>()
  for (const c of existingCats) catMap.set(`${c.business_id}:${c.name}`, c.id)

  if (Array.isArray(data.categories)) {
    for (const c of data.categories) {
      const businessId =
        (c.business_id && bizMap.get(c.business_id)) || c.business_id || defaultBizId
      const mapKey = `${businessId}:${c.name}`
      if (!catMap.has(mapKey)) {
        const created = await insertCategory({
          user_id: userId,
          business_id: businessId || null,
          name: c.name,
          type: c.type,
          color: c.color || "#059669",
          icon: c.icon || "wallet",
        })
        catMap.set(mapKey, created.id)
      }
    }
  }

  if (Array.isArray(data.counterparties)) {
    for (const cp of data.counterparties) {
      const businessId = (cp.business_id && bizMap.get(cp.business_id)) || cp.business_id || defaultBizId
      await insertCounterparty({
        user_id: userId,
        business_id: businessId || null,
        name: cp.name,
        phone: cp.phone || null,
        email: cp.email || null,
        role: cp.role || "customer",
        ghi_chu: cp.ghi_chu || {},
      })
    }
  }

  let txCount = 0
  if (Array.isArray(data.transactions)) {
    for (const t of data.transactions) {
      const businessId = (t.business_id && bizMap.get(t.business_id)) || t.business_id || defaultBizId
      const catName = t.category?.name
      const catKey = catName ? `${businessId}:${catName}` : null
      await insertTransaction({
        user_id: userId,
        business_id: businessId || null,
        type: t.type,
        amount: t.amount,
        category_id: catKey ? catMap.get(catKey) || null : t.category_id || null,
        counterparty_id: null,
        schedule_id: null,
        description: t.description,
        transaction_date: t.transaction_date,
        payment_method: t.payment_method || "cash",
        ghi_chu: t.ghi_chu || {},
      })
      txCount++
    }
  }

  let schCount = 0
  if (Array.isArray(data.schedules)) {
    for (const s of data.schedules) {
      const businessId = (s.business_id && bizMap.get(s.business_id)) || s.business_id || defaultBizId
      if (!businessId) continue
      await insertSchedule({
        user_id: userId,
        business_id: businessId,
        direction: s.direction,
        title: s.title,
        description: s.description || null,
        amount: s.amount,
        amount_is_estimate: s.amount_is_estimate || false,
        schedule_kind: s.schedule_kind || "once",
        due_date: s.due_date,
        next_due_date: s.next_due_date || s.due_date,
        recurrence: s.recurrence || {},
        reminder_days: s.reminder_days || [3, 1, 0],
        category_id: s.category_id || null,
        counterparty_id: null,
        status: s.status || "pending",
        linked_transaction_id: null,
        completed_at: null,
        ghi_chu: s.ghi_chu || {},
      })
      schCount++
    }
  }

  return { txCount, schCount }
}
