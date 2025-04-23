import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { NextResponse } from 'next/server';
import { CallData, Language } from '@/types/call';

type CallState = {
  step: number;
  data: Partial<CallData>;
};

// Map our language codes to Twilio's supported language codes
const languageToTwilioLanguage: Record<Language, string> = {
  'en-GB': 'en-GB',
  'fr': 'fr-FR',
  'es': 'es-ES',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-BR', // Twilio doesn't support pt-PT, using pt-BR instead
  'nl': 'nl-NL'
} as const;

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
  'es': {
    welcome: 'Bienvenido a Agent Fix It. Por favor, seleccione su idioma preferido. Presione 1 para inglés, 2 para francés, 3 para español, 4 para alemán, 5 para italiano, 6 para portugués o 7 para holandés.',
    tenantConfirmation: '¿Es usted el inquilino? Por favor, diga sí o no.',
    namePrompt: 'Por favor, indique su nombre completo.',
    emailPrompt: 'Por favor, proporcione su dirección de correo electrónico.',
    roomPrompt: '¿En qué habitación está la avería?',
    faultPrompt: 'Por favor, describa la avería.',
    datePrompt: '¿Cuándo ocurrió esta avería?',
    urgencyPrompt: '¿Qué tan urgente es esta avería? Por favor, diga bajo, medio o alto.',
    summaryPrompt: 'Permítame resumir la información que hemos recopilado.',
    goodbye: 'Gracias por su llamada. Se enviará un resumen a su correo electrónico.',
  },
  'de': {
    welcome: 'Willkommen bei Agent Fix It. Bitte wählen Sie Ihre bevorzugte Sprache. Drücken Sie 1 für Englisch, 2 für Französisch, 3 für Spanisch, 4 für Deutsch, 5 für Italienisch, 6 für Portugiesisch oder 7 für Niederländisch.',
    tenantConfirmation: 'Sind Sie der Mieter? Bitte sagen Sie ja oder nein.',
    namePrompt: 'Bitte nennen Sie Ihren vollständigen Namen.',
    emailPrompt: 'Bitte geben Sie Ihre E-Mail-Adresse an.',
    roomPrompt: 'In welchem Raum befindet sich der Fehler?',
    faultPrompt: 'Bitte beschreiben Sie den Fehler.',
    datePrompt: 'Wann ist dieser Fehler aufgetreten?',
    urgencyPrompt: 'Wie dringend ist dieser Fehler? Bitte sagen Sie niedrig, mittel oder hoch.',
    summaryPrompt: 'Lassen Sie mich die gesammelten Informationen zusammenfassen.',
    goodbye: 'Vielen Dank für Ihren Anruf. Eine Zusammenfassung wird an Ihre E-Mail gesendet.',
  },
  'it': {
    welcome: 'Benvenuto in Agent Fix It. Seleziona la lingua preferita. Premi 1 per inglese, 2 per francese, 3 per spagnolo, 4 per tedesco, 5 per italiano, 6 per portoghese o 7 per olandese.',
    tenantConfirmation: 'Sei l\'inquilino? Per favore, rispondi sì o no.',
    namePrompt: 'Per favore, indica il tuo nome completo.',
    emailPrompt: 'Per favore, fornisci il tuo indirizzo email.',
    roomPrompt: 'In quale stanza si trova il guasto?',
    faultPrompt: 'Per favore, descrivi il guasto.',
    datePrompt: 'Quando si è verificato questo guasto?',
    urgencyPrompt: 'Quanto è urgente questo guasto? Per favore, rispondi basso, medio o alto.',
    summaryPrompt: 'Permettimi di riassumere le informazioni raccolte.',
    goodbye: 'Grazie per la tua chiamata. Un riepilogo sarà inviato alla tua email.',
  },
  'pt': {
    welcome: 'Bem-vindo ao Agent Fix It. Por favor, selecione seu idioma preferido. Pressione 1 para inglês, 2 para francês, 3 para espanhol, 4 para alemão, 5 para italiano, 6 para português ou 7 para holandês.',
    tenantConfirmation: 'Você é o inquilino? Por favor, diga sim ou não.',
    namePrompt: 'Por favor, indique seu nome completo.',
    emailPrompt: 'Por favor, forneça seu endereço de e-mail.',
    roomPrompt: 'Em qual cômodo está o defeito?',
    faultPrompt: 'Por favor, descreva o defeito.',
    datePrompt: 'Quando ocorreu este defeito?',
    urgencyPrompt: 'Qual a urgência deste defeito? Por favor, diga baixo, médio ou alto.',
    summaryPrompt: 'Deixe-me resumir as informações que coletamos.',
    goodbye: 'Obrigado pela sua ligação. Um resumo será enviado para seu e-mail.',
  },
  'nl': {
    welcome: 'Welkom bij Agent Fix It. Selecteer uw voorkeurstaal. Druk op 1 voor Engels, 2 voor Frans, 3 voor Spaans, 4 voor Duits, 5 voor Italiaans, 6 voor Portugees of 7 voor Nederlands.',
    tenantConfirmation: 'Bent u de huurder? Zeg alstublieft ja of nee.',
    namePrompt: 'Geef alstublieft uw volledige naam op.',
    emailPrompt: 'Geef alstublieft uw e-mailadres op.',
    roomPrompt: 'In welke kamer bevindt zich het defect?',
    faultPrompt: 'Beschrijf alstublieft het defect.',
    datePrompt: 'Wanneer is dit defect opgetreden?',
    urgencyPrompt: 'Hoe dringend is dit defect? Zeg alstublieft laag, gemiddeld of hoog.',
    summaryPrompt: 'Laat me de verzamelde informatie samenvatten.',
    goodbye: 'Bedankt voor uw oproep. Er wordt een samenvatting naar uw e-mail gestuurd.',
  },
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
      language: languageToTwilioLanguage[language] as any, // Type assertion needed since Twilio's types are not properly exported
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