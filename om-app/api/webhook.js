import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Jeton de vérification que tu choisis (utilisé par Meta pour valider ton serveur)
const VERIFY_TOKEN = 'om_secret_token_123'

export default async function handler(req, res) {
  // 1. Validation du Webhook par Meta (requête GET)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Jeton de vérification invalide' })
  }

  // 2. Réception d'un message entrant (requête POST)
  if (req.method === 'POST') {
    try {
      const body = req.body

      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value
        const message = value?.messages?.[0]

        if (message && message.type === 'text') {
          const senderPhone = message.from
          const messageText = message.text.body

          // Recherche ou création de la conversation dans Supabase
          let { data: conversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('external_chat_id', senderPhone)
            .eq('provider', 'whatsapp')
            .maybeSingle()

          if (!conversation) {
            const { data: newConv } = await supabase
              .from('conversations')
              .insert({
                provider: 'whatsapp',
                external_chat_id: senderPhone,
                contact_name: senderPhone,
              })
              .select()
              .single()

            conversation = newConv
          }

          // Enregistrement du message entrant
          if (conversation) {
            await supabase.from('messages').insert({
              conversation_id: conversation.id,
              sender_id: senderPhone,
              content: messageText,
              is_from_user: false,
            })
          }
        }
      }

      return res.status(200).json({ status: 'success' })
    } catch (err) {
      console.error('Erreur Webhook:', err)
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}