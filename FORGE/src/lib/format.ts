const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Catalogue prices are whole dollars; every one of them is a demo price. */
export function formatPrice(value: number): string {
  return usdFormatter.format(value)
}

export function formatUsdCompact(value: number): string {
  return `$${value.toLocaleString('en-US')}`
}

/** 2000 → "2 TB", 750 → "750 GB". */
export function formatCapacity(gigabytes: number): string {
  return gigabytes >= 1000
    ? `${(gigabytes / 1000).toFixed(gigabytes % 1000 === 0 ? 0 : 1)} TB`
    : `${gigabytes} GB`
}
