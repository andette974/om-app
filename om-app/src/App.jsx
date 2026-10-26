import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier la session active au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Écouter les changements d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-orange-500 font-medium">
        Chargement de OM...
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, afficher le formulaire d'authentification
  if (!session) {
    return <Auth onSession={setSession} />
  }

  // Si connecté, afficher l'application principale
  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Barre latérale / Navigation */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-wider text-orange-500">OM</h1>
            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
              Zero-Knowledge
            </span>
          </div>

          <nav className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-neutral-800 text-white font-medium">
              Messages
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg text-neutral-400 hover:bg-neutral-800/50 hover:text-white transition-colors">
              Comptes liés
            </button>
          </nav>
        </div>

        {/* Profil & Déconnexion */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium truncate max-w-[120px]">{session.user.email}</p>
            <p className="text-xs text-emerald-500">En ligne</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2.5 py-1.5 rounded transition-colors"
          >
            Sortir
          </button>
        </div>
      </aside>

      {/* Zone Principale */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-orange-500/20">
            ✓
          </div>
          <h2 className="text-xl font-bold">Session sécurisée active</h2>
          <p className="text-sm text-neutral-400">
            Votre paire de clés E2EE est configurée. Votre base PostgreSQL sur Supabase ne stockera que des données chiffrées.
          </p>
        </div>
      </main>
    </div>
  )
}