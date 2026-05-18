import { useEffect, useRef, useState } from "react"
import Loading from "../components/Loading"
import { Lock, Camera, User } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModel from "../components/ChangePasswordModel"
import { useAuth } from "../context/authContext"
import api from "../api/axios"
import toast from "react-hot-toast"

const AvatarUpload = ({ currentAvatar, onUploadSuccess }) => {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentAvatar || null)

  // Keep preview in sync if parent refreshes avatar
  useEffect(() => {
    setPreview(currentAvatar || null)
  }, [currentAvatar])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Client-side validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB")
      return
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Upload to backend → Cloudinary
    const formData = new FormData()
    formData.append("avatar", file)

    setUploading(true)
    try {
      const res = await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      toast.success("Profile photo updated!")
      onUploadSuccess(res.data.avatarUrl) // pass new URL up so profile refreshes
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
      setPreview(currentAvatar || null) // revert on error
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected
      e.target.value = ""
    }
  }

  return (
    <div className="card max-w-md p-6 mb-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Profile Photo
      </h2>
      <div className="flex items-center gap-5">
        {/* Avatar circle */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center ring-2 ring-slate-600">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>

          {/* Overlay button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
            className="absolute inset-0 rounded-full flex items-center justify-center
                       bg-black/50 opacity-0 hover:opacity-100 transition-opacity
                       disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Text + trigger */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-100 mb-0.5">Upload a new photo</p>
          <p className="text-sm text-slate-500 mb-3">JPG, PNG or WebP · Max 5 MB</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading…" : "Choose photo"}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const Settings = () => {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModel, setShowPasswordModel] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile")
      if (res.data) setProfile(res.data)
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  // Called by AvatarUpload after a successful upload so the profile card
  // can show the new avatar without a full refetch.
  const handleAvatarUpdate = (newAvatarUrl) => {
    setProfile((prev) => (prev ? { ...prev, avatar: newAvatarUrl } : prev))
  }

  if (loading) return <Loading />

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="text-3xl text-slate-100">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {/* Avatar upload */}
      <AvatarUpload
        currentAvatar={profile?.avatar}
        onUploadSuccess={handleAvatarUpdate}
      />

      {/* Profile details form */}
      {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile} />}

      {/* Change password */}
      <div className="card max-w-md p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 rounded-lg">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-100">Password</p>
            <p className="text-sm text-slate-500">Update your account password</p>
          </div>
        </div>
        <button
          onClick={() => setShowPasswordModel(true)}
          className="btn-secondary text-sm"
        >
          Change
        </button>
      </div>

      <ChangePasswordModel
        open={showPasswordModel}
        onClose={() => setShowPasswordModel(false)}
      />
    </div>
  )
}

export default Settings