import React, { useState } from 'react'

const mockVerifyFSSAI = (license) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(license === 'VALIDFSSAI123')
    }, 1000)
  })
}

const LicenseVerification = ({ onVerify }) => {
  const [license, setLicense] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    const isValid = await mockVerifyFSSAI(license)
    setStatus(isValid ? 'valid' : 'invalid')
    setLoading(false)
    if (isValid && onVerify) onVerify(license)
  }

  return (
    <div className="card space-y-4">
      <label className="block font-semibold">FSSAI License Number</label>
      <input
        type="text"
        value={license}
        onChange={e => setLicense(e.target.value)}
        className="input-field"
        placeholder="Enter FSSAI License Number"
      />
      <button className="btn-primary" onClick={handleVerify} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      {status === 'valid' && <div className="text-green-600">License is valid ✅</div>}
      {status === 'invalid' && <div className="text-red-600">Invalid license ❌</div>}
    </div>
  )
}

export default LicenseVerification 