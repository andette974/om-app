import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth({ onSession }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  // Génération de la paire de clés WebCrypto (RSA-OAEP) pour le chiffrement E2EE
  const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    )

    const exportedPublicKey = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    )

    return btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)))
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // 1. Génération de la clé publique E2EE
        const publicKey = await generateKeyPair()

        // 2. Inscription avec redirection dynamique et métadonnées pour le Trigger SQL
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username: username,
              public_key: publicKey,
            },
          },
        })
        if (authError) throw authError

        alert('Inscription réussie ! Un e-mail de confirmation vous a été envoyé via Brevo.')
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-orange-500 mb-6 text-center">
          {isSignUp ? 'Créer un compte OM' : 'Connexion à OM'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">Nom d'utilisateur</label>
              <input
                type="text"
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-neutral-400">
          {isSignUp ? 'Déjà un compte ?' : "Pas encore de compte ?"} {' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-orange-500 hover:underline bg-transparent border-0 cursor-pointer"
          >
            {isSignUp ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  )
}