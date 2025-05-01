declare module '@mailchimp/mailchimp_transactional' {
  interface MailchimpMessage {
    html?: string;
    text?: string;
    subject: string;
    from_email: string;
    from_name?: string;
    to: {
      email: string;
      type: 'to' | 'cc' | 'bcc';
      name?: string;
    }[];
  }

  interface SendParams {
    message: MailchimpMessage;
    async?: boolean;
    ip_pool?: string;
    send_at?: string;
  }

  interface SendResponse {
    email: string;
    status: 'sent' | 'queued' | 'rejected' | 'invalid';
    _id: string;
    reject_reason?: string;
  }

  interface MailchimpClient {
    messages: {
      send: (params: SendParams) => Promise<SendResponse[]>;
    };
  }

  function createClient(apiKey: string): MailchimpClient;
  
  export default createClient;
}