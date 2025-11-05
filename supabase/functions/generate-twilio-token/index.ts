import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import twilio from 'npm:twilio'; // Import Twilio from npm

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identity, roomName } = await req.json();

    if (!identity || !roomName) {
      throw new Error('Identity and roomName are required.');
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_API_KEY_SID = Deno.env.get('TWILIO_API_KEY_SID');
    const TWILIO_API_KEY_SECRET = Deno.env.get('TWILIO_API_KEY_SECRET');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
      throw new Error('Twilio environment variables not configured.');
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    const token = new AccessToken(
      TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      { identity: identity }
    );

    const videoGrant = new VideoGrant({
      room: roomName,
    });

    token.addGrant(videoGrant);

    return new Response(JSON.stringify({ token: token.toJwt() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error generating Twilio token:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});