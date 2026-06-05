// Call this after any blob response from the API
export const triggerPDFDownload = (blobResponse, filename) => {
  const url  = window.URL.createObjectURL(new Blob([blobResponse.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}