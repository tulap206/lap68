export const formatMoneyInput = (value: string): string => {
  const digits = value.replace(/\D/g, "")
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export const parseMoneyInput = (value: string): number => {
  return parseInt(value.replace(/\./g, ""), 10) || 0
}

export const displayMoney = (value: number): string => {
  return value.toLocaleString("vi-VN") + " đ"
}
