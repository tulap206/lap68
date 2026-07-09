import { redirect } from "next/navigation"

export default async function CounterpartiesRedirect({
  params,
}: {
  params: Promise<{ businessId: string }>
}) {
  const { businessId } = await params
  redirect(`/dashboard/b/${businessId}`)
}
