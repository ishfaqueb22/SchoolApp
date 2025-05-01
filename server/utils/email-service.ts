import mailchimp from '@mailchimp/mailchimp_transactional';

// Initialize Mailchimp Transactional client
const apiKey = process.env.MAILCHIMP_API_KEY || '14c89fac03af7fa83b5fe23160febd97-us17';
const mailchimpClient = mailchimp(apiKey);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using Mailchimp Transactional API
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Validate the required email parameters
    if (!params.to || !params.from || !params.subject) {
      console.error('Required email parameters missing');
      return false;
    }
    
    const message = {
      html: params.html || '',
      text: params.text || '',
      subject: params.subject,
      from_email: params.from,
      from_name: 'SmartSchool Finder',
      to: [
        {
          email: params.to,
          type: 'to'
        }
      ]
    };
    
    const response = await mailchimpClient.messages.send({
      message
    });
    
    if (response && response[0] && response[0].status === 'sent') {
      console.log(`Email sent successfully to ${params.to}`);
      return true;
    } else {
      console.error('Failed to send email:', response);
      return false;
    }
  } catch (error) {
    console.error('Mailchimp Transactional API error:', error);
    return false;
  }
}