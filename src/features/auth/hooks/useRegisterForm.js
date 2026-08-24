import { useState } from "react"
import { toast } from "sonner"
import useAuth from "./useAuth"

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
  const { register, loading: isLoading } = useAuth()
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [isSuccess, setIsSuccess] = useState(false)

  const set = (key) => (value) => {
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
    const result = await register(fields)
    if (result) {
      setIsSuccess(true)
      toast.success("Request submitted!", {
        description: "Your access request is pending admin approval.",
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
    isLoading,
    isSuccess,
    onFirstNameChange: set("firstName"),
    onLastNameChange: set("lastName"),
    onEmailChange: set("email"),
    onPasswordChange: set("password"),
    onSubmit: handleSubmit,
  }
}

export default useRegisterForm
