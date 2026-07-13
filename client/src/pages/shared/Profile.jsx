import { useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyProfile, updateMyProfile,
  changeMyPassword, uploadMyPhoto,
} from '../../api/auth.api'
import { updateUser } from '../../features/auth/authSlice'
import DashboardLayout from '../../components/DashboardLayout'

const Icon = ({ d, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"
    className={className} style={{ flexShrink: 0 }}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
)

const ICONS = {
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  lock: ['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'],
  briefcase: ['M20 7h-7V3a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z', 'M8 7V4h4v3'],
  classes: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  child: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  rupee: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
  check: ['M20 6 9 17l-5-5'],
}

const ROLE_LABELS = {
  admin: 'Super Admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
}

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100   text-blue-700',
  student: 'bg-green-100  text-green-700',
  parent: 'bg-orange-100 text-orange-700',
}

function PasswordSection() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: changeMyPassword,
    onSuccess: () => {
      setDone(true)
      setForm({ current_password: '', new_password: '', confirm: '' })
      setTimeout(() => { setDone(false); setOpen(false) }, 1500)
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to change password.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.new_password !== form.confirm) {
      setError('New password and confirmation do not match.')
      return
    }
    mutation.mutate({
      current_password: form.current_password,
      new_password: form.new_password,
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100"
      >
        <div className="flex items-center gap-2">
          <Icon d={ICONS.lock} size={15} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Change Password</p>
        </div>
        <span className="text-xs text-gray-400">{open ? 'Hide' : 'Edit'}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>
          )}
          {done && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 p-2 rounded-lg flex items-center gap-2">
              <Icon d={ICONS.check} size={14} /> Password updated successfully.
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={form.current_password}
              onChange={e => setForm({ ...form, current_password: e.target.value })}
              required
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={form.new_password}
                onChange={e => setForm({ ...form, new_password: e.target.value })}
                required
                minLength={6}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                required
                minLength={6}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  )
}

function RoleDetailsCard({ role, profile }) {
  if (role === 'teacher') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <Icon d={ICONS.briefcase} size={15} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Employment Details</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Qualification</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{profile?.qualification || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Joining Date</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString('en-IN') : '—'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mb-1.5">Classes Teaching</p>
            {profile?.classes?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.classes.map(c => (
                  <span key={c.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                    {c.name} — {c.section}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No classes assigned yet.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (role === 'student') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <Icon d={ICONS.classes} size={15} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Academic & Guardian Details</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[
            { label: 'Class', value: profile?.class_name ? `${profile.class_name} — ${profile.section}` : '—' },
            { label: 'Roll No', value: profile?.roll_no || '—' },
            { label: 'Date of Birth', value: profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : '—' },
            { label: 'Gender', value: profile?.gender || '—' },
            { label: 'Admission Date', value: profile?.admission_date ? new Date(profile.admission_date).toLocaleDateString('en-IN') : '—' },
            { label: 'Guardian Name', value: profile?.guardian_name || '—' },
            { label: 'Guardian Phone', value: profile?.guardian_phone || '—' },
            { label: 'Guardian Email', value: profile?.guardian_email || '—' },
          ].map(f => (
            <div key={f.label}>
              <p className="text-xs text-gray-500">{f.label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
        <p className="px-5 pb-4 text-xs text-gray-400">
          Academic and guardian details are managed by the school office. Contact admin to update these.
        </p>
      </div>
    )
  }

  if (role === 'parent') {
    const child = profile?.child
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <Icon d={ICONS.child} size={15} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Linked Child</p>
        </div>
        <div className="p-5">
          {child ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                {child.student_name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{child.student_name}</p>
                <p className="text-xs text-gray-400">{child.class_name} — {child.section}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No child record linked to your account yet. Contact the school office to link your child's profile.
            </p>
          )}
        </div>
      </div>
    )
  }

  // admin
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon d={ICONS.user} size={15} className="text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">Account Type</p>
      </div>
      <p className="text-xs text-gray-500">
        You have full administrative access to all modules of the School Management System.
      </p>
    </div>
  )
}

export default function Profile() {
  const dispatch = useDispatch()
  const qc = useQueryClient()
  const { user } = useSelector(state => state.auth)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ name: '', phone: '' })
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: fetchMyProfile,
    onSuccess: (data) => {
      if (!editing) setForm({ name: data.name || '', phone: data.phone || '' })
    },
  })

  const saveMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (data) => {
      dispatch(updateUser({ name: data.name, phone: data.phone }))
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to update profile.'),
  })

  const photoMutation = useMutation({
    mutationFn: uploadMyPhoto,
    onSuccess: (data) => {
      dispatch(updateUser({ photo_url: data.photo_url }))
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) photoMutation.mutate(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    saveMutation.mutate(form)
  }

  const handleCancel = () => {
    setForm({ name: data?.name || '', phone: data?.phone || '' })
    setEditing(false)
    setError('')
  }

  if (isLoading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">Loading profile…</p>
        </div>
      </DashboardLayout>
    )
  }

  const photoUrl = data?.photo_url

  return (
    <DashboardLayout title="My Profile">
      <div className="p-6 max-w-3xl space-y-5">

        {/* Header card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-5">

            {/* Avatar + upload */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={data?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {data?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photoMutation.isPending}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white border border-gray-200
                           rounded-full flex items-center justify-center shadow-sm
                           hover:bg-gray-50 disabled:opacity-50"
                title="Change photo"
              >
                <Icon d={ICONS.camera} size={13} className="text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold text-gray-800">{data?.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[data?.role]}`}>
                  {ROLE_LABELS[data?.role] || data?.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{data?.email}</p>
              {photoMutation.isPending && (
                <p className="text-xs text-blue-500 mt-1">Uploading photo…</p>
              )}
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 shrink-0"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Edit form / read-only info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {error && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{error}</p>
          )}
          {saved && (
            <p className="mb-3 text-sm text-green-600 bg-green-50 border border-green-200 p-2 rounded-lg flex items-center gap-2">
              <Icon d={ICONS.check} size={14} /> Profile updated successfully.
            </p>
          )}

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  value={data?.email}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">Contact admin to change your email address.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{data?.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {data?.created_at ? new Date(data.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' }) : '—'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Role-specific details */}
        <RoleDetailsCard role={data?.role} profile={data?.profile} />

        {/* Password */}
        <PasswordSection />

      </div>
    </DashboardLayout>
  )
}