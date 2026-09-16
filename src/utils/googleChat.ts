import { TaskItem, ReminderNotification } from '../types';

export interface ChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName: string;
  spaceType?: string;
  type?: string;
}

/**
 * Fetch available Google Chat Spaces using the user's OAuth access token
 */
export async function listGoogleChatSpaces(accessToken: string): Promise<ChatSpace[]> {
  try {
    const res = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Google Chat API spaces request error:', err);
      return [];
    }

    const data = await res.json();
    if (data.spaces && Array.isArray(data.spaces)) {
      return data.spaces.map((s: any) => ({
        name: s.name,
        displayName: s.displayName || s.name.replace('spaces/', 'Space '),
        spaceType: s.spaceType,
        type: s.type,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to list Google Chat spaces:', error);
    return [];
  }
}

/**
 * Send a notification message to a Google Chat Space
 */
export async function sendGoogleChatMessage(
  spaceName: string,
  text: string,
  accessToken: string,
  cardDetails?: {
    title: string;
    subtitle?: string;
    fields?: { label: string; value: string }[];
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
    
    const bodyPayload: any = {
      text: text,
    };

    if (cardDetails) {
      bodyPayload.cardsV2 = [
        {
          cardId: `wb_card_${Date.now()}`,
          card: {
            header: {
              title: cardDetails.title,
              subtitle: cardDetails.subtitle || 'Wholesale Banking Project Control Center',
              imageUrl: 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/shield_with_heart/default/48px.svg',
              imageType: 'CIRCLE',
            },
            sections: [
              {
                header: 'Deliverable Status & Accountability',
                widgets: (cardDetails.fields || []).map((f) => ({
                  decoratedText: {
                    topLabel: f.label,
                    text: `<b>${f.value}</b>`,
                    wrapText: true,
                  },
                })),
              },
            ],
          },
        },
      ];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}: Failed to send message`);
    }

    const data = await res.json();
    return { success: true, messageId: data.name };
  } catch (error: any) {
    console.error('Error sending Google Chat message:', error);
    return { success: false, error: error.message || 'Failed to dispatch Google Chat message' };
  }
}

/**
 * Send a notification message via an Incoming Webhook URL
 */
export async function sendGoogleChatWebhook(
  webhookUrl: string,
  text: string,
  cardDetails?: {
    title: string;
    subtitle?: string;
    fields?: { label: string; value: string }[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: any = { text };
    if (cardDetails) {
      payload.cards = [
        {
          header: {
            title: cardDetails.title,
            subtitle: cardDetails.subtitle || 'Wholesale Banking Project Control Center',
          },
          sections: [
            {
              widgets: (cardDetails.fields || []).map(f => ({
                keyValue: {
                  topLabel: f.label,
                  content: f.value,
                }
              }))
            }
          ]
        }
      ];
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Webhook dispatch failed with HTTP ${res.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending to Google Chat webhook:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format a task alert into a Google Chat Card payload
 */
export function formatTaskForGoogleChat(task: TaskItem, asOfDate: string, escalationNote?: string) {
  const isOverdue = (task.delayDays && task.delayDays > 0) || task.status === 'Delayed';
  const header = isOverdue ? `🚨 [CRITICAL DELAY] Task #${task.sNo}: ${task.title}` : `📋 Task Update #${task.sNo}: ${task.title}`;
  
  const textSummary = `*${header}*\n` +
    `• *Workstream:* ${task.workstream}\n` +
    `• *Status:* ${task.status} (${task.percentComplete ?? 0}% complete)\n` +
    `• *Target Finish:* ${task.endDate}\n` +
    `• *Owners:* Backend: ${task.backendOwner} | Frontend: ${task.frontendOwner} | QA: ${task.testOwner}\n` +
    (task.delayDays ? `• *Delay Overdue:* +${task.delayDays} days\n` : '') +
    (task.delayReason ? `• *Root Cause:* ${task.delayReason}\n` : '') +
    (task.mitigationPlan ? `• *Mitigation:* ${task.mitigationPlan}\n` : '') +
    (escalationNote ? `\n*Escalation Note:* ${escalationNote}` : '');

  return {
    header,
    textSummary,
    card: {
      title: header,
      subtitle: `As-of Reference Date: ${asOfDate}`,
      fields: [
        { label: 'Workstream', value: task.workstream },
        { label: 'Deliverable', value: task.deliverable },
        { label: 'Status / Progress', value: `${task.status} (${task.percentComplete ?? 0}%)` },
        { label: 'Timeline Baseline', value: `${task.startDate} to ${task.endDate}` },
        { label: 'Assigned Leads', value: `BE: ${task.backendOwner} | FE: ${task.frontendOwner}` },
        { label: 'Delay Horizon', value: task.delayDays ? `+${task.delayDays} Days Overdue` : 'On Schedule' },
        ...(task.mitigationPlan ? [{ label: 'Mitigation Plan', value: task.mitigationPlan }] : []),
      ],
    },
  };
}
