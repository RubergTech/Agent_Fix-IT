import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const response = new VoiceResponse();
  response.say('We apologize, but we encountered an error. Please try your call again later.');
  response.hangup();

  return new NextResponse(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
} 