import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import { CallData, Language } from '@/types/call';

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
  // Add other language prompts here
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
    const digits = formData.get('Digits') as string;
    const response = new VoiceResponse();

    if (!digits) {
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
      const selectedLanguage = languageMap[digits] || 'en-GB';
      response.redirect({
        method: 'POST',
      }, `/api/call/process?language=${selectedLanguage}`);
    }

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error in voice route:', error);
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

export async function processCallData(callData: CallData) {
  try {
    // Store in Supabase
    const { error } = await supabase
      .from('calls')
      .insert([callData]);

    if (error) {
      console.error('Error storing call data:', error);
    }

    // Send email to tenant
    const tenantEmail = {
      to: callData.email,
      from: 'noreply@agentfixit.com',
      subject: 'Your Fault Report Summary',
      text: `Dear ${callData.tenantName},\n\nThank you for reporting the fault. Here's a summary of the information provided:\n\nRoom: ${callData.room}\nFault: ${callData.faultDescription}\nDate: ${callData.faultDate}\nUrgency: ${callData.urgency}\n\nWe will be in touch shortly regarding next steps.\n\nBest regards,\nAgent Fix It Team`,
    };

    // Send email to property agency
    const agencyEmail = {
      to: process.env.PROPERTY_AGENCY_EMAIL!,
      from: 'noreply@agentfixit.com',
      subject: 'New Fault Report',
      text: `A new fault has been reported:\n\nTenant: ${callData.tenantName}\nEmail: ${callData.email}\nRoom: ${callData.room}\nFault: ${callData.faultDescription}\nDate: ${callData.faultDate}\nUrgency: ${callData.urgency}`,
    };

    await sgMail.send(tenantEmail);
    await sgMail.send(agencyEmail);
  } catch (error) {
    console.error('Error in processCallData:', error);
  }
} 