import { useState } from "react"
import useAuth from "./useAuth"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}

  if (!email.trim()) {
    errors.email = "Email is required"
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Please provide a valid email"
  }

  if (!password) {
    errors.password = "Password is required"
  }

  return errors
}

function useLoginForm() {
  const { login ,loading : isLoading} = useAuth();
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();


  const set = (key) => (value) => {
    setFields((f) => ({ ...f, [key]: value }))
    // Clear field error on change
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    const result = await login(fields)
    if (result) {
      toast.success("Logged in successfully")
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect") || "/";
      navigate(redirectUrl);
    } else {
      toast.error("Login failed. Please check your credentials.")
    }
  }

  return {
    email: fields.email,
    password: fields.password,
    errors,
    isLoading,
    onEmailChange: set("email"),
    onPasswordChange: set("password"),
    onSubmit: handleSubmit,
  }
}

export default useLoginForm
