import { SpacesServiceClient } from '@google-apps/meet';
import { GoogleAuth } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

let meetClient: SpacesServiceClient | null = null;
let calendarClient: calendar_v3.Calendar | null = null;

/**
 * Initialize Google Auth
 */
function getAuth() {
  return new GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/meetings.space.created',
      'https://www.googleapis.com/auth/meetings'
    ],
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
}

/**
 * Initialize Google Meet client (requires domain-wide delegation or OAuth)
 * Falls back to Calendar API method if Meet API fails
 */
export async function initializeMeetClient(): Promise<SpacesServiceClient | null> {
  if (meetClient) {
    return meetClient;
  }

  try {
    const auth = getAuth();
    meetClient = new SpacesServiceClient({ auth });
    return meetClient;
  } catch (error) {
    console.warn('Failed to initialize Google Meet client, will use Calendar API fallback:', error);
    return null;
  }
}

/**
 * Initialize Google Calendar client (works better with service accounts)
 */
async function initializeCalendarClient(): Promise<calendar_v3.Calendar> {
  if (calendarClient) {
    return calendarClient;
  }

  const auth = getAuth();
  const authClient = await auth.getClient();
  calendarClient = google.calendar({ version: 'v3', auth: authClient as any });
  return calendarClient;
}

/**
 * Create a new Google Meet space
 * Currently returns a hardcoded meeting link for development
 * @returns Meeting space with meeting link
 */
export async function createMeetSpace(): Promise<{ spaceName: string; meetingUri: string; meetingCode?: string }> {
  // For now, return a hardcoded Google Meet link
  // This can be replaced with actual API calls when domain-wide delegation is configured
  const hardcodedMeetLink = 'https://meet.google.com/aah-pwfg-raj';
  const meetingCode = 'aah-pwfg-raj';
  
  console.log('Returning hardcoded Google Meet link:', hardcodedMeetLink);
  
  return {
    spaceName: `spaces/${meetingCode}`,
    meetingUri: hardcodedMeetLink,
    meetingCode: meetingCode,
  };
}

/**
 * Get meeting space details
 * @param spaceName Space name (format: spaces/{spaceId})
 */
export async function getMeetSpace(spaceName: string): Promise<{ meetingUri: string; activeConference?: any }> {
  try {
    const client = await initializeMeetClient();

    const [response] = await client.getSpace({
      name: spaceName,
    });

    return {
      meetingUri: response.meetingUri || '',
      activeConference: response.activeConference,
    };
  } catch (error: any) {
    console.error('Error getting Google Meet space:', error);
    throw error;
  }
}

/**
 * End active conference in a meeting space
 * @param spaceName Space name (format: spaces/{spaceId})
 */
export async function endActiveConference(spaceName: string): Promise<void> {
  try {
    const client = await initializeMeetClient();

    await client.endActiveConference({
      name: spaceName,
    });
  } catch (error: any) {
    console.error('Error ending Google Meet conference:', error);
    throw error;
  }
}
