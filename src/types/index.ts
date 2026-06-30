export type Membre = {
  id: string
  nom: string
  prenom: string
  telephone: string | null
  superficie_ha: number | null
  date_adhesion: string
  statut: 'actif' | 'inactif'
  cotisation_statut: 'a_jour' | 'partiel' | 'en_retard' | 'en_attente'
  created_at: string
  user_id: string
}

export type StatutCotisation = Membre['cotisation_statut']
export type StatutMembre = Membre['statut']
