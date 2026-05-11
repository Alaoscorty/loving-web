'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useActionState, useEffect, startTransition } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { generateBioAction } from '@/app/actions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const bioHelperSchema = z.object({
  hobbies: z.string().optional(),
  profession: z.string().optional(),
  situationFamiliale: z.string().optional(),
  personalityTraits: z.string().optional(),
  goals: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type BioHelperFormValues = z.infer<typeof bioHelperSchema>;

type Props = {
  mainForm: UseFormReturn<any>;
};

export function AiBioAssistantForm({ mainForm }: Props) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(generateBioAction, { biography: '' });

  const form = useForm<BioHelperFormValues>({
    resolver: zodResolver(bioHelperSchema),
    defaultValues: {
      hobbies: '',
      profession: '',
      situationFamiliale: '',
      personalityTraits: '',
      goals: '',
      additionalInfo: '',
    }
  });

  const { handleSubmit } = form;

  useEffect(() => {
    if (state?.biography) {
      mainForm.setValue('bio', state.biography, { shouldValidate: true });
      toast({
        title: 'Biographie générée !',
        description: 'Votre biographie a été mise à jour. Vous pouvez la modifier si vous le souhaitez.',
      });
    }
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: state.error,
      });
    }
  }, [state, mainForm, toast]);

  const onGenerate = (data: BioHelperFormValues) => {
    const preparedData = {
      ...data,
      hobbies: data.hobbies?.split(',').map((s) => s.trim()).filter(Boolean),
      personalityTraits: data.personalityTraits?.split(',').map((s) => s.trim()).filter(Boolean),
      goals: data.goals?.split(',').map((s) => s.trim()).filter(Boolean),
    };
    // Fix: wrap manual call to action in startTransition as required by React 19
    startTransition(() => {
      formAction(preparedData);
    });
  };

  return (
    <Card className="bg-card/50 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Wand2 className="text-accent" />
          Assistant de Biographie IA
        </CardTitle>
        <CardDescription>
          Pas d'inspiration ? Remplissez quelques champs et laissez notre IA écrire une bio percutante pour vous.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hobbies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hobbies & Intérêts</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: lecture, randonnée, cinéma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Infirmière, artiste" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="situationFamiliale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situation familiale</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Célibataire, maman d'un garçon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personalityTraits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Traits de personnalité</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Aventureuse, calme, pleine d'humour" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buts et aspirations</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Voyager, apprendre une langue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="additionalInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informations additionnelles</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Je suis passionnée de cuisine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button 
              type="button" 
              onClick={handleSubmit(onGenerate)}
              disabled={isPending} 
              className="w-full md:w-auto"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Générer ma biographie
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
