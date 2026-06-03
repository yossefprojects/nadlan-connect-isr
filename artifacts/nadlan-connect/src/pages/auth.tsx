import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Auth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/auth/login");
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Redirection...
    </div>
  );
}
