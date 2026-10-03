(function () {
  if (window.HanakiI18n) return;
  const IX = { ca: 0, en: 1, fr: 2 };
  const D = {
    "Importante: tu reserva solo nos llega si envías el mensaje en WhatsApp. Después espera nuestra confirmación.": ["Important: la teva reserva només ens arriba si envies el missatge per WhatsApp. Després espera la nostra confirmació.","Important: we only receive your booking once you send the WhatsApp message. Then wait for our confirmation.","Important : nous ne recevons votre réservation que si vous envoyez le message WhatsApp. Attendez ensuite notre confirmation."],
    "Comprueba si se ha enviado. Si no, copia y pega este mensaje a": ["Comprova si s’ha enviat. Si no, copia i enganxa aquest missatge al","Check whether it was sent. If not, copy and paste this message to","Vérifiez s’il a été envoyé. Sinon, copiez-collez ce message au"],
    "Comprueba si se ha enviado.": ["Comprova si s’ha enviat.","Check whether it was sent.","Vérifiez s’il a été envoyé."],
    "Comprueba si se ha enviado": ["Comprova si s’ha enviat","Check whether it was sent","Vérifiez s’il a été envoyé"],
    "Si no, copia y pega este mensaje a": ["Si no, copia i enganxa aquest missatge al","If not, copy and paste this message to","Sinon, copiez-collez ce message au"],
    "en WhatsApp:": ["per WhatsApp:","on WhatsApp:","sur WhatsApp :"],
    "COPIAR MENSAJE": ["COPIAR MISSATGE","COPY MESSAGE","COPIER LE MESSAGE"],
    "✓ MENSAJE COPIADO": ["✓ MISSATGE COPIAT","✓ MESSAGE COPIED","✓ MESSAGE COPIÉ"],
    "IDIOMA": ["IDIOMA","LANGUAGE","LANGUE"],
    "Importante: tu reserva solo nos llega si envías el mensaje en WhatsApp.": ["Important: la teva reserva només ens arriba si envies el missatge per WhatsApp.","Important: we only receive your booking once you send the WhatsApp message.","Important : nous ne recevons votre réservation que si vous envoyez le message WhatsApp."],
    "Si no se envía, no podemos verla. Después espera nuestra confirmación.": ["Si no s’envia, no la podem veure. Després espera la nostra confirmació.","If it isn’t sent, we can’t see it. Then wait for our confirmation.","S’il n’est pas envoyé, nous ne pouvons pas la voir. Attendez ensuite notre confirmation."],
    "¿No se abre WhatsApp?": ["No s’obre WhatsApp?","WhatsApp didn’t open?","WhatsApp ne s’ouvre pas ?"],
    "Escríbenos directamente al WhatsApp": ["Escriu-nos directament al WhatsApp","Message us directly on WhatsApp","Écrivez-nous directement sur WhatsApp"],
    "WHATSAPP · 613 261 135": ["WHATSAPP · 613 261 135","WHATSAPP · 613 261 135","WHATSAPP · 613 261 135"],
    "ENVIAR MI RESERVA POR WHATSAPP": ["ENVIAR LA MEVA RESERVA PER WHATSAPP","SEND MY BOOKING ON WHATSAPP","ENVOYER MA RÉSERVATION PAR WHATSAPP"],
    "Tu reserva aún NO está hecha": ["La teva reserva encara NO està feta","Your booking is NOT made yet","Votre réservation n’est PAS encore faite"],
    "Pulsa el botón para abrir WhatsApp con tu reserva ya escrita y dale a enviar. Si el mensaje no se envía, no podemos ver tu reserva. Después espera nuestra confirmación.": ["Prem el botó per obrir WhatsApp amb la reserva ja escrita i envia-la. Si el missatge no s’envia, no podem veure la teva reserva. Després espera la nostra confirmació.","Tap the button to open WhatsApp with your booking already written and press send. If the message isn’t sent, we can’t see your booking. Then wait for our confirmation.","Appuyez sur le bouton pour ouvrir WhatsApp avec votre réservation déjà rédigée et envoyez-la. Si le message n’est pas envoyé, nous ne pouvons pas voir votre réservation. Attendez ensuite notre confirmation."],
    "Mesa pendiente de enviar": ["Taula pendent d’enviar","Table pending send","Table en attente d’envoi"],
    'CARTA': ['CARTA', 'MENU', 'CARTE'],
    'RESERVAR': ['RESERVAR', 'BOOK', 'RÉSERVER'],
    'Inicio': ['Inici', 'Home', 'Accueil'],
    'Carta': ['Carta', 'Menu', 'Carte'],
    'Precios': ['Preus', 'Prices', 'Tarifs'],
    'Galería': ['Galeria', 'Gallery', 'Galerie'],
    'Reservas': ['Reserves', 'Bookings', 'Réservations'],
    'Contacto': ['Contacte', 'Contact', 'Contact'],
    'Restaurante japonés · Salou': ['Restaurant japonès · Salou', 'Japanese restaurant · Salou', 'Restaurant japonais · Salou'],
    'Buffet libre': ['Bufet lliure', 'All-you-can-eat', 'Buffet à volonté'],
    'japonés.': ['japonès.', 'Japanese.', 'japonais.'],
    'Más de 120 platos sin límites en el corazón de Salou.': ['Més de 120 plats sense límits al cor de Salou.', 'Over 120 dishes, no limits, in the heart of Salou.', 'Plus de 120 plats à volonté au cœur de Salou.'],
    'RESERVAR MESA': ['RESERVAR TAULA', 'BOOK A TABLE', 'RÉSERVER UNE TABLE'],
    'VER CARTA →': ['VEURE LA CARTA →', 'SEE THE MENU →', 'VOIR LA CARTE →'],
    '+120 platos': ['+120 plats', '+120 dishes', '+120 plats'],
    'Sin límites, todo incluido': ['Sense límits, tot inclòs', 'No limits, all included', 'Sans limite, tout compris'],
    'Pides desde la tablet': ['Demanes des de la tauleta', 'Order from the tablet', 'Commandez sur la tablette'],
    'Cuando quieras, lo que quieras': ['Quan vulguis, el que vulguis', 'Whenever, whatever you like', 'Quand vous voulez, ce que vous voulez'],
    'Cocina al momento': ['Cuina al moment', 'Cooked to order', 'Cuisine minute'],
    'Cada plato, recién hecho': ['Cada plat, acabat de fer', 'Every dish, freshly made', 'Chaque plat, préparé à l’instant'],
    'Veggie y vegano': ['Veggie i vegà', 'Veggie & vegan', 'Végé et vegan'],
    'Opciones para todos': ['Opcions per a tothom', 'Options for everyone', 'Des options pour tous'],
    'del buffet': ['del bufet', 'for the buffet', 'du buffet'],
    'Más sabor, mismo espíritu japonés.': ['Més sabor, el mateix esperit japonès.', 'More flavour, same Japanese spirit.', 'Plus de saveur, le même esprit japonais.'],
    'MEDIODÍA': ['MIGDIA', 'LUNCH', 'MIDI'],
    'NOCHE': ['NIT', 'DINNER', 'SOIR'],
    'Lunes a viernes': ['Dilluns a divendres', 'Monday to Friday', 'Du lundi au vendredi'],
    'ADULTO': ['ADULT', 'ADULT', 'ADULTE'],
    'Niños (3-8) ·': ['Nens (3-8) ·', 'Kids (3-8) ·', 'Enfants (3-8) ·'],
    'NOCHES, FINES DE SEMANA Y FESTIVOS': ['NITS, CAPS DE SETMANA I FESTIUS', 'EVENINGS, WEEKENDS & HOLIDAYS', 'SOIRS, WEEK-ENDS ET JOURS FÉRIÉS'],
    'Todas las cenas': ['Tots els sopars', 'All dinners', 'Tous les dîners'],
    'DOMICILIO Y PARA LLEVAR': ['A DOMICILI I PER EMPORTAR', 'DELIVERY & TAKEAWAY', 'LIVRAISON ET À EMPORTER'],
    'Salou y alrededores': ['Salou i voltants', 'Salou and surroundings', 'Salou et alentours'],
    'Llámanos y te lo llevamos': ['Truca’ns i t’ho portem', 'Call us and we’ll bring it', 'Appelez-nous, on vous livre'],
    'LLAMAR': ['TRUCAR', 'CALL', 'APPELER'],
    '* Bebidas y postres no incluidos.': ['* Begudes i postres no inclosos.', '* Drinks and desserts not included.', '* Boissons et desserts non compris.'],
    'La carta': ['La carta', 'The menu', 'La carte'],
    'Incluido en el buffet': ['Inclòs al bufet', 'Included in the buffet', 'Inclus dans le buffet'],
    'VER CARTA COMPLETA': ['VEURE LA CARTA COMPLETA', 'SEE FULL MENU', 'VOIR LA CARTE COMPLÈTE'],
    'VER MENOS': ['VEURE’N MENYS', 'SHOW LESS', 'VOIR MOINS'],
    'cómo funciona —': ['com funciona —', 'how it works —', 'comment ça marche —'],
    'Pide, disfruta,': ['Demana, gaudeix,', 'Order, enjoy,', 'Commandez, savourez,'],
    'repite': ['repeteix', 'repeat', 'recommencez'],
    'Te sentamos': ['T’asseiem', 'We seat you', 'On vous installe'],
    'Pides desde la tablet todo lo que quieras': ['Demanes des de la tauleta tot el que vulguis', 'Order anything you like from the tablet', 'Commandez tout ce que vous voulez sur la tablette'],
    'Nuestro robot te lo trae a la mesa': ['El nostre robot t’ho porta a taula', 'Our robot brings it to your table', 'Notre robot vous l’apporte à table'],
    'Nuestro robot va a tu mesa': ['El nostre robot va a la teva taula', 'Our robot comes to your table', 'Notre robot vient à votre table'],
    'Y te lo sirve recién hecho': ['I te’l serveix acabat de fer', 'And serves it freshly made', 'Et vous le sert tout juste préparé'],
    'Bienvenidos a': ['Benvinguts a', 'Welcome to', 'Bienvenue chez'],
    'Sushi fresco hecho al momento, cocina caliente recién salida del wok y un ambiente acogedor en pleno centro de Salou. Ideal para familias, grupos y celebraciones.': ['Sushi fresc fet al moment, cuina calenta acabada de sortir del wok i un ambient acollidor en ple centre de Salou. Ideal per a famílies, grups i celebracions.', 'Fresh sushi made to order, hot dishes straight from the wok and a cosy atmosphere in the heart of Salou. Perfect for families, groups and celebrations.', 'Sushis frais préparés à la minute, plats chauds tout juste sortis du wok et une ambiance chaleureuse en plein centre de Salou. Idéal pour les familles, les groupes et les fêtes.'],
    'Celebra en Hanaki': ['Celebra-ho a Hanaki', 'Celebrate at Hanaki', 'Fêtez chez Hanaki'],
    'Sabores que compartes, momentos que recuerdas.': ['Sabors que comparteixes, moments que recordes.', 'Flavours you share, moments you remember.', 'Des saveurs à partager, des moments à retenir.'],
    'Cumpleaños': ['Aniversaris', 'Birthdays', 'Anniversaires'],
    'Grupos': ['Grups', 'Groups', 'Groupes'],
    'Cenas especiales': ['Sopars especials', 'Special dinners', 'Dîners spéciaux'],
    'RESERVA PARA TU GRUPO': ['RESERVA PER AL TEU GRUP', 'BOOK FOR YOUR GROUP', 'RÉSERVEZ POUR VOTRE GROUPE'],
    'Reserva tu mesa': ['Reserva la teva taula', 'Book your table', 'Réservez votre table'],
    'FECHA': ['DATA', 'DATE', 'DATE'],
    'HORA': ['HORA', 'TIME', 'HEURE'],
    'Elige hora': ['Tria hora', 'Choose a time', 'Choisir l’heure'],
    'ADULTOS': ['ADULTS', 'ADULTS', 'ADULTES'],
    'NIÑOS (3-8)': ['NENS (3-8)', 'KIDS (3-8)', 'ENFANTS (3-8)'],
    'NOMBRE': ['NOM', 'NAME', 'NOM'],
    'NOMBRE *': ['NOM *', 'NAME *', 'NOM *'],
    'TELÉFONO': ['TELÈFON', 'PHONE', 'TÉLÉPHONE'],
    'TELÉFONO *': ['TELÈFON *', 'PHONE *', 'TÉLÉPHONE *'],
    'COMENTARIOS': ['COMENTARIS', 'COMMENTS', 'COMMENTAIRES'],
    '(OPCIONAL)': ['(OPCIONAL)', '(OPTIONAL)', '(FACULTATIF)'],
    '¡Gracias! Mesa solicitada.': ['Gràcies! Taula sol·licitada.', 'Thank you! Table requested.', 'Merci ! Table demandée.'],
    'NUEVA RESERVA': ['NOVA RESERVA', 'NEW BOOKING', 'NOUVELLE RÉSERVATION'],
    'SÍGUENOS @HANAKISALOU →': ['SEGUEIX-NOS @HANAKISALOU →', 'FOLLOW US @HANAKISALOU →', 'SUIVEZ-NOUS @HANAKISALOU →'],
    'Pequeños placeres,': ['Petits plaers,', 'Small pleasures,', 'Petits plaisirs,'],
    'grandes momentos.': ['grans moments.', 'big moments.', 'grands moments.'],
    'Pequeños placeres, grandes momentos.': ['Petits plaers, grans moments.', 'Small pleasures, big moments.', 'Petits plaisirs, grands moments.'],
    'HORARIO': ['HORARI', 'OPENING HOURS', 'HORAIRES'],
    'Martes a domingo': ['Dimarts a diumenge', 'Tuesday to Sunday', 'Du mardi au dimanche'],
    'Todos los días': ['Cada dia', 'Every day', 'Tous les jours'],
    'Abierto todos los días.': ['Obert cada dia.', 'Open every day.', 'Ouvert tous les jours.'],
    'Todos los días 12:30–16:30 · 19:30–23:30': ['Cada dia 12:30–16:30 · 19:30–23:30', 'Every day 12:30–16:30 · 19:30–23:30', 'Tous les jours 12:30–16:30 · 19:30–23:30'],
    'Lunes cerrado.': ['Dilluns tancat.', 'Closed on Mondays.', 'Fermé le lundi.'],
    'UBICACIÓN': ['UBICACIÓ', 'LOCATION', 'ADRESSE'],
    'CONTACTO': ['CONTACTE', 'CONTACT', 'CONTACT'],
    'EFECTIVO': ['EFECTIU', 'CASH', 'ESPÈCES'],
    'WHATSAPP': ['WHATSAPP', 'WHATSAPP', 'WHATSAPP'],
    '© 2026 Hanaki Salou · Restaurante japonés': ['© 2026 Hanaki Salou · Restaurant japonès', '© 2026 Hanaki Salou · Japanese restaurant', '© 2026 Hanaki Salou · Restaurant japonais'],
    'Aviso legal': ['Avís legal', 'Legal notice', 'Mentions légales'],
    'Términos y condiciones': ['Termes i condicions', 'Terms & conditions', 'Conditions générales'],
    'Cookies': ['Galetes', 'Cookies', 'Cookies'],
    'Configurar cookies': ['Configurar galetes', 'Cookie settings', 'Paramètres des cookies'],
    'Usamos cookies': ['Fem servir galetes', 'We use cookies', 'Nous utilisons des cookies'],
    'RECHAZAR': ['REBUTJAR', 'REJECT', 'REFUSER'],
    'CONFIGURAR': ['CONFIGURAR', 'SETTINGS', 'PARAMÉTRER'],
    'GUARDAR': ['DESAR', 'SAVE', 'ENREGISTRER'],
    'ACEPTAR TODAS': ['ACCEPTAR-LES TOTES', 'ACCEPT ALL', 'TOUT ACCEPTER'],
    'Necesarias': ['Necessàries', 'Necessary', 'Nécessaires'],
    'Contenido de terceros': ['Contingut de tercers', 'Third-party content', 'Contenu tiers'],
    'Análisis': ['Anàlisi', 'Analytics', 'Analyse'],
    'Al confirmar aceptas la': ['En confirmar acceptes la', 'By confirming you accept the', 'En confirmant, vous acceptez la'],
    'política de privacidad': ['política de privacitat', 'privacy policy', 'politique de confidentialité'],
    'y los': ['i els', 'and the', 'et les'],
    'términos': ['termes', 'terms', 'conditions'],
    'Tu reseña se guarda solo en este navegador.': ['La teva ressenya només es desa en aquest navegador.', 'Your review is only stored in this browser.', 'Votre avis est enregistré uniquement dans ce navigateur.'],
    'Privacidad': ['Privacitat', 'Privacy', 'Confidentialité'],
    '← INICIO': ['← INICI', '← HOME', '← ACCUEIL'],
    'Buffet a la carta': ['Bufet a la carta', 'À la carte buffet', 'Buffet à la carte'],
    'Todo lo que ves está incluido en el precio del buffet. Pídelo desde la tablet y repite las veces que quieras.': ['Tot el que veus està inclòs en el preu del bufet. Demana-ho des de la tauleta i repeteix tantes vegades com vulguis.', 'Everything you see is included in the buffet price. Order from the tablet and repeat as often as you like.', 'Tout ce que vous voyez est inclus dans le prix du buffet. Commandez sur la tablette et reprenez autant que vous le souhaitez.'],
    'MEDIODÍA · L–V': ['MIGDIA · DL–DV', 'LUNCH · MON–FRI', 'MIDI · LUN–VEN'],
    '· niños 11,95 €': ['· nens 11,95 €', '· kids 11,95 €', '· enfants 11,95 €'],
    '· niños 13,95 €': ['· nens 13,95 €', '· kids 13,95 €', '· enfants 13,95 €'],
    'NOCHES, FINDES Y FESTIVOS': ['NITS, CAPS DE SETMANA I FESTIUS', 'EVENINGS, WEEKENDS & HOLIDAYS', 'SOIRS, WEEK-ENDS ET FÉRIÉS'],
    'Niños de 3 a 8 años · Bebidas y postres no incluidos.': ['Nens de 3 a 8 anys · Begudes i postres no inclosos.', 'Kids aged 3 to 8 · Drinks and desserts not included.', 'Enfants de 3 à 8 ans · Boissons et desserts non compris.'],
    'Reservar mesa ›': ['Reservar taula ›', 'Book a table ›', 'Réserver une table ›'],
    '¿Te ha entrado hambre?': ['T’ha entrat gana?', 'Feeling hungry?', 'Une petite faim ?'],
    'Martes a domingo 12:30–16:30 · 19:30–23:30 · Lunes cerrado': ['Dimarts a diumenge 12:30–16:30 · 19:30–23:30 · Dilluns tancat', 'Tuesday to Sunday 12:30–16:30 · 19:30–23:30 · Closed Mondays', 'Du mardi au dimanche 12:30–16:30 · 19:30–23:30 · Fermé le lundi'],
    'Elige cuántos sois, el día y la hora. Al confirmar se abrirá WhatsApp con tu reserva ya escrita.': ['Tria quants sou, el dia i l’hora. En confirmar s’obrirà WhatsApp amb la teva reserva ja escrita.', 'Choose how many of you, the day and the time. When you confirm, WhatsApp opens with your booking already written.', 'Indiquez le nombre de personnes, le jour et l’heure. En confirmant, WhatsApp s’ouvrira avec votre réservation déjà rédigée.'],
    '¿Cuántos sois?': ['Quants sou?', 'How many of you?', 'Combien êtes-vous ?'],
    '¿Más de 12 personas?': ['Més de 12 persones?', 'More than 12 people?', 'Plus de 12 personnes ?'],
    'Llámanos': ['Truca’ns', 'Call us', 'Appelez-nous'],
    'y lo organizamos.': ['i ho organitzem.', 'and we’ll arrange it.', 'et on s’en occupe.'],
    '¿Qué día?': ['Quin dia?', 'Which day?', 'Quel jour ?'],
    '¿A qué hora?': ['A quina hora?', 'What time?', 'À quelle heure ?'],
    'Tus datos': ['Les teves dades', 'Your details', 'Vos coordonnées'],
    'EMAIL': ['EMAIL', 'EMAIL', 'E-MAIL'],
    'TU RESERVA': ['LA TEVA RESERVA', 'YOUR BOOKING', 'VOTRE RÉSERVATION'],
    'Personas': ['Persones', 'Guests', 'Personnes'],
    'Día': ['Dia', 'Day', 'Jour'],
    'Hora': ['Hora', 'Time', 'Heure'],
    'CONFIRMAR LA RESERVA': ['CONFIRMAR LA RESERVA', 'CONFIRM BOOKING', 'CONFIRMER LA RÉSERVATION'],
    'Mesa solicitada': ['Taula sol·licitada', 'Table requested', 'Table demandée'],
    'Tu mensaje de reserva para': ['El teu missatge de reserva per a', 'Your booking message for', 'Votre message de réservation pour'],
    'el': ['el', 'on', 'le'],
    'a las': ['a les', 'at', 'à'],
    'ya está escrito. Solo falta que pulses enviar en WhatsApp. Te responderemos en breve para confirmarla.': ['ja està escrit. Només cal que premis enviar a WhatsApp. Et respondrem aviat per confirmar-la.', 'is ready. Just tap send in WhatsApp. We’ll reply shortly to confirm.', 'est prêt. Il ne reste qu’à appuyer sur envoyer dans WhatsApp. Nous vous répondrons vite pour confirmer.'],
    'VOLVER AL INICIO': ['TORNAR A L’INICI', 'BACK TO HOME', 'RETOUR À L’ACCUEIL'],
    'VER LA CARTA': ['VEURE LA CARTA', 'SEE THE MENU', 'VOIR LA CARTE'],
    'Adultos': ['Adults', 'Adults', 'Adultes'],
    'Desde 9 años': ['Des de 9 anys', 'Age 9+', 'Dès 9 ans'],
    'Niños': ['Nens', 'Kids', 'Enfants'],
    'De 3 a 8 años': ['De 3 a 8 anys', 'Age 3–8', 'De 3 à 8 ans'],
    'Bebés': ['Nadons', 'Babies', 'Bébés'],
    'Menores de 3 · gratis': ['Menors de 3 · gratis', 'Under 3 · free', 'Moins de 3 ans · gratuit'],
    'Elige un día': ['Tria un dia', 'Choose a day', 'Choisissez un jour'],
    'Elige una hora': ['Tria una hora', 'Choose a time', 'Choisissez une heure'],
    'Falta tu nombre': ['Falta el teu nom', 'Add your name', 'Indiquez votre nom'],
    'Falta tu teléfono': ['Falta el teu telèfon', 'Add your phone', 'Indiquez votre téléphone'],
    'Los lunes está cerrado': ['Els dilluns és tancat', 'Closed on Mondays', 'Fermé le lundi'],
    'Se abrirá WhatsApp con tu reserva ya escrita': ['S’obrirà WhatsApp amb la teva reserva ja escrita', 'WhatsApp will open with your booking ready', 'WhatsApp s’ouvrira avec votre réservation prête'],
    'Todo listo': ['Tot a punt', 'All set', 'Tout est prêt'],
    'Sin elegir': ['Sense triar', 'Not chosen', 'Non choisi'],
    'Tu nombre': ['El teu nom', 'Your name', 'Votre nom'],
    'Alergias, cumpleaños, trona…': ['Al·lèrgies, aniversaris, trona…', 'Allergies, birthdays, high chair…', 'Allergies, anniversaire, chaise haute…'],
    'Alergias, preferencias de mesa…': ['Al·lèrgies, preferències de taula…', 'Allergies, table preferences…', 'Allergies, préférences de table…'],
    'L': ['Dl', 'M', 'L'], 'M': ['Dt', 'T', 'M'], 'X': ['Dc', 'W', 'M'], 'J': ['Dj', 'T', 'J'], 'V': ['Dv', 'F', 'V'], 'S': ['Ds', 'S', 'S'], 'D': ['Dg', 'S', 'D'],
    'Sushi': ['Sushi', 'Sushi', 'Sushi'],
    'Plato especial': ['Plat especial', 'Special dishes', 'Plats spéciaux'],
    'Entrantes': ['Entrants', 'Starters', 'Entrées'],
    'Arroz y pasta': ['Arròs i pasta', 'Rice & noodles', 'Riz et nouilles'],
    'Fritos': ['Fregits', 'Fried', 'Fritures'],
    'Plancha': ['Planxa', 'Grill', 'Plancha'],
    'Salteados': ['Saltats', 'Stir-fries', 'Sautés'],
    'Sopa de miso': ['Sopa de miso', 'Miso soup', 'Soupe miso'],
    'Ensalada césar': ['Amanida cèsar', 'Caesar salad', 'Salade César'],
    'Ensalada wakame': ['Amanida wakame', 'Wakame salad', 'Salade wakame'],
    'Gyoza de pollo': ['Gyoza de pollastre', 'Chicken gyoza', 'Gyoza au poulet'],
    'Gyoza vegetal': ['Gyoza vegetal', 'Vegetable gyoza', 'Gyoza aux légumes'],
    'Rollitos de pollo': ['Rotlles de pollastre', 'Chicken rolls', 'Rouleaux au poulet'],
    'Rollitos vegetales': ['Rotlles vegetals', 'Vegetable rolls', 'Rouleaux aux légumes'],
    'Wantun frito': ['Wantun fregit', 'Fried wonton', 'Wonton frit'],
    'Panecillo': ['Panet', 'Steamed bun', 'Petit pain vapeur'],
    'Pastel de calabaza': ['Pastís de carbassa', 'Pumpkin cake', 'Gâteau de potiron'],
    'Patatas fritas': ['Patates fregides', 'French fries', 'Frites'],
    'Ramen de ternera': ['Ramen de vedella', 'Beef ramen', 'Ramen au bœuf'],
    'Ramen de pollo rebozado': ['Ramen de pollastre arrebossat', 'Breaded chicken ramen', 'Ramen au poulet pané'],
    'Ramen de langostino': ['Ramen de llagostí', 'Prawn ramen', 'Ramen aux crevettes'],
    'Guabao de pollo picante': ['Guabao de pollastre picant', 'Spicy chicken guabao', 'Guabao au poulet épicé'],
    'Guabao de cerdo': ['Guabao de porc', 'Pork guabao', 'Guabao au porc'],
    'Guabao de pato': ['Guabao d’ànec', 'Duck guabao', 'Guabao au canard'],
    'Guabao de langostino': ['Guabao de llagostí', 'Prawn guabao', 'Guabao aux crevettes'],
    'Arroz Hanaki': ['Arròs Hanaki', 'Hanaki rice', 'Riz Hanaki'],
    'Arroz blanco': ['Arròs blanc', 'White rice', 'Riz blanc'],
    'verduras y gambas': ['verdures i gambes', 'vegetables & shrimp', 'légumes et crevettes'],
    'Fideos de arroz': ['Fideus d’arròs', 'Rice noodles', 'Nouilles de riz'],
    'verduras y pollo': ['verdures i pollastre', 'vegetables & chicken', 'légumes et poulet'],
    'Tallarines Hanaki': ['Tallarines Hanaki', 'Hanaki noodles', 'Nouilles Hanaki'],
    'Tempura de langostino': ['Tempura de llagostí', 'Prawn tempura', 'Tempura de crevettes'],
    'Tempura de verduras': ['Tempura de verdures', 'Vegetable tempura', 'Tempura de légumes'],
    'con sal y pimienta': ['amb sal i pebre', 'salt & pepper', 'sel et poivre'],
    'Plátano frito con miel': ['Plàtan fregit amb mel', 'Fried banana with honey', 'Banane frite au miel'],
    'Langostinos con sésamo': ['Llagostins amb sèsam', 'Sesame prawns', 'Crevettes au sésame'],
    'Pollo quimono': ['Pollastre quimono', 'Kimono chicken', 'Poulet kimono'],
    'Katsu de pollo': ['Katsu de pollastre', 'Chicken katsu', 'Katsu de poulet'],
    'Cerdo agridulce': ['Porc agredolç', 'Sweet & sour pork', 'Porc aigre-doux'],
    'Pollo al limón': ['Pollastre amb llimona', 'Lemon chicken', 'Poulet au citron'],
    'Bao frito de cerdo': ['Bao fregit de porc', 'Fried pork bao', 'Bao frit au porc'],
    'Nuggets de pollo': ['Nuggets de pollastre', 'Chicken nuggets', 'Nuggets de poulet'],
    'Anillas de calamar': ['Anelles de calamar', 'Squid rings', 'Anneaux de calamar'],
    'Muslitos de mar': ['Cuixetes de mar', 'Seafood sticks', 'Bâtonnets de la mer'],
    'Alitas de pollo': ['Aletes de pollastre', 'Chicken wings', 'Ailes de poulet'],
    'Boniato dulce': ['Moniato dolç', 'Sweet potato', 'Patate douce'],
    'Brocheta de gambas': ['Broqueta de gambes', 'Shrimp skewer', 'Brochette de crevettes'],
    'Brocheta de pollo': ['Broqueta de pollastre', 'Chicken skewer', 'Brochette de poulet'],
    'Brocheta de salmón': ['Broqueta de salmó', 'Salmon skewer', 'Brochette de saumon'],
    'Brocheta de atún': ['Broqueta de tonyina', 'Tuna skewer', 'Brochette de thon'],
    'Navajas': ['Navalles', 'Razor clams', 'Couteaux'],
    'Rejos': ['Rejos', 'Squid tentacles', 'Tentacules de calamar'],
    'Espárragos': ['Espàrrecs', 'Asparagus', 'Asperges'],
    'Gambas picantes': ['Gambes picants', 'Spicy shrimp', 'Crevettes épicées'],
    'Ternera con salsa de ostras': ['Vedella amb salsa d’ostres', 'Beef in oyster sauce', 'Bœuf sauce huître'],
    'Pollo con almendras': ['Pollastre amb ametlles', 'Chicken with almonds', 'Poulet aux amandes'],
    'Ternera al curry': ['Vedella al curri', 'Beef curry', 'Bœuf au curry'],
    'Ternera picante': ['Vedella picant', 'Spicy beef', 'Bœuf épicé'],
    'Ternera teriyaki': ['Vedella teriyaki', 'Beef teriyaki', 'Bœuf teriyaki'],
    'Pollo picante': ['Pollastre picant', 'Spicy chicken', 'Poulet épicé'],
    'Pollo teriyaki': ['Pollastre teriyaki', 'Chicken teriyaki', 'Poulet teriyaki']
  };
  const DAYS = { domingo: ['diumenge', 'Sunday', 'dimanche'], lunes: ['dilluns', 'Monday', 'lundi'], martes: ['dimarts', 'Tuesday', 'mardi'], 'miércoles': ['dimecres', 'Wednesday', 'mercredi'], jueves: ['dijous', 'Thursday', 'jeudi'], viernes: ['divendres', 'Friday', 'vendredi'], 'sábado': ['dissabte', 'Saturday', 'samedi'] };
  const MON = { enero: ['gener', 'January', 'janvier'], febrero: ['febrer', 'February', 'février'], marzo: ['març', 'March', 'mars'], abril: ['abril', 'April', 'avril'], mayo: ['maig', 'May', 'mai'], junio: ['juny', 'June', 'juin'], julio: ['juliol', 'July', 'juillet'], agosto: ['agost', 'August', 'août'], septiembre: ['setembre', 'September', 'septembre'], octubre: ['octubre', 'October', 'octobre'], noviembre: ['novembre', 'November', 'novembre'], diciembre: ['desembre', 'December', 'décembre'] };
  const W = { adulto: ['adult', 'adult', 'adulte'], adultos: ['adults', 'adults', 'adultes'], 'niño': ['nen', 'kid', 'enfant'], 'niños': ['nens', 'kids', 'enfants'], 'bebé': ['nadó', 'baby', 'bébé'], 'bebés': ['nadons', 'babies', 'bébés'] };
  const party = (s, i) => s.replace(/(\d+) (adultos?|niños?|bebés?)/g, (_, n, w) => n + ' ' + W[w][i]);
  const P = [
    [/^VER CARTA COMPLETA · (\d+) PLATOS$/, (m, i) => [`VEURE LA CARTA COMPLETA · ${m[1]} PLATS`, `SEE FULL MENU · ${m[1]} DISHES`, `VOIR LA CARTE COMPLÈTE · ${m[1]} PLATS`][i]],
    [/^(\d+) uds?\.( · segunda \+1 €)?$/, (m, i) => m[1] + [' u.', ' pcs', ' pcs'][i] + (m[2] ? [' · segona +1 €', ' · second +1 €', ' · deuxième +1 €'][i] : '')],
    [/^Segunda \+1 €$/, (m, i) => ['Segona +1 €', 'Second +1 €', 'Deuxième +1 €'][i]],
    [/^(\d+) uds\.$/, (m, i) => m[1] + [' u.', ' pcs', ' pcs'][i]],
    [/^¡Gracias, (.*)!$/, (m, i) => [`Gràcies, ${m[1]}!`, `Thank you, ${m[1]}!`, `Merci, ${m[1]} !`][i]],
    [/^Te confirmaremos la reserva para (.*) por teléfono en breve\.$/, (m, i) => [`Et confirmarem la reserva per a ${party(m[1], 0)} per telèfon aviat.`, `We’ll confirm your booking for ${party(m[1], 1)} by phone shortly.`, `Nous confirmerons votre réservation pour ${party(m[1], 2)} par téléphone.`][i]],
    [/^\d+ (adultos?|niños?|bebés?)( · \d+ (adultos?|niños?|bebés?))*$/, (m, i) => party(m[0], i)],
    [/^(domingo|lunes|martes|miércoles|jueves|viernes|sábado) (\d+) de (\w+)$/, (m, i) => i === 1 ? `${DAYS[m[1]][1]}, ${MON[m[3]] ? MON[m[3]][1] : m[3]} ${m[2]}` : `${DAYS[m[1]][i]} ${m[2]} ${i === 0 ? (/^[aeiou]/.test(MON[m[3]][0]) ? "d’" : 'de ') : ''}${MON[m[3]] ? MON[m[3]][i] : m[3]}`],
    [/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) (\d{4})$/, (m, i) => MON[m[1]][i] + ' ' + m[2]]
  ];
  let lang = 'es';
  try { lang = localStorage.getItem('hanaki-lang') || 'es'; } catch (e) {}
  const tr = s => {
    if (lang === 'es' || !s) return s;
    const k = s.trim(); if (!k) return s;
    const i = IX[lang], r = D[k];
    if (r) return s.replace(k, r[i]);
    for (const [re, f] of P) { const m = k.match(re); if (m) return s.replace(k, f(m, i)); }
    return s;
  };
  const doText = n => {
    const p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return;
    if (n.__t === undefined || n.nodeValue !== n.__t) n.__o = n.nodeValue;
    const t = tr(n.__o); n.__t = t; if (n.nodeValue !== t) n.nodeValue = t;
  };
  const doAttr = el => {
    const v = el.getAttribute('placeholder'); if (v == null) return;
    if (el.__pt === undefined || v !== el.__pt) el.__po = v;
    const t = tr(el.__po); el.__pt = t; if (v !== t) el.setAttribute('placeholder', t);
  };
  const walk = root => {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) doText(n);
    if (root.hasAttribute && root.hasAttribute('placeholder')) doAttr(root);
    root.querySelectorAll && root.querySelectorAll('[placeholder]').forEach(doAttr);
  };
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttr(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  const start = () => {
    mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
    document.documentElement.lang = lang; walk(document.body);
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  window.HanakiI18n = {
    get: () => lang,
    set: l => {
      lang = (l || 'es').toLowerCase();
      try { localStorage.setItem('hanaki-lang', lang); } catch (e) {}
      document.documentElement.lang = lang; walk(document.body);
      window.dispatchEvent(new CustomEvent('hanaki-lang', { detail: lang }));
    }
  };
})();
