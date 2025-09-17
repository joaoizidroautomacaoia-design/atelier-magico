import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Scissors } from 'lucide-react';

const Auth = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Ateliê Manager</CardTitle>
          <CardDescription>
            Entre com sua conta Google para acessar o sistema de gestão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={signInWithGoogle}
            className="w-full"
            size="lg"
          >
            Entrar com Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;