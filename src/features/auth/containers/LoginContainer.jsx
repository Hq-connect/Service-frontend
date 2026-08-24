import LoginPage from "../pages/LoginPage"
import useLoginForm from "../hooks/useLoginForm"

function LoginContainer() {
  const form = useLoginForm()
  return <LoginPage {...form} />
}

export default LoginContainer
