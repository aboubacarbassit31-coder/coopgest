export default function Avatar({ prenom, nom }: { prenom: string; nom: string }) {
  const initiales = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
      {initiales}
    </div>
  )
}
