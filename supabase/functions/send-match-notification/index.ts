import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotificationRequest {
  userId: string;
  matches: {
    productTitle: string;
    storeName: string;
    matchScore: number;
    productUrl: string;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    const { userId, matches } = await req.json() as EmailNotificationRequest

    // Get user's email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.email) {
      console.error('Error fetching user profile:', profileError)
      throw new Error('User profile not found')
    }

    // Create email content
    const matchesList = matches
      .map(match => `
        <li style="margin-bottom: 15px;">
          <strong>${match.productTitle}</strong> from ${match.storeName}<br>
          Match Score: ${Math.round(match.matchScore * 100)}%<br>
          <a href="${match.productUrl}" style="color: #3b82f6;">View Product</a>
        </li>
      `)
      .join('')

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">New Style Matches Found! 🎉</h2>
        <p>We've found some new products that match your style:</p>
        <ul style="list-style: none; padding: 0;">
          ${matchesList}
        </ul>
        <p style="margin-top: 20px;">
          <a href="${SUPABASE_URL}/matches" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View All Matches
          </a>
        </p>
      </div>
    `

    // Send email using Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Style Match <notifications@yourdomain.com>',
        to: [profile.email],
        subject: 'New Style Matches Found!',
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in send-match-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})