import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "@services/queryClient";
import { router } from "@router/index";
import { AuthProvider } from "@context/AuthContext";
import { AuthModal } from "@components/auth/AuthModal";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <AuthModal />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
