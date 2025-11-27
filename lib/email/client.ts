/**
 * Email Service
 * Supports Resend and SendGrid
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private provider: 'resend' | 'sendgrid' | 'mock';

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.provider = 'resend';
    } else if (process.env.SENDGRID_API_KEY) {
      this.provider = 'sendgrid';
    } else {
      this.provider = 'mock';
      console.warn('No email provider configured, using mock emails');
    }
  }

  /**
   * Send email via configured provider
   */
  async send(params: EmailParams): Promise<void> {
    switch (this.provider) {
      case 'resend':
        await this.sendViaResend(params);
        break;
      case 'sendgrid':
        await this.sendViaSendGrid(params);
        break;
      case 'mock':
        await this.sendMock(params);
        break;
    }
  }

  /**
   * Send via Resend
   */
  private async sendViaResend(params: EmailParams): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY!;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@apex-intelligence.io';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(params: EmailParams): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY!;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@apex-intelligence.io';

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to }],
          },
        ],
        from: { email: fromEmail },
        subject: params.subject,
        content: [
          {
            type: 'text/html',
            value: params.html,
          },
          ...(params.text
            ? [
                {
                  type: 'text/plain',
                  value: params.text,
                },
              ]
            : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }
  }

  /**
   * Mock email for development
   */
  private async sendMock(params: EmailParams): Promise<void> {
    console.log('📧 Mock Email Sent:');
    console.log(`  To: ${params.to}`);
    console.log(`  Subject: ${params.subject}`);
    console.log(`  HTML length: ${params.html.length} chars`);
    if (params.text) {
      console.log(`  Text length: ${params.text.length} chars`);
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name?: string): Promise<void> {
    const displayName = name || 'there';

    await this.send({
      to,
      subject: 'Welcome to Apex Intelligence',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #22d3ee 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; }
              .content { background: #f9fafb; padding: 30px; }
              .button { display: inline-block; background: #22d3ee; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎯 Welcome to Apex Intelligence</h1>
              </div>
              <div class="content">
                <h2>Hey ${displayName}! 👋</h2>
                <p>Welcome to the underground intel network for serious TCG collectors and investors.</p>
                <p>You now have access to:</p>
                <ul>
                  <li>📊 Weekly market analysis and insights</li>
                  <li>💰 Real-time price tracking</li>
                  <li>📈 Portfolio management tools</li>
                  <li>🔔 Price alerts for your favorite cards</li>
                </ul>
                <a href="https://apex-intelligence.io/intel" class="button">Explore Market Intel →</a>
                <p>Questions? Just reply to this email. We're here to help.</p>
                <p>— The Apex Team</p>
              </div>
              <div class="footer">
                <p>Apex Intelligence | TCG Market Intelligence</p>
                <p>You received this email because you signed up at apex-intelligence.io</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Hey ${displayName}! Welcome to Apex Intelligence. You now have access to weekly market analysis, real-time price tracking, portfolio management, and price alerts. Visit https://apex-intelligence.io/intel to get started.`,
    });
  }

  /**
   * Send price alert notification
   */
  async sendPriceAlert(params: {
    to: string;
    cardName: string;
    currentPrice: number;
    targetPrice: number;
    alertType: 'above' | 'below';
  }): Promise<void> {
    const { to, cardName, currentPrice, targetPrice, alertType } = params;

    const direction = alertType === 'above' ? 'risen above' : 'dropped below';
    const emoji = alertType === 'above' ? '📈' : '📉';

    await this.send({
      to,
      subject: `${emoji} Price Alert: ${cardName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
              .price { font-size: 32px; font-weight: bold; color: #0891b2; }
              .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${emoji} Price Alert Triggered</h2>
              <div class="alert">
                <h3>${cardName}</h3>
                <p>The price has ${direction} your target.</p>
                <p>
                  Current Price: <span class="price">$${currentPrice.toFixed(2)}</span><br>
                  Your Target: <span style="color: #6b7280;">$${targetPrice.toFixed(2)}</span>
                </p>
              </div>
              <a href="https://apex-intelligence.io/portfolio" class="button">View in Portfolio →</a>
              <p style="color: #6b7280; font-size: 14px;">
                You're receiving this because you set up a price alert for this card.
                <a href="https://apex-intelligence.io/settings/alerts">Manage alerts</a>
              </p>
            </div>
          </body>
        </html>
      `,
      text: `Price Alert: ${cardName} has ${direction} your target. Current price: $${currentPrice.toFixed(2)}, Target: $${targetPrice.toFixed(2)}. View at https://apex-intelligence.io/portfolio`,
    });
  }

  /**
   * Send subscription confirmation
   */
  async sendSubscriptionConfirmation(params: {
    to: string;
    name?: string;
    tier: 'intelligence' | 'apex';
    amount: number;
  }): Promise<void> {
    const { to, name, tier, amount } = params;
    const displayName = name || 'there';
    const tierName = tier === 'intelligence' ? 'Intelligence' : 'Apex';

    await this.send({
      to,
      subject: `🎉 Welcome to ${tierName} - Subscription Confirmed`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; }
              .badge { background: #fbbf24; color: #1f2937; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 You're Now ${tierName}!</h1>
                <div class="badge">${tierName} Tier</div>
              </div>
              <div style="padding: 30px;">
                <h2>Hey ${displayName}!</h2>
                <p>Your ${tierName} subscription is now active. Welcome to the premium tier!</p>
                <p><strong>Subscription Details:</strong></p>
                <ul>
                  <li>Plan: ${tierName} ($${amount}/month)</li>
                  <li>Next billing date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                </ul>
                <p>You now have access to all premium features. Start exploring!</p>
                <p>Manage your subscription anytime in your <a href="https://apex-intelligence.io/settings">account settings</a>.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Your ${tierName} subscription is now active! Plan: ${tierName} ($${amount}/month). Manage at https://apex-intelligence.io/settings`,
    });
  }
}

export const emailService = new EmailService();
