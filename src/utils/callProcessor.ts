import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import { CallData } from '@/types/call';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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