import { NextResponse } from 'next/server';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import { CallData, Language } from '@/types/call';
import { processCallData } from '@/utils/callProcessor';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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

const languageMap: Record<string, Language> = {
  '1': 'en-GB',
  '2': 'fr',
  '3': 'es',
  '4': 'de',
  '5': 'it',
  '6': 'pt',
  '7': 'nl',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const language = formData.get('language') as string;
    const response = new VoiceResponse();

    if (!language) {
      // Initial call - ask for language selection
      const gather = response.gather({
        input: ['dtmf'],
        numDigits: 1,
        action: '/api/call/voice',
        method: 'POST',
      });
      gather.say(languagePrompts['en-GB'].welcome);
    } else {
      // Language selected - redirect to process with selected language
      const selectedLanguage = languageMap[language] || 'en-GB';
      response.redirect({
        method: 'POST',
      }, `/api/call/process?language=${selectedLanguage}`);
    }

    // Process the call data
    const callData: CallData = {
      tenantName: speechResult.split(', ')[0],
      email: speechResult.split(', ')[1],
      room: speechResult.split(', ')[2],
      faultDescription: speechResult.split(', ')[3],
      faultDate: speechResult.split(', ')[4],
      urgency: speechResult.split(', ')[5],
      createdAt: new Date().toISOString(),
      language: language as Language
    };

    await processCallData(callData);

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in voice route:', error);
    return NextResponse.redirect(new URL('/api/call/fallback', request.url));
  }
} 