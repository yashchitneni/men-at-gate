import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useCreateRace } from '@/hooks/useRaces';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const formSchema = z.object({
  race_name: z.string().min(2, 'Race name is required'),
  race_date: z.string().min(1, 'Date is required'),
  location: z.string().min(2, 'Location is required'),
  distance_type: z.string().min(1, 'Distance type is required'),
  registration_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const distanceTypes = [
  '5K',
  '10K',
  'Half Marathon',
  'Marathon',
  'Ultra (50K)',
  'Ultra (50M)',
  'Ultra (100K)',
  'Ultra (100M)',
  'Triathlon - Sprint',
  'Triathlon - Olympic',
  'Triathlon - 70.3',
  'Triathlon - Ironman',
  'HYROX',
  'Spartan/OCR',
  'Other',
];

export default function RaceSubmit() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const createRace = useCreateRace();
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/races');
    }
  }, [user, loading, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      race_name: '',
      race_date: '',
      location: '',
      distance_type: '',
      registration_url: '',
      description: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;

    console.log('🟡 RaceSubmit onSubmit called', { userId: user.id, raceName: values.race_name });

    try {
      await createRace.mutateAsync({
        userId: user.id,
        race_name: values.race_name,
        race_date: values.race_date,
        location: values.location,
        distance_type: values.distance_type,
        registration_url: values.registration_url || undefined,
        description: values.description || undefined,
      });
      toast({
        title: 'Race submitted!',
        description: 'Your race has been added to the board.',
      });
      navigate('/races');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit race. Please try again.',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <section className="pt-24 pb-20">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <Link to="/races" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Race Board
            </Link>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-heading">Submit a Race</CardTitle>
                <CardDescription>
                  Add a race you're participating in so other MTA brothers can join you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="race_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Race Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Austin Marathon 2025" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="race_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="distance_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distance/Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {distanceTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location *</FormLabel>
                          <FormControl>
                            <Input placeholder="Austin, TX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registration_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormDescription>
                            Link where others can register for this race
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional details about the race..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Max 500 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={createRace.isPending}
                    >
                      {createRace.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Submit Race
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
