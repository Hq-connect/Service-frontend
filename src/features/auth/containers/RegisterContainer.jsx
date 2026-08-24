import RegisterPage from "../pages/RegisterPage"
import useRegisterForm from "../hooks/useRegisterForm"

function RegisterContainer() {
  const form = useRegisterForm()
  return <RegisterPage {...form} />
}

export default RegisterContainer
