import { render } from 'preact'
import './index.css'
import { Input } from './components/ui/input.tsx'
import { Button } from './components/ui/button.tsx'
import { useEffect, useState } from 'react'
import { cn } from './lib/utils.ts'

render(<Login />, document.getElementById('app')!)

function Login() {
  const { sendPassword, loading, isSuccess, error, clearError } = useLoginFlow();
  const [password, setPassword] = useState("");
  useEffect(() => {
    clearError();
  }, [password])
  return (
    <div className="flex h-dvh flex-col w-screen overflow-auto p-4 gap-4 justify-center items-center">
      <div className="flex flex-col gap-4">
        <Input placeholder="Collection password" value={password} onChange={e => setPassword((e.target as HTMLInputElement).value)} />
        <Button disabled={loading || isSuccess} onClick={() => sendPassword(password)}>
          {isSuccess ? 'Success!' : 'Login'}
        </Button>
        <span className={cn("text-red-600 text-xs text-center h-5")}>{error ?? " "}</span>
      </div>
    </div>
  )
}

function useLoginFlow() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const sendPassword = async (password: string) => {
    setError(null);
    setLoading(true);
    const res = await fetch('http://localhost:3002/login', {
      method: 'POST',
      body: JSON.stringify({
        password
      })
    })
    setLoading(false)
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1000)
    } else {
      setError("Wrong password");
    }
  };
  return {
    sendPassword,
    loading,
    error,
    clearError: () => setError(null),
    isSuccess: success
  }
}