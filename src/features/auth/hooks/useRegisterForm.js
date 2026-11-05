import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useAuth from "./useAuth"
import { authService } from "../services/auth.service"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ firstName, lastName, email, password }) {
  const errors = {}

  const first = firstName.trim()
  if (!first) {
    errors.firstName = "First name is required"
  } else if (first.length < 2 || first.length > 50) {
    errors.firstName = "First name must be between 2 and 50 characters"
  }

  if (lastName.trim().length > 50) {
    errors.lastName = "Last name cannot exceed 50 characters"
  }

  if (!email.trim()) {
    errors.email = "Email is required"
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Please provide a valid email"
  }

  if (!password) {
    errors.password = "Password is required"
  } else if (password.length < 8 || password.length > 128) {
    errors.password = "Password must be between 8 and 128 characters"
  }

  return errors
}

function useRegisterForm() {
  const navigate = useNavigate()
  const { register, loading: isLoading } = useAuth()
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [isSuccess, setIsSuccess] = useState(false)

  // Invitation state when user arrives via ?invite=<rawToken>
  const [inviteToken, setInviteToken] = useState(null)
  const [invitation, setInvitation] = useState(null)
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false)
  const [inviteError, setInviteError] = useState(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const rawToken = params.get("invite")
    if (!rawToken) return

    // Strip `?invite=` from the address bar immediately so the token never leaks in history/Referer
    params.delete("invite")
    const remainingQuery = params.toString()
    const cleanUrl = `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}${window.location.hash}`
    window.history.replaceState({}, document.title, cleanUrl)

    setInviteToken(rawToken)
    setIsVerifyingInvite(true)
    setInviteError(null)

    authService
      .verifyInvitation(rawToken)
      .then((inviteData) => {
        if (inviteData?.email) {
          setInvitation(inviteData)
          setFields((prev) => ({ ...prev, email: inviteData.email }))
        } else {
          setInviteToken(null)
          setInviteError("Invitation is invalid or has expired")
        }
      })
      .catch((err) => {
        setInviteToken(null)
        const msg = err.response?.data?.message || "Invitation is invalid or has expired"
        setInviteError(msg)
        toast.error(msg)
      })
      .finally(() => {
        setIsVerifyingInvite(false)
      })
  }, [])

  const set = (key) => (value) => {
    if (key === "email" && invitation?.email) {
      return // Lock email field when registering via a verified invitation
    }
    setFields((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    const payload = inviteToken
      ? { ...fields, email: invitation?.email || fields.email, inviteToken }
      : fields

    const result = await register(payload)
    if (result?.autoLoggedIn) {
      toast.success(`Welcome to ${invitation?.workspaceName || "the workspace"}!`)
      navigate("/home", { replace: true })
    } else if (result?.pendingApproval) {
      setIsSuccess(true)
      toast.success("Request submitted!", {
        description: result.message || "Your access request is pending admin approval.",
      })
    } else {
      toast.error("Registration failed. Please try again.")
    }
  }

  return {
    firstName: fields.firstName,
    lastName: fields.lastName,
    email: fields.email,
    password: fields.password,
    errors,
    isLoading: isLoading || isVerifyingInvite,
    isVerifyingInvite,
    invitation,
    inviteError,
    isInviteMode: Boolean(invitation && inviteToken),
    isSuccess,
    onFirstNameChange: set("firstName"),
    onLastNameChange: set("lastName"),
    onEmailChange: set("email"),
    onPasswordChange: set("password"),
    onSubmit: handleSubmit,
  }
}

export default useRegisterForm
