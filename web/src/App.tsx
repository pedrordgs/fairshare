import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@services';
import { HomePage } from '@pages';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>
  );
}

export default App;