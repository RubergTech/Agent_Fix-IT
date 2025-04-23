import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { NextResponse } from 'next/server';
import { CallData, Language } from '@/types/call';

type CallState = {
  step: number;
  data: Partial<CallData>;
};

const steps = [
  'tenantConfirmation',
  'namePrompt',
  'emailPrompt',
  'roomPrompt',
  'faultPrompt',
  'datePrompt',
  'urgencyPrompt',
  'summaryPrompt',
] as const;

const languagePrompts: Record<Language, Record<string, string>> = {
  'en-GB': {
    welcome: 'Welcome to Agent Fix It. Please select your preferred language. Press 1 for English, 2 for French, 3 for Spanish, 4 for German, 5 for Italian, 6 for Portuguese, or 7 for Dutch.',
    tenantConfirmation: 'Are you the tenant holder? Please say yes or no.',
    namePrompt: 'Please state your full name.',
    emailPrompt: 'Please provide your email address.',
    roomPrompt: 'Which room is the fault in?',
    faultPrompt: 'Please describe the fault.',
    datePrompt: 'When did this fault occur?',
    urgencyPrompt: 'How urgent is this fault? Please say low, medium, or high.',
    summaryPrompt: 'Let me summarize the information we have collected.',
    goodbye: 'Thank you for your call. A summary will be sent to your email.',
  },
  'fr': {
    welcome: 'Bienvenue chez Agent Fix It. Veuillez sélectionner votre langue préférée. Appuyez sur 1 pour l\'anglais, 2 pour le français, 3 pour l\'espagnol, 4 pour l\'allemand, 5 pour l\'italien, 6 pour le portugais, ou 7 pour le néerlandais.',
    tenantConfirmation: 'Êtes-vous le locataire? Veuillez dire oui ou non.',
    namePrompt: 'Veuillez indiquer votre nom complet.',
    emailPrompt: 'Veuillez fournir votre adresse e-mail.',
    roomPrompt: 'Dans quelle pièce se trouve le problème?',
    faultPrompt: 'Veuillez décrire le problème.',
    datePrompt: 'Quand ce problème est-il survenu?',
    urgencyPrompt: 'Quelle est l\'urgence de ce problème? Veuillez dire faible, moyen ou élevé.',
    summaryPrompt: 'Permettez-moi de résumer les informations que nous avons recueillies.',
    goodbye: 'Merci pour votre appel. Un résumé sera envoyé à votre adresse e-mail.',
  },
  // Add other language prompts here
};

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const language = (url.searchParams.get('language') || 'en-GB') as Language;
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const response = new VoiceResponse();

    // Get or initialize call state
    let state: CallState = {
      step: 0,
      data: { language },
    };

    // Process the current step
    if (speechResult) {
      const currentStep = steps[state.step];
      switch (currentStep) {
        case 'tenantConfirmation':
          if (speechResult.toLowerCase().includes('yes')) {
            state.step++;
          } else {
            response.say('I apologize, but this service is only available for tenants. Goodbye.');
            response.hangup();
            return new NextResponse(response.toString(), {
              headers: { 'Content-Type': 'text/xml' },
            });
          }
          break;
        case 'namePrompt':
          state.data.tenantName = speechResult;
          state.step++;
          break;
        case 'emailPrompt':
          state.data.email = speechResult;
          state.step++;
          break;
        case 'roomPrompt':
          state.data.room = speechResult;
          state.step++;
          break;
        case 'faultPrompt':
          state.data.faultDescription = speechResult;
          state.step++;
          break;
        case 'datePrompt':
          state.data.faultDate = speechResult;
          state.step++;
          break;
        case 'urgencyPrompt':
          const urgency = speechResult.toLowerCase();
          if (urgency.includes('low') || urgency.includes('medium') || urgency.includes('high')) {
            state.data.urgency = urgency.includes('low') ? 'low' : 
                                urgency.includes('medium') ? 'medium' : 'high';
            state.step++;
          }
          break;
        case 'summaryPrompt':
          // Summarize and end call
          response.say(`Thank you for providing the information. Here's a summary of what we've collected:
            Your name: ${state.data.tenantName}
            Room: ${state.data.room}
            Fault: ${state.data.faultDescription}
            Date: ${state.data.faultDate}
            Urgency: ${state.data.urgency}
            A summary will be sent to your email at ${state.data.email}`);
          response.hangup();
          return new NextResponse(response.toString(), {
            headers: { 'Content-Type': 'text/xml' },
          });
      }
    }

    // Ask for the next piece of information
    const gather = response.gather({
      input: ['speech'],
      language,
      action: `/api/call/process?language=${language}`,
      method: 'POST',
    });

    gather.say(languagePrompts[language][steps[state.step]]);

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in process route:', error);
    // Redirect to fallback in case of error
    const response = new VoiceResponse();
    response.redirect({
      method: 'POST',
    }, '/api/call/fallback');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
} 