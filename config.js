// ============================================================================
//  RÉGLAGES DU JEU « الروّة متاع الزهر » — Best Body Tunisie
//  Modifier seulement ce fichier, puis remettre le dossier roue/ en ligne.
// ============================================================================
window.ROUE_CONFIG = {
  marque: 'Best Body Tunisie',

  // Où le gagnant envoie son code (remplir au moins UN des trois, sinon la page
  // lui dit simplement « صوّر الشاشة و ابعثلنا في الميساج ») :
  whatsapp: '',        // numéro au format international sans + ni espaces, ex. '21620123456'
  instagram: '',       // nom du compte sans @, ex. 'bestbody.tunisie'  → ouvre ig.me/m/...
  facebook: '',        // nom de la page Facebook, ex. 'bestbodytunisie' → ouvre m.me/...

  // Dates du jeu (format AAAA-MM-JJ, heure du téléphone). Vide = pas de limite.
  debut: '',
  fin: '',

  // Chances de gagner, en % par lancer (le reste = « عاود غدوة »).
  // ⚠ La roue AFFICHE 2 cases par produit, mais c'est CE réglage qui décide.
  //   Exemple : 1000 lancers avec LM 0.5 et CR 3 → ~5 Lean Mass et ~30 Creatine.
  //   Ajuster selon le stock prévu (et le nombre de visiteurs).
  lots: {
    LM: { nom: 'Gold Lean Mass 6 كغ', image: 'assets/bag.webp', chance: 0.5 },
    CR: { nom: 'Gold Creatine 300 غ', image: 'assets/jar.webp', chance: 3 },
  },

  // Stock annoncé dans les règles (texte libre, en derja).
  stock: '2 Gold Lean Mass و 10 Gold Creatine طول مدّة اللعبة',

  // Lien de la page (pour le bouton « partager ») — vide = adresse actuelle.
  lien: 'https://contactnasriimen-ctrl.github.io/best-body-roue/',
};
