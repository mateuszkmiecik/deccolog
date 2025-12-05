import { render } from 'preact'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import './index.css'
import { App } from './app.tsx'
import { Toaster } from './components/ui/sonner.tsx';

const client = new QueryClient();

render(
  <QueryClientProvider client={client}>
    <App />
    <Toaster position='top-center' />
  </QueryClientProvider>,
  document.getElementById('app')!
)
