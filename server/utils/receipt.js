// Generates a unique receipt number like RCP-20241120-0042
const generateReceiptNo = () => {
  const date   = new Date()
  const ymd    = date.toISOString().slice(0,10).replace(/-/g,'')
  const random = String(Math.floor(Math.random() * 9000) + 1000)
  return `RCP-${ymd}-${random}`
}

module.exports = { generateReceiptNo }